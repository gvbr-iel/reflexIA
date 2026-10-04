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
        │   ├── SensitiveDataPreview.tsx # Vista previa con palabras destacadas en rojo
        │   └── IncidentWizard.tsx       # (modificado) Instancia el hook, botón y preview
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

### Etapa 4 — Componente de vista previa `SensitiveDataPreview`

**Archivo creado:** `src/views/critical-incidents/components/SensitiveDataPreview.tsx`

Componente presentacional desacoplado y sin estado propio (R5), responsable de visualizar los estados y resultados de la detección de datos sensibles.

**Comportamiento por estados (R9):**

1. **Inactivo (`!isAnalyzing && !analysisError && !hasAnalyzed`):** No se renderiza en el DOM (`null`).
2. **Cargando (`isAnalyzing`):** Muestra un skeleton animado de tres líneas (`animate-pulse`) con spinner circular e indicador textual en español.
3. **Error (`analysisError`):** Contenedor con ícono `AlertCircle`, mensaje detallado en español y botón `Button` (`variant="outline"`, `size="sm"`) para reintentar la llamada.
4. **Texto limpio (`!hasSensitiveData`):** Panel en tonos verdes (`accent-ia`) con ícono `ShieldCheck` informando que no se detectaron nombres propios ni instituciones educativas, con botón de cierre.
5. **Datos sensibles detectados (`hasSensitiveData`):**
   - **Encabezado:** Ícono `ShieldAlert` en rojo semántico (`perf-fail`), título con el número de coincidencias encontradas y botón `X` de descarte.
   - **Badges por categoría:** Etiquetas visuales (`student_name`, `teacher_name`, `school_name`, `other_pii`) con conteos exactos utilizando `SENSITIVE_CATEGORY_LABELS`.
   - **Texto con highlights:** Renderizado del texto original con las palabras sensibles envueltas en etiquetas `<mark>` con fondo tenue (`bg-perf-fail/15`), texto rojo (`text-perf-fail`) y tooltip descriptivo con la categoría.
   - **Aviso pedagógico:** Mensaje de confidencialidad y recordatorio de que el texto debe corregirse manualmente en el campo del formulario.

### Etapa 5 — Integración en el asistente `IncidentWizard`

**Archivo modificado:** `src/views/critical-incidents/components/IncidentWizard.tsx`

Se integró el flujo de detección en el asistente de talleres prácticos de incidentes críticos, manteniendo el formulario `IncidentStepForm.tsx` puro y desacoplado (R5).

**Detalles de la integración:**
- **Hook `useSensitiveDataDetector`:** Instanciado a nivel de wizard para compartir estado entre la botonera y el preview.
- **Botón "Detectar datos sensibles":** Agregado en la barra de acciones inmediatamente a la izquierda del botón "Siguiente". Diseñado con `variant="outline"`, ícono `Shield`, estado `isLoading` durante el análisis y deshabilitado si el texto del paso actual está en blanco.
- **Montaje del preview:** `SensitiveDataPreview` se monta condicionalmente justo debajo del campo de texto de `IncidentStepForm` ante estados de análisis, error o resultados disponibles.
- **Limpieza contextual:** Un `useEffect` suscrito al cambio de `wizard.currentStep.id` invoca `sensitiveDetector.clearResults()`, garantizando que al cambiar de paso se limpien los resaltados del paso anterior sin mezclar relatos.

### Etapa 6 — Documentación final y protocolo de pruebas

**Archivo actualizado:** `HU05_GUIA.md`

Se completó la documentación consolidada del módulo de anonimización (RF-05 / RNF-01), definiendo los protocolos de prueba manual para validar la detección, la respuesta visual y los casos de borde, así como el registro de discrepancias y trabajo pendiente con backend.

---

## Cómo probar

1. **Configurar la API Key de OpenRouter:**
   - Crear un archivo `.env` en la raíz del proyecto (basado en `.env.example`) y definir tu clave:
     ```env
     VITE_OPENROUTER_API_KEY=sk-or-v1-tu-clave-aqui
     ```
   - *Alternativa de respaldo:* Reemplazar los valores de `OPENROUTER_API_KEYS` en [`src/models/sensitiveData.ts`](src/models/sensitiveData.ts).
