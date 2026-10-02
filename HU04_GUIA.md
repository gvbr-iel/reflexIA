# Guía de desarrollo — HU-04: Verificación del Marco Teórico

## Descripción general

Este módulo implementa la **evaluación diagnóstica del marco teórico** sobre reflexión profesional (RF-04 / REF-21). Es el **primer paso obligatorio** del flujo del estudiante tras iniciar sesión: solo quienes aprueben esta evaluación pueden acceder a los talleres prácticos de incidentes críticos (RF-03).

### Ubicación en el código

```text
src/
├── models/
│   └── theoryQuiz.ts             # Interfaces y tipos compartidos
├── services/
│   └── theoryQuizService.ts      # Capa de comunicación con la API
└── views/
    └── theory-verification/
        ├── components/
        │   ├── QuizEngine.tsx     # Motor del cuestionario
        │   ├── ScoreCard.tsx      # Pantalla de resultados
        │   └── QuizTimer.tsx      # Temporizador visual
        ├── hooks/
        │   └── useTheoryQuiz.ts   # Lógica y estado del módulo
        └── TheoryQuizView.tsx     # Vista principal
```

---

## Registro de cambios por etapa

### Etapa 1 — Modelos e interfaces TypeScript

**Archivo creado:** `src/models/theoryQuiz.ts`

Se definieron las interfaces y tipos compartidos que sirven de contrato para todo el módulo:

- **Preguntas y opciones** (`QuizQuestion`, `QuizOption`): estructura de cada pregunta del banco de 30, con enunciado, opciones de respuesta, respuesta correcta y explicación pedagógica.
- **Respuestas del estudiante** (`QuizAnswer`): registra qué opción eligió y si fue correcta.
- **Intentos** (`QuizAttempt`, `AttemptStatus`): registro completo de cada intento con las 10 preguntas seleccionadas, respuestas, puntaje y marcas temporales. Un intento puede estar en curso, completado o expirado por tiempo.
- **Resultado y aprobación** (`QuizResult`, `TheoryApprovalStatus`): resultado consolidado con mejor puntaje e intentos usados. `TheoryApprovalStatus` es el contrato público que otros módulos (navegación, layout, talleres) importan para saber si el estudiante aprobó.
- **Configuración** (`QuizConfig`, `DEFAULT_QUIZ_CONFIG`): parámetros del cuestionario (10 preguntas por intento, 3 intentos máximos, 15 minutos, 70% para aprobar). Valores centralizados y configurables.
- **Contratos de API** (`SubmitAttemptPayload`, `SubmitAttemptResponse`, `FetchQuestionsResponse`): payloads de comunicación con el backend para enviar respuestas y obtener preguntas.

> **Nota:** El puntaje mínimo aprobatorio (70% vs 100%) está pendiente de confirmación con la cliente. Se mantiene como constante configurable.


### Etapa 2 — Servicio de API (mock local)

**Archivo creado:** `src/services/theoryQuizService.ts`

Se implementó la capa de servicio que encapsula toda la comunicación con el backend. Actualmente usa **mock local con localStorage** para permitir el desarrollo sin backend; cada método incluye un `TODO` con la llamada Axios real lista para conectar.

**Métodos del servicio:**

- **`fetchQuestions()`**: obtiene 10 preguntas aleatorias del banco de 30 para un nuevo intento.
- **`submitAttempt(payload)`**: envía las respuestas de un intento, las evalúa, persiste el resultado y actualiza el estado de aprobación.
- **`getApprovalStatus()`**: consulta si el estudiante aprobó la evaluación (contrato que otros módulos consumirán para desbloquear talleres).
- **`getAttemptHistory()`**: devuelve el historial de intentos realizados.
- **`getConfig()`**: devuelve la configuración vigente del cuestionario.

**Banco de 30 preguntas** embebido en el servicio, cubriendo los temas del marco teórico de la plataforma: reflexión profesional (Schön, Van Manen), incidentes críticos, ciclo reflexivo, actuación mejorada, retroalimentación formativa, ética docente, anonimización y desbloqueo progresivo.

> **Nota:** En producción, el banco de preguntas vivirá en el backend y el frontend no tendrá acceso al banco completo.


### Etapa 3 — Hook de lógica y estado

**Archivo creado:** `src/views/theory-verification/hooks/useTheoryQuiz.ts`

Se implementó el hook `useTheoryQuiz()` que encapsula toda la lógica del cuestionario, separando completamente el estado y las acciones del JSX de los componentes.

**Flujo gestionado por el hook:**

1. **Carga inicial**: consulta en paralelo el estado de aprobación, historial de intentos y configuración. Si el estudiante ya aprobó, muestra el resultado directamente.
2. **Inicio de intento** (`startQuiz`): solicita 10 preguntas aleatorias al service y arranca el temporizador.
3. **Durante el cuestionario**: el estudiante navega libremente entre preguntas (siguiente, anterior, salto directo) y selecciona respuestas.
4. **Envío** (`submitQuiz`): detiene el timer, envía las respuestas al service y recibe el resultado con el estado de aprobación actualizado.
5. **Tiempo agotado**: si el temporizador llega a cero, auto-envía las respuestas acumuladas y marca el intento como expirado.
6. **Reintento** (`resetToIntro`): limpia el estado y vuelve a la pantalla introductoria si quedan intentos disponibles.

**Estados expuestos** (para que los componentes manejen loading, error y vacío):
- `isLoading`: operación en curso (carga inicial o envío)
- `error`: mensaje de error en español, con indicación de cómo corregirlo
- `phase`: fase actual del flujo (`loading` → `intro` → `quiz` → `result`)


### Etapa 4 — Componentes del módulo

**Archivos creados:**
- `src/views/theory-verification/components/QuizTimer.tsx`
- `src/views/theory-verification/components/QuizEngine.tsx`
- `src/views/theory-verification/components/ScoreCard.tsx`

Se implementaron los tres componentes visuales del cuestionario, todos sin estado propio (reciben props desde el hook).

**QuizTimer** — Contador regresivo con barra de progreso e ícono de reloj. Cambia de color según el tiempo restante: normal (azul, > 50%), alerta (celeste, 25-50%), crítico (rojo con animación de pulso, < 25%).

**QuizEngine** — Motor interactivo del cuestionario:
- Navegación rápida por números de pregunta (botones circulares que indican estado: actual, respondida, pendiente)
- Tarjeta de pregunta con opciones de selección (radio buttons)
- Controles de navegación: anterior, siguiente, finalizar
- Integra el QuizTimer en el encabezado
- Muestra contador de intentos y respuestas completadas

**ScoreCard** — Pantalla de resultados:
- Indicador circular SVG con porcentaje de puntaje y animación
- Mensaje contextual: aprobado, reprobado o tiempo agotado
- Información de intentos usados y puntaje mínimo requerido
- Acciones según estado: "Continuar a talleres" (si aprobó), "Reintentar" (si quedan intentos) o "Contactar profesor" (sin intentos)
- Revisión desplegable de cada pregunta con la respuesta del estudiante, la correcta y una explicación pedagógica

---

*Las siguientes etapas se irán documentando a medida que se implementen.*

