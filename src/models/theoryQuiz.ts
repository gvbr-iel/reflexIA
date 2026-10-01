/**
 * @module models/theoryQuiz
 *
 * Tipos e interfaces globales para la Historia de Usuario 4:
 * Verificación del dominio del marco teórico (REF-21 / RF-04).
 *
 * Centralizado en src/models/ para que otros módulos (navegación,
 * StudentLayout, talleres) puedan leer el estado de aprobación
 * sin acoplar dependencias al feature theory-verification/.
 */

// ─────────────────────────────────────────────
// Banco de preguntas
// ─────────────────────────────────────────────

/** Opción de respuesta dentro de una pregunta. */
export interface QuizOption {
  /** Identificador único de la opción (e.g. "a", "b", "c", "d"). */
  id: string;
  /** Texto de la opción mostrado al estudiante. */
  label: string;
}

/** Pregunta individual del banco de 30. */
export interface QuizQuestion {
  /** Identificador único de la pregunta (e.g. "q-01"). */
  id: string;
  /** Enunciado de la pregunta. */
  statement: string;
  /** Opciones de respuesta (mínimo 2, típicamente 4). */
  options: QuizOption[];
  /** ID de la opción correcta (debe coincidir con algún `QuizOption.id`). */
  correctOptionId: string;
  /**
   * Breve explicación que se muestra tras responder,
   * reforzando el aprendizaje del marco teórico.
   */
  explanation: string;
}

// ─────────────────────────────────────────────
// Respuestas del estudiante
// ─────────────────────────────────────────────

/** Respuesta del estudiante a una pregunta individual. */
export interface QuizAnswer {
  /** ID de la pregunta respondida. */
  questionId: string;
  /** ID de la opción seleccionada por el estudiante. */
  selectedOptionId: string;
  /** Si la respuesta fue correcta. */
  isCorrect: boolean;
}

// ─────────────────────────────────────────────
// Intento de evaluación
// ─────────────────────────────────────────────

/** Estado en que puede estar un intento. */
export type AttemptStatus = 'in-progress' | 'completed' | 'timed-out';

/** Registro completo de un intento de evaluación. */
export interface QuizAttempt {
  /** Número de intento (1, 2 o 3). */
  attemptNumber: number;
  /** Preguntas seleccionadas aleatoriamente para este intento. */
  questions: QuizQuestion[];
  /** Respuestas registradas hasta el momento. */
  answers: QuizAnswer[];
  /** Puntaje obtenido (cantidad de respuestas correctas). */
  score: number;
  /** Total de preguntas en el intento. */
  totalQuestions: number;
  /** Estado del intento. */
  status: AttemptStatus;
  /** Marca temporal ISO 8601 de inicio del intento. */
  startedAt: string;
  /** Marca temporal ISO 8601 de finalización (null si está en curso). */
  completedAt: string | null;
}

// ─────────────────────────────────────────────
// Resultado y estado de aprobación
// ─────────────────────────────────────────────

/**
 * Resultado consolidado de la evaluación teórica.
 * Otros módulos leen este contrato para decidir si los talleres
 * prácticos (RF-03) están desbloqueados.
 */
export interface QuizResult {
  /** Si el estudiante aprobó la evaluación teórica. */
  passed: boolean;
  /** Puntaje del mejor intento. */
  bestScore: number;
  /** Total de preguntas por intento. */
  totalQuestions: number;
  /** Porcentaje del mejor intento (0–100). */
  bestScorePercentage: number;
  /** Cantidad de intentos realizados. */
  attemptsUsed: number;
  /** Cantidad máxima de intentos permitidos. */
  maxAttempts: number;
  /** Si quedan intentos disponibles. */
  hasAttemptsRemaining: boolean;
}

/**
 * Estado de aprobación del marco teórico que otros módulos consumen.
 *
 * Ejemplo de uso en StudentLayout o en la rueda de navegación:
 * ```ts
 * import type { TheoryApprovalStatus } from '@/models/theoryQuiz';
 *
 * if (approval.isApproved) {
 *   // Desbloquear talleres prácticos
 * }
 * ```
 */
export interface TheoryApprovalStatus {
  /** Si el estudiante aprobó el cuestionario teórico. */
  isApproved: boolean;
  /** Resultado detallado (null si no ha intentado). */
  result: QuizResult | null;
  /** Marca temporal ISO 8601 de la aprobación (null si no aprobó). */
  approvedAt: string | null;
}

// ─────────────────────────────────────────────
// Configuración del cuestionario
// ─────────────────────────────────────────────

/** Configuración del cuestionario, potencialmente ajustable por el profesor (RF-06). */
export interface QuizConfig {
  /** Cantidad de preguntas por intento (de las 30 del banco). */
  questionsPerAttempt: number;
  /** Intentos máximos permitidos. */
  maxAttempts: number;
  /** Tiempo límite por intento en segundos. */
  timeLimitSeconds: number;
  /**
   * Puntaje mínimo para aprobar (cantidad de respuestas correctas).
   *
   * Nota: el README habla de "puntaje mínimo aprobatorio" y las reuniones
   * mencionaron 100% de aciertos. Por ahora se usa 7/10 (70%) como valor
   * por defecto. Se mantiene configurable para ajustar tras confirmación
   * con la cliente (ver AI_GUIDELINES.md §10).
   */
  passingScore: number;
}

/**
 * Valores por defecto de la configuración del cuestionario.
 *
 * Centralizados aquí para que tanto el hook como el service
 * usen los mismos valores sin duplicación.
 */
export const DEFAULT_QUIZ_CONFIG: QuizConfig = {
  questionsPerAttempt: 10,
  maxAttempts: 3,
  timeLimitSeconds: 15 * 60, // 15 minutos
  passingScore: 7,           // 7 de 10 (70%)
};

// ─────────────────────────────────────────────
// Contratos de servicio (API)
// ─────────────────────────────────────────────

/**
 * Payload que el frontend envía al backend al completar un intento.
 * Usado por `theoryQuizService.submitAttempt()`.
 */
export interface SubmitAttemptPayload {
  /** Respuestas del estudiante en orden. */
  answers: Pick<QuizAnswer, 'questionId' | 'selectedOptionId'>[];
  /** Número de intento (1–3). */
  attemptNumber: number;
  /** Duración del intento en segundos. */
  durationSeconds: number;
}

/**
 * Respuesta del backend al enviar un intento.
 * Usado por `theoryQuizService.submitAttempt()`.
 */
export interface SubmitAttemptResponse {
  /** Resultado del intento enviado. */
  attempt: QuizAttempt;
  /** Estado actualizado de aprobación. */
  approval: TheoryApprovalStatus;
}

/**
 * Respuesta del backend al solicitar el banco de preguntas.
 * El backend selecciona las 10 preguntas aleatorias y las devuelve
 * ya barajadas, sin exponer el banco completo al cliente.
 */
export interface FetchQuestionsResponse {
  /** Preguntas seleccionadas para este intento. */
  questions: QuizQuestion[];
  /** Configuración vigente del cuestionario. */
  config: QuizConfig;
}
