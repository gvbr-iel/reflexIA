# Guía de desarrollo — HU-05: Anonimización y Resguardo de Datos Sensibles

## Descripción general

Este módulo implementa la **detección de datos sensibles** en los relatos de incidentes críticos (RF-05 / RNF-01). Antes de procesar cualquier reflexión, el sistema analiza el texto en busca de nombres propios de alumnos, docentes o establecimientos educativos y los destaca visualmente para que el estudiante los anonimice.

La detección se realiza en **frontend**, enviando el texto a la API de OpenRouter con un prompt prefijado. La IA devuelve la lista de palabras sensibles con sus posiciones, y el componente las destaca en rojo sin modificar el texto original. El estudiante corrige manualmente.

Criterios de aceptación de RF-05 / RNF-01 y dónde se cumplen:

| Criterio | Dónde |
|---|---|
| Validación previa del texto antes de evaluación | Botón "Detectar datos sensibles" en el asistente |
| Detección automática de nombres propios | `openRouterService.detectSensitiveData` + prompt prefijado |
| Bloqueo del procesamiento y solicitud de anonimización | `SensitiveDataPreview` muestra el resultado y solicita corrección |

> **Alcance:** el proyecto es **solo frontend**. La detección se hace vía API de OpenRouter; las API keys están en variables de entorno y en una lista de respaldo con rotación automática. Los modelos también rotan si uno falla o se agotan los tokens gratuitos.

### Ubicación en el código

```text
src/
├── models/
│   └── sensitiveData.ts                 # Interfaces, categorías, prompt y configuración
├── services/
│   └── openRouterService.ts             # Servicio de OpenRouter con rotación de keys y modelos
└── views/
    └── critical-incidents/
        ├── components/
        │   ├── SensitiveDataPreview.tsx  # Vista previa con palabras destacadas en rojo
        │   └── IncidentStepForm.tsx      # (modificado) Botón de detección
        │   └── IncidentWizard.tsx        # (modificado) Instancia el hook de detección
        └── hooks/
            └── useSensitiveDataDetector.ts  # Hook de lógica y estado de la detección
```

---

## Registro de cambios por etapa

### Etapa 1 — Modelos e interfaces TypeScript

**Archivo creado:** `src/models/sensitiveData.ts`
**Archivo modificado:** `src/models/index.ts`
**Archivo creado:** `.env.example`

Contratos del módulo:

- **Categorías** (`SensitiveCategory`, `SENSITIVE_CATEGORY_LABELS`): cuatro tipos de datos sensibles con etiquetas en español: nombre de alumno, nombre de docente, nombre de establecimiento y otro dato personal.
- **Palabra sensible** (`SensitiveWord`): palabra detectada con posición exacta en el texto original (`startIndex` inclusivo, `endIndex` exclusivo) y categoría. Las posiciones permiten reconstruir el texto con las partes sensibles destacadas sin depender de búsquedas por substring.
- **Resultado** (`SensitiveDataDetection`): texto original analizado, lista de palabras ordenadas por posición, y un flag `hasSensitiveData`.
- **Modelos de OpenRouter** (`OpenRouterModel`, `OPENROUTER_MODELS`): lista de 5 modelos gratuitos en orden de preferencia. El servicio intenta con el primero; si falla (429, 402, 503), pasa al siguiente.
- **API keys** (`OPENROUTER_API_KEYS`): lista de keys de respaldo con placeholders. La key principal se lee de `import.meta.env.VITE_OPENROUTER_API_KEY`; si falla por autenticación (401) o cuota (429), se rotan las de la lista.
- **Configuración** (`SensitiveDataConfig`, `DEFAULT_SENSITIVE_DATA_CONFIG`): temperatura 0 (determinista), máximo 1024 tokens, mínimo 10 caracteres para analizar.
- **Prompt del sistema** (`SENSITIVE_DATA_SYSTEM_PROMPT`): instrucciones detalladas para el modelo sobre qué detectar (nombres de alumnos, docentes, establecimientos, otros PII) y qué no (roles genéricos, ciudades, autores de bibliografía). La respuesta debe ser un JSON con la estructura exacta de `SensitiveWord[]`.

