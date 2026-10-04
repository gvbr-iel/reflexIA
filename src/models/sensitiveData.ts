/**
 * @module models/sensitiveData
 *
 * Tipos e interfaces globales para la Historia de Usuario 5:
 * Anonimización y Resguardo de Datos Sensibles (RF-05 / RNF-01).
 *
 * Centralizado en src/models/ para que otros módulos puedan
 * consultar el estado de detección sin acoplar dependencias
 * al feature critical-incidents/.
 *
 * La detección de datos sensibles se realiza exclusivamente en
 * frontend, enviando el texto a la API de OpenRouter con un
 * prompt prefijado. La IA identifica nombres propios de alumnos,
 * docentes y establecimientos educativos, y los devuelve como
 * una lista estructurada para que el componente los destaque
 * en rojo sin modificar el texto original.
 */

// ─────────────────────────────────────────────
// Categorías de datos sensibles
// ─────────────────────────────────────────────

/**
 * Categoría del dato sensible detectado.
 *
 * - `student_name`: nombre propio de un alumno o estudiante.
 * - `teacher_name`: nombre propio de un docente, profesor o asistente.
 * - `school_name`: nombre de un establecimiento educativo (colegio, escuela, liceo).
 * - `other_pii`: otro dato de identificación personal (dirección, teléfono, RUT, etc.).
 */
export type SensitiveCategory =
  | 'student_name'
  | 'teacher_name'
  | 'school_name'
  | 'other_pii';

/**
 * Etiquetas en español para cada categoría, usadas en la interfaz.
 */
export const SENSITIVE_CATEGORY_LABELS: Record<SensitiveCategory, string> = {
  student_name: 'Nombre de alumno',
  teacher_name: 'Nombre de docente',
  school_name: 'Nombre de establecimiento',
  other_pii: 'Otro dato personal',
};

// ─────────────────────────────────────────────
// Palabras sensibles detectadas
// ─────────────────────────────────────────────

/**
 * Una palabra o frase sensible detectada en el texto.
 *
 * Las posiciones (`startIndex`, `endIndex`) son índices del string
 * original (0-based, `endIndex` exclusivo), lo que permite al
 * componente de vista previa reconstruir el texto con las partes
 * sensibles destacadas sin depender de búsquedas por substring
 * (que fallarían si la misma palabra aparece más de una vez).
 */
export interface SensitiveWord {
  /** La palabra o frase exacta detectada en el texto. */
  word: string;
  /** Índice de inicio en el texto original (0-based, inclusivo). */
  startIndex: number;
  /** Índice de fin en el texto original (0-based, exclusivo). */
  endIndex: number;
  /** Categoría del dato sensible. */
  category: SensitiveCategory;
}

// ─────────────────────────────────────────────
// Resultado de la detección
// ─────────────────────────────────────────────

/**
 * Resultado completo de un análisis de datos sensibles.
 *
 * Contiene el texto original analizado y la lista de palabras
 * sensibles encontradas, ordenadas por posición.
 */
export interface SensitiveDataDetection {
  /** El texto original que fue analizado. */
  originalText: string;
  /** Lista de palabras sensibles detectadas, ordenadas por `startIndex`. */
  detectedWords: SensitiveWord[];
  /** Si se encontraron datos sensibles. */
  hasSensitiveData: boolean;
}

// ─────────────────────────────────────────────
// Configuración de la API de OpenRouter
// ─────────────────────────────────────────────

/**
 * Configuración de un modelo disponible en OpenRouter.
 *
 * Se mantiene una lista de modelos gratuitos que se rotan
 * automáticamente: si uno falla (tokens agotados, modelo
 * retirado o error), se intenta con el siguiente.
 */
export interface OpenRouterModel {
  /** Identificador del modelo en OpenRouter (e.g. "google/gemini-2.0-flash-exp:free"). */
  id: string;
  /** Nombre legible para logs y depuración. */
  name: string;
}

/**
 * Lista de modelos gratuitos de OpenRouter, en orden de preferencia.
 *
 * El servicio intenta con el primero; si falla (429, 402, 503 o
 * respuesta vacía), pasa al siguiente. Si todos fallan, devuelve
 * un error al usuario.
 *
 * ⚠️  Actualizar esta lista cuando OpenRouter cambie su oferta
 * de modelos gratuitos.
 */
