# Guía de desarrollo — HU-04: Verificación del Marco Teórico

## Descripción general

Este módulo implementa la **evaluación diagnóstica del marco teórico** sobre reflexión profesional (RF-04 / REF-21). Es el **primer paso obligatorio** del flujo del estudiante tras iniciar sesión: solo quienes aprueben esta evaluación pueden acceder a los talleres prácticos de incidentes críticos (RF-03).

### Ubicación en el código

```text
src/
├── models/
│   └── theoryQuiz.ts             # Interfaces, tipos y constantes configurables
├── services/
│   └── theoryQuizService.ts      # Banco de 30 preguntas, evaluación y persistencia
├── utils/
│   └── userStorage.ts            # Almacenamiento local aislado por UID de Firebase
└── views/
    └── theory-verification/
        ├── components/
        │   ├── QuizEngine.tsx     # Motor del cuestionario (navegación y selección)
        │   ├── ScoreCard.tsx      # Resultados con métricas, iconos Lucide y revisión
        │   └── QuizTimer.tsx      # Temporizador visual responsivo con Tailwind CSS
        ├── hooks/
        │   └── useTheoryQuiz.ts   # Lógica, estados y cronómetro del módulo
        └── TheoryQuizView.tsx     # Vista orquestadora principal
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

---

### Etapa 2 — Servicio y Banco de Preguntas

**Archivo creado:** `src/services/theoryQuizService.ts`

Implementa la capa de servicio que encapsula la lógica de evaluación. Utiliza persistencia local particionada por usuario con `userStorage.ts`:

**Métodos del servicio:**

- **`fetchQuestions()`**: obtiene 10 preguntas aleatorias del banco de 30 para un nuevo intento.
- **`submitAttempt(payload)`**: evalúa las respuestas enviadas, calcula el puntaje, persiste el resultado y actualiza el estado de aprobación.
- **`getApprovalStatus()`**: consulta de forma segura si el estudiante aprobó la evaluación (utilizado por el guardián de talleres `useTheoryGate`).
- **`getAttemptHistory()`**: devuelve el historial de intentos realizados por la cuenta activa.
- **`getConfig()`**: devuelve la configuración vigente del cuestionario.

**Banco de 30 preguntas** embebido en el servicio, cubriendo los temas del marco teórico de la plataforma: reflexión profesional (Schön, Van Manen), incidentes críticos, ciclo reflexivo, actuación mejorada, retroalimentación formativa, ética docente, anonimización y desbloqueo progresivo.

---

### Etapa 3 — Hook de lógica y estado

**Archivo creado:** `src/views/theory-verification/hooks/useTheoryQuiz.ts`

Encapsula toda la lógica y ciclo de vida del cuestionario:

1. **Carga inicial**: consulta en paralelo el estado de aprobación, historial de intentos y configuración. Si el estudiante ya aprobó, muestra el resultado directamente.
2. **Inicio de intento** (`startQuiz`): solicita 10 preguntas aleatorias al servicio e inicializa el temporizador.
3. **Durante el cuestionario**: el estudiante navega libremente entre preguntas y selecciona opciones.
4. **Envío** (`submitQuiz`): detiene el timer, envía las respuestas al servicio y actualiza la fase a `result`.
5. **Tiempo agotado**: si el temporizador llega a cero, auto-envía las respuestas acumuladas y marca el intento como expirado.
6. **Reintento** (`resetToIntro`): limpia el estado y vuelve a la pantalla introductoria si aún quedan intentos.

---

### Etapa 4 — Componentes visuales y Modernización Tailwind CSS

**Archivos actualizados:**
- `src/views/theory-verification/components/QuizTimer.tsx`
- `src/views/theory-verification/components/ScoreCard.tsx`
- `src/views/theory-verification/TheoryQuizView.tsx`

**Refactorización estética y de diseño:**
- **Eliminación total de estilos inline:** Todo el módulo se migró a clases de utilidad de Tailwind CSS (`tokens.css` y `tailwind.config.js`).
- **QuizTimer:** Temporizador con transiciones fluidas de color (`emerald` para tiempo seguro, `amber` para advertencia y `rose` con alerta visual cuando resta menos del 25%).
- **ScoreCard:** Tarjeta de resultados con diseño de métricas limpias, reemplazo de emojis por iconos vectoriales de `lucide-react` (`Trophy`, `CheckCircle2`, `XCircle`, `Clock`, `AlertCircle`) y revisión detallada de preguntas con justificación pedagógica.
- **TheoryQuizView:** Tarjeta introductoria con bordes suaves, badges informativos y botón estandarizado de la aplicación.

---

### Etapa 5 — Integración con el Sistema y Regla de Bloqueo RF-03 / RF-04

- **Desbloqueo lineal de Talleres:** En `RepositoryView.tsx` y `StudentLayout.tsx`, los talleres de incidentes críticos permanecen bloqueados con un icono de candado hasta que `theoryQuizService.getApprovalStatus()` retorne `isApproved: true`.
- **Aislamiento por UID:** Gracias a `userStorage.ts`, las evaluaciones y el progreso de un estudiante no se mezclan con los de otro si comparten el mismo equipo o navegador.
- **Resiliencia global:** La aplicación está protegida por un `ErrorBoundary` global en `src/main.tsx` que previene pantallas blancas ante anomalías en tiempo de ejecución.

---

## Verificación del módulo

```bash
# Verificación de tipos TypeScript
npm run lint

# Compilación de producción
npm run build
```

Para probar el flujo:
1. Iniciar sesión como estudiante (`alumno@ucen.cl`).
2. Ir a **Marco teórico** (`/estudiante/marco-teorico`).
3. Completar el cuestionario de 10 preguntas y verificar que el resultado desbloquee los talleres en `/estudiante/talleres`.
