/**
 * @module services/openRouterService
 *
 * Capa de servicio para la detección de datos sensibles (HU-05 / RF-05).
 *
 * Responsabilidades:
 * - Enviar texto a la API de OpenRouter para detectar datos sensibles.
 * - Rotar automáticamente entre modelos gratuitos si uno falla.
 * - Rotar automáticamente entre API keys si una falla por cuota o auth.
 * - Parsear la respuesta JSON del modelo y validarla.
 *
 * Regla R4 (AI_GUIDELINES §9): las vistas y componentes NO llaman
 * a la API directamente; lo hacen a través de este servicio.
 */

import type {
  SensitiveDataDetection,
  SensitiveWord,
  SensitiveCategory,
  OpenRouterModel,
} from '../models/sensitiveData';

import {
  OPENROUTER_MODELS,
  OPENROUTER_API_KEYS,
  OPENROUTER_BASE_URL,
  DEFAULT_SENSITIVE_DATA_CONFIG,
  SENSITIVE_DATA_SYSTEM_PROMPT,
} from '../models/sensitiveData';

// ─────────────────────────────────────────────
// Construcción de la lista de API keys
// ─────────────────────────────────────────────

/**
 * Construye la lista completa de API keys disponibles.
 *
 * Orden de prioridad:
 * 1. Variable de entorno `VITE_OPENROUTER_API_KEY`.
 * 2. Keys de la lista de respaldo (`OPENROUTER_API_KEYS`).
 *
 * Filtra placeholders y valores vacíos.
 */
function buildApiKeyList(): string[] {
  const keys: string[] = [];

  // 1. Variable de entorno (prioridad máxima)
  const envKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (envKey && typeof envKey === 'string' && !envKey.startsWith('PLACEHOLDER')) {
    keys.push(envKey);
  }

  // 2. Keys de respaldo (filtrar placeholders)
  for (const key of OPENROUTER_API_KEYS) {
    if (key && !key.startsWith('PLACEHOLDER') && !keys.includes(key)) {
      keys.push(key);
    }
  }

  return keys;
}

// ─────────────────────────────────────────────
// Errores específicos del servicio
// ─────────────────────────────────────────────

/** Códigos HTTP que disparan la rotación de modelo. */
const MODEL_ROTATION_CODES = new Set([
  400,  // Bad Request (parámetros no soportados por el proveedor)
  402,  // Payment Required (modelo ya no es gratis)
  404,  // Not Found (modelo retirado o endpoint no disponible)
  429,  // Too Many Requests (tokens o tasa agotada)
  500,  // Internal Server Error upstream
  502,  // Bad Gateway
  503,  // Service Unavailable (modelo temporalmente caído)
  504,  // Gateway Timeout
]);

/**
 * Códigos HTTP que disparan la rotación de API key.
 * 429 no va aquí: en los modelos gratuitos suele indicar saturación del
 * modelo o límite por minuto, así que conviene probar el siguiente modelo
 * (lo cubre MODEL_ROTATION_CODES) antes de descartar la key.
 */
const KEY_ROTATION_CODES = new Set([
  401,  // Unauthorized (key inválida)
  403,  // Forbidden (key sin permisos)
]);

// ─────────────────────────────────────────────
// Validación de la respuesta del modelo
// ─────────────────────────────────────────────

const VALID_CATEGORIES = new Set<SensitiveCategory>([
  'student_name',
  'teacher_name',
  'school_name',
  'other_pii',
]);

/**
 * Valida y normaliza las palabras sensibles devueltas por el modelo.
 *
 * - Descarta entradas con campos faltantes o tipos incorrectos.
 * - Verifica que `startIndex` y `endIndex` estén dentro del rango del texto.
 * - Verifica que `word` coincida con el substring del texto en esas posiciones.
 *   Si no coincide pero la palabra existe en el texto, recalcula las posiciones.
 * - Ordena por `startIndex` de menor a mayor.
 */
