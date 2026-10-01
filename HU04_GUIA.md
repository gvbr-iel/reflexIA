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

---

*Las siguientes etapas se irán documentando a medida que se implementen.*