2. **Iniciar la aplicación:**
   ```bash
   npm run dev
   ```
   Abrir en el navegador la ruta `/estudiante/talleres`.
3. **Acceder a un taller de incidentes críticos:**
   - Con el marco teórico aprobado (o simulado a través del entorno de desarrollo), abrir el asistente del primer taller disponible.
4. **Prueba de detección de datos sensibles (Caso positivo):**
   - En el paso 1 (*Contexto*) o en cualquiera de los pasos, escribir un relato que contenga datos sensibles evidentes. Por ejemplo:
     > *"Durante la clase en la Escuela República de Chile, la profesora guía Marcela Soto nos pidió organizar a los estudiantes en grupos. El alumno Juanito Pérez y la alumna Martina comenzaron a discutir fuertemente."*
   - Presionar el botón **"Detectar datos sensibles"** (ubicado junto al botón "Siguiente").
   - Verificar que el botón muestre el spinner de carga (`isLoading`) y el panel despliegue el skeleton animado.
   - Al recibir la respuesta del modelo, verificar que:
     - El encabezado señale el número de coincidencias detectadas.
     - Los badges muestren el conteo agrupado por categorías (*Nombre de alumno*, *Nombre de docente*, *Nombre de establecimiento*).
     - El texto aparezca con los nombres propios e instituciones envueltos en `<mark>` con fondo suave y texto en color semántico rojo (`perf-fail`).
     - Al pasar el cursor sobre las palabras resaltadas, el tooltip del navegador (`title`) indique la categoría del dato.
5. **Prueba de corrección y texto limpio (Caso negativo):**
   - Modificar manualmente el texto en el textarea para anonimizarlo pedagógicamente:
     > *"Durante la clase en una escuela municipal básica, la profesora guía nos pidió organizar a los estudiantes en grupos. Un estudiante de tercer año básico y su compañera comenzaron a discutir fuertemente."*
   - Volver a presionar **"Detectar datos sensibles"**.
   - Verificar que el panel ahora muestre una tarjeta verde (`accent-ia`) con ícono `ShieldCheck` confirmando: *"No se detectaron datos sensibles en este paso del relato."*
6. **Prueba de ciclo de vida al cambiar de paso:**
   - Presionar "Siguiente" para avanzar al paso 2 (*Conflicto*).
   - Verificar que el panel de detección anterior desaparece automáticamente y el nuevo paso inicia limpio.
7. **Prueba de manejo de errores:**
   - Configurar temporalmente una clave inválida o desactivar la red.
   - Al presionar el botón, verificar que se muestre el contenedor de alerta con ícono `AlertCircle`, mensaje explicativo en español y botón "Reintentar".
8. **Verificación de tipado estático:**
   ```bash
   npx tsc --noEmit
   ```
   Debe completar sin ningún error de TypeScript (código 0).

---

## Discrepancias y pendientes del módulo

| Tema | Detalle | Referencia |
|---|---|---|
| **Bloqueo duro antes del envío** | En esta etapa de frontend, la detección es una herramienta asistiva y visual. El bloqueo estricto que impida finalizar o enviar el taller a revisión cuando existan datos sensibles se implementará cuando se conecte el flujo de entrega final (RF-02 / RF-05). | RF-05, RNF-01 |
| **Seguridad de API Keys** | En esta versión solo frontend, la llamada se realiza directamente desde el cliente. Para producción, esta lógica y las credenciales deben delegarse a un microservicio o proxy de backend para resguardar las claves privadas. | RNF de Seguridad |
| **Vigencia de modelos gratuitos** | La lista `OPENROUTER_MODELS` incluye modelos gratuitos de OpenRouter (Gemini Flash, Llama 3.1, Mistral, Qwen, Zephyr). Si la disponibilidad de modelos sin costo cambia en la plataforma externa, se deben actualizar los identificadores en `src/models/sensitiveData.ts`. | Mantenimiento |
| **Detección offline complementaria** | Si el usuario no tiene conexión o se agotan las cuotas de OpenRouter, actualmente se informa el error. Como mejora futura, se podría incorporar un validador local básico por expresiones regulares o listas de nombres comunes chilenos como salvaguarda secundaria. | Mejora futura |