function validateAndNormalize(
  raw: unknown[],
  originalText: string,
): SensitiveWord[] {
  const valid: SensitiveWord[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;

    const entry = item as Record<string, unknown>;

    // Validar campos obligatorios
    if (typeof entry.word !== 'string' || entry.word.trim().length === 0) continue;
    if (!VALID_CATEGORIES.has(entry.category as SensitiveCategory)) continue;

    const word = entry.word as string;
    const category = entry.category as SensitiveCategory;
    let startIndex = typeof entry.startIndex === 'number' ? entry.startIndex : -1;
    let endIndex = typeof entry.endIndex === 'number' ? entry.endIndex : -1;

    // Verificar que las posiciones son coherentes con el texto
    if (
      startIndex >= 0 &&
      endIndex > startIndex &&
      endIndex <= originalText.length &&
      originalText.substring(startIndex, endIndex) === word
    ) {
      // Posiciones correctas
      valid.push({ word, startIndex, endIndex, category });
    } else {
      // Posiciones incorrectas: intentar encontrar la palabra en el texto.
      // Busca TODAS las ocurrencias para no perder duplicados.
      let searchFrom = 0;
      let found = false;
      while (searchFrom < originalText.length) {
        const idx = originalText.indexOf(word, searchFrom);
        if (idx === -1) break;

        // Solo agregar si no hay una entrada válida que ya cubra esta posición
        const alreadyCovered = valid.some(
          (v) => v.startIndex === idx && v.endIndex === idx + word.length,
        );

        if (!alreadyCovered) {
          valid.push({
            word,
            startIndex: idx,
            endIndex: idx + word.length,
            category,
          });
          found = true;
        }

        searchFrom = idx + 1;
      }

      // Si no se encontró en el texto, descartar (el modelo alucinó)
      if (!found) continue;
    }
  }

  // Ordenar por posición
  valid.sort((a, b) => a.startIndex - b.startIndex);

  // Eliminar solapamientos: si dos entradas se solapan, conservar la más larga
  const deduped: SensitiveWord[] = [];
  for (const word of valid) {
    const last = deduped[deduped.length - 1];
    if (last && word.startIndex < last.endIndex) {
      // Solapamiento: conservar la más larga
      if (word.endIndex - word.startIndex > last.endIndex - last.startIndex) {
        deduped[deduped.length - 1] = word;
      }
      continue;
    }
    deduped.push(word);
  }

  return deduped;
}

// ─────────────────────────────────────────────
// Parseo de la respuesta del modelo
// ─────────────────────────────────────────────

/**
 * Extrae el JSON de la respuesta del modelo.
 *
 * El modelo debería responder solo con JSON, pero a veces
 * lo envuelve en bloques de código markdown. Esta función
 * intenta ambos formatos.
 */
function parseModelResponse(content: string): unknown[] {
  // Limpiar posibles envolturas de markdown
  let cleaned = content.trim();

  // Quitar bloques ```json ... ``` o ``` ... ```
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }

  const parsed = JSON.parse(cleaned);

  // El modelo puede devolver { detectedWords: [...] } o directamente [...]
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (parsed && typeof parsed === 'object' && Array.isArray(parsed.detectedWords)) {
    return parsed.detectedWords;
  }

  throw new Error('Formato de respuesta inesperado del modelo.');
}

// ─────────────────────────────────────────────
// Llamada a la API de OpenRouter
// ─────────────────────────────────────────────

interface OpenRouterAPIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
    code?: number;
  };
}

/**
 * Realiza una llamada a la API de OpenRouter con un modelo y key específicos.
 *
 * @returns El contenido de la respuesta del modelo.
 * @throws Error con el código HTTP si la llamada falla.
 */