export const OPENROUTER_MODELS: OpenRouterModel[] = [
  { id: 'openrouter/free',                    name: 'OpenRouter Free Router (auto)' },
  { id: 'nvidia/nemotron-3.5-lightning:free', name: 'NVIDIA Nemotron 3.5 Lightning (free)' },
  { id: 'liquid/lfm-2.5-2.6b:free',           name: 'LiquidAI LFM 2.5 2.6B (free)' },
  { id: 'google/gemma-4-26b-a4b-it:free',     name: 'Google Gemma 4 26B (free)' },
  { id: 'qwen/qwen3.8-27b:free',              name: 'Qwen 3.8 27B (free)' },
];

/**
 * Lista de API keys de OpenRouter con rotación automática.
 *
 * El servicio intenta con la primera; si recibe un error de
 * autenticación (401) o de cuota (429), pasa a la siguiente.
 *
 * ⚠️  Reemplazar los placeholders con API keys reales.
 * En producción estas keys vendrían del backend; por ahora
 * se leen de variables de entorno y de esta lista de respaldo.
 *
 * Las keys se leen en este orden de prioridad:
 * 1. `import.meta.env.VITE_OPENROUTER_API_KEY` (variable de entorno).
 * 2. Las keys de esta lista (respaldo).
 */
export const OPENROUTER_API_KEYS: string[] = [
  // ⚠️  REEMPLAZAR con API keys reales de OpenRouter
  'PLACEHOLDER_API_KEY_1',
  'PLACEHOLDER_API_KEY_2',
  'PLACEHOLDER_API_KEY_3',
];

/**
 * URL base de la API de OpenRouter.
 */
export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Configuración general del servicio de detección.
 */
export interface SensitiveDataConfig {
  /** Temperatura del modelo (0 = determinista, 1 = creativo). */
  temperature: number;
  /** Máximo de tokens en la respuesta. */
  maxTokens: number;
  /** Cantidad mínima de caracteres en el texto para habilitar el análisis. */
  minTextLength: number;
}

/**
 * Valores por defecto de la configuración de detección.
 */
export const DEFAULT_SENSITIVE_DATA_CONFIG: SensitiveDataConfig = {
  temperature: 0,       // Determinista: queremos resultados consistentes
  maxTokens: 1024,      // Suficiente para la respuesta JSON
  minTextLength: 10,    // No analizar textos muy cortos
};

// ─────────────────────────────────────────────
// Prompt del sistema
// ─────────────────────────────────────────────

/**
 * Prompt del sistema que instruye al modelo sobre qué detectar.
 *
 * El modelo debe devolver un JSON con la lista de palabras
 * sensibles encontradas, su posición en el texto y su categoría.
 * NO debe modificar ni corregir el texto original.
 */
export const SENSITIVE_DATA_SYSTEM_PROMPT = `Eres un asistente especializado en protección de datos personales en contextos educativos chilenos.

Tu tarea es analizar un texto escrito por un estudiante de pedagogía sobre un incidente crítico de su práctica profesional y detectar TODOS los datos sensibles que comprometan la identidad de personas o instituciones.

Debes detectar:
1. **Nombres propios de alumnos o estudiantes** (categoría: "student_name"): cualquier nombre de pila, apellido o combinación que identifique a un estudiante menor de edad o alumno.
2. **Nombres propios de docentes o profesionales** (categoría: "teacher_name"): nombres de profesores, directores, asistentes de aula, psicólogos u otros profesionales del establecimiento.
3. **Nombres de establecimientos educativos** (categoría: "school_name"): nombres de colegios, escuelas, liceos, jardines infantiles o cualquier institución educativa.
4. **Otros datos de identificación personal** (categoría: "other_pii"): direcciones, teléfonos, RUT, correos electrónicos, o cualquier dato que permita identificar a una persona.

NO debes marcar:
- Roles genéricos ("la profesora", "un estudiante", "el director").
- Nombres de ciudades o regiones generales.
- Nombres de autores de referencias bibliográficas.

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta (sin markdown, sin explicaciones, sin texto adicional):
{
  "detectedWords": [
    {
      "word": "texto exacto encontrado",
      "startIndex": 0,
      "endIndex": 5,
      "category": "student_name"
    }
  ]
}

Si no encuentras datos sensibles, responde:
{
  "detectedWords": []
}

IMPORTANTE:
- Los índices startIndex y endIndex deben ser las posiciones exactas (0-based) en el texto original.
- endIndex es exclusivo (el carácter en endIndex NO está incluido).
- La palabra "word" debe ser exactamente el substring del texto entre startIndex y endIndex.
- Ordena los resultados por startIndex de menor a mayor.
- Responde SOLO con el JSON, sin ningún otro texto.`;
