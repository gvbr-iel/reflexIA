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