El modelo **no modifica ni extiende** los tipos de `criticalIncident.ts`. Se re-exporta desde `models/index.ts`.

El `.env.example` documenta la variable `VITE_OPENROUTER_API_KEY` con un placeholder.

### Etapa 2 — Servicio de OpenRouter con rotación de keys y modelos

**Archivo creado:** `src/services/openRouterService.ts`

Servicio que encapsula toda la comunicación con la API de OpenRouter para la detección de datos sensibles.

**Método público:**

- **`detectSensitiveData(text: string)`**: analiza el texto y devuelve un `SensitiveDataDetection` con las palabras sensibles encontradas. Si el texto es demasiado corto (`< 10` caracteres) devuelve un resultado vacío sin llamar a la API.

**Rotación automática de API keys:**

- La lista de keys se construye en runtime: primero `import.meta.env.VITE_OPENROUTER_API_KEY`, luego las keys de respaldo de `OPENROUTER_API_KEYS` (filtrar placeholders).
- Si una key falla con HTTP 401 (inválida), 403 (sin permisos) o 429 (cuota agotada), se salta a la siguiente key y se reinician los modelos.
- Si no hay ninguna key configurada (todas son placeholders), se lanza un error claro explicando cómo configurarlas.

**Rotación automática de modelos:**

- Para cada key, se intenta con cada modelo de `OPENROUTER_MODELS` en orden.
- Si un modelo falla con HTTP 402 (ya no es gratis), 429 (tokens agotados) o 503 (no disponible), se salta al siguiente modelo con la misma key.
- Si todos los modelos y keys fallan, se devuelve un error descriptivo con el último error.

**Validación y normalización de la respuesta:**

- El modelo debería devolver JSON puro, pero a veces lo envuelve en bloques de código markdown; el parser maneja ambos formatos.
- Cada palabra detectada se valida: campos obligatorios, categoría válida, posiciones dentro del rango del texto.
- Si las posiciones no coinciden con el substring del texto (el modelo alucinó las posiciones), se recalculan buscando la palabra en el texto.
- Si la palabra no existe en el texto (alucinación completa), se descarta.
- Se eliminan solapamientos: si dos detecciones se solapan, se conserva la más larga.
- El resultado final se ordena por `startIndex`.

**Logs de depuración:** cada rotación de key o modelo se registra en `console.warn` con el código HTTP y el nombre del modelo, para facilitar la depuración durante el desarrollo.

### Etapa 3 — Hook de lógica y estado `useSensitiveDataDetector`

**Archivo creado:** `src/views/critical-incidents/hooks/useSensitiveDataDetector.ts`

Hook que encapsula toda la lógica de detección, el ciclo de vida de la petición a la API y el estado reactivo del detector (R5), separando por completo la lógica de los componentes visuales.

**Interfaz pública expuesta (`UseSensitiveDataDetectorReturn`):**

- **`isAnalyzing`**: booleano que indica si el análisis hacia OpenRouter está en curso (activa loaders y deshabilita acciones concurrentes).
- **`analysisError`**: mensaje de error legible en español (o `null` si no hay error).
- **`detectedWords`**: lista de palabras sensibles (`SensitiveWord[]`) detectadas y normalizadas.
- **`analyzedText`**: texto original que fue analizado (permite validar la correspondencia con el preview).
- **`hasAnalyzed`**: booleano que indica si ya se completó al menos un análisis en el paso actual.
- **`hasSensitiveData`**: booleano derivado (`detectedWords.length > 0`) para saber rápidamente si existen palabras marcadas.
- **`analyze(text)`**: función asíncrona que valida la entrada, gestiona estados de carga y error, y llama a `openRouterService.detectSensitiveData(text)`.
- **`clearResults()`**: función para resetear el estado y cancelar peticiones en vuelo al cambiar de paso o editar el relato.

**Manejo de concurrencia y carreras:**
- Se utiliza una referencia mutable (`latestRequestRef`) para descartar respuestas tardías o respuestas obsoletas si el usuario lanza un nuevo análisis o limpia los resultados.
- Se implementa un bloqueo de reentrancia (`isAnalyzingRef`) para evitar múltiples llamadas paralelas accidentales si el usuario presiona repetidamente el botón.