async function callOpenRouter(
  text: string,
  model: OpenRouterModel,
  apiKey: string,
): Promise<string> {
  const response = await fetch(OPENROUTER_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'ReflexIA - Detección de datos sensibles',
    },
    body: JSON.stringify({
      model: model.id,
      messages: [
        { role: 'system', content: SENSITIVE_DATA_SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      temperature: DEFAULT_SENSITIVE_DATA_CONFIG.temperature,
      max_tokens: DEFAULT_SENSITIVE_DATA_CONFIG.maxTokens,
      // Forzar respuesta JSON cuando el modelo lo soporte
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = new Error(`OpenRouter API error: ${response.status}`);
    (error as Error & { statusCode: number }).statusCode = response.status;
    throw error;
  }

  const data: OpenRouterAPIResponse = await response.json();

  // Verificar si la API devolvió un error en el body
  if (data.error) {
    const error = new Error(data.error.message || 'Error desconocido de OpenRouter');
    (error as Error & { statusCode: number }).statusCode = data.error.code || 500;
    throw error;
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content || content.trim().length === 0) {
    throw new Error('El modelo devolvió una respuesta vacía.');
  }

  return content;
}

// ─────────────────────────────────────────────
// Servicio público
// ─────────────────────────────────────────────

/**
 * Servicio de detección de datos sensibles vía OpenRouter.
 *
 * Implementa rotación automática de modelos y API keys:
 * - Para cada API key disponible, intenta todos los modelos.
 * - Si un modelo falla con un error de cuota/disponibilidad, pasa al siguiente.
 * - Si una key falla con un error de autenticación/cuota, pasa a la siguiente.
 * - Si todos fallan, devuelve un error descriptivo.
 */
export const openRouterService = {
  /**
   * Detecta datos sensibles en un texto.
   *
   * @param text Texto a analizar (campo del formulario de incidente).
   * @returns Resultado de la detección con las palabras sensibles.
   * @throws Error si no hay API keys configuradas o si todos los intentos fallan.
   */
  async detectSensitiveData(text: string): Promise<SensitiveDataDetection> {
    // Validar longitud mínima
    if (text.trim().length < DEFAULT_SENSITIVE_DATA_CONFIG.minTextLength) {
      return {
        originalText: text,
        detectedWords: [],
        hasSensitiveData: false,
      };
    }

    const apiKeys = buildApiKeyList();
    if (apiKeys.length === 0) {
      throw new Error(
        'No hay API keys de OpenRouter configuradas. ' +
        'Agrega VITE_OPENROUTER_API_KEY en tu archivo .env o ' +
        'configura las keys en src/models/sensitiveData.ts.',
      );
    }

    // Intentar con cada combinación de key + modelo
    let lastError: Error | null = null;

    for (const apiKey of apiKeys) {
      for (const model of OPENROUTER_MODELS) {
        try {
          const content = await callOpenRouter(text, model, apiKey);
          const rawWords = parseModelResponse(content);
          const detectedWords = validateAndNormalize(rawWords, text);

          return {
            originalText: text,
            detectedWords,
            hasSensitiveData: detectedWords.length > 0,
          };
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          const statusCode = (err as Error & { statusCode?: number }).statusCode;

          if (statusCode && KEY_ROTATION_CODES.has(statusCode)) {
            // Error de key: saltar a la siguiente key (y reiniciar modelos)
            console.warn(
              `[OpenRouter] Key fallida (HTTP ${statusCode}), rotando a la siguiente key...`,
            );
            break; // Sale del loop de modelos, continúa con la siguiente key
          }

          if (statusCode && MODEL_ROTATION_CODES.has(statusCode)) {
            // Error de modelo: saltar al siguiente modelo con la misma key
            console.warn(
              `[OpenRouter] Modelo "${model.name}" fallido (HTTP ${statusCode}), ` +
              `rotando al siguiente modelo...`,
            );
            continue;
          }

          // Otro error (red, parseo, etc.): intentar con el siguiente modelo
          console.warn(
            `[OpenRouter] Error con "${model.name}": ${lastError.message}. ` +
            `Intentando siguiente modelo...`,
          );
          continue;
        }
      }
    }

    // Todos los intentos fallaron
    throw new Error(
      'No se pudo analizar el texto. ' +
      'Se agotaron todos los modelos y API keys disponibles. ' +
      (lastError ? `Último error: ${lastError.message}` : '') +
      ' Verifica tu conexión a internet e inténtalo nuevamente.',
    );
  },
};
