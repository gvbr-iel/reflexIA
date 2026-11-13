/**
 * @module utils/theoryQuizGrading
 *
 * Reglas de la evaluación diagnóstica del marco teórico (CU-08, DEC-15):
 * nota de cada intento con tope por bloque, aprobación con 8 de 10 y
 * bloqueo después del intento 9.
 *
 * Son funciones puras: no leen ni escriben almacenamiento. El servicio
 * `theoryQuizService` las usa para guardar el resultado, y las pantallas
 * para mostrarlo. En el diagrama de secuencia del Lab 8 corresponden a
 * `contarAciertos()`, `calcularNota(intento)` y `verificarIntentosDisponibles()`
 * de ControlEvaluacion.
 */

import { DEFAULT_QUIZ_CONFIG, type QuizAttempt, type QuizConfig } from '../models/theoryQuiz';

/** Nota mínima de la escala chilena. */
export const MIN_GRADE = 1.0;
/** Nota máxima de la escala chilena. */
export const MAX_GRADE = 7.0;
/** Nota con la que se alcanza la exigencia. */
export const PASSING_GRADE = 4.0;
/**
 * Exigencia de la escala: con el 60 % de respuestas correctas se obtiene 4,0.
 * Propuesta pendiente de confirmar por el equipo (PEND-01, duda D-03).
 */
export const GRADE_REQUIREMENT = 0.6;

/** Estado del cuestionario de un estudiante según su historial de intentos. */
export interface QuizStatus {
  /** Si algún intento alcanzó el puntaje de aprobación. */
  isApproved: boolean;
  /** Cantidad de intentos rendidos. */
  attemptsUsed: number;
  /** Intentos que quedan antes del bloqueo (0 si aprobó o está bloqueado). */
  attemptsRemaining: number;
  /** Si agotó los intentos sin aprobar: debe habilitarlo el profesor guía (CU-20). */
  isBlocked: boolean;
  /** Mejor puntaje obtenido (null si no ha rendido). */
  bestScore: number | null;
  /** Mejor nota obtenida (null si no ha rendido). */
  bestGrade: number | null;
  /** Número del próximo intento (null si ya no puede rendir). */
  nextAttemptNumber: number | null;
  /** Nota máxima del próximo intento (null si ya no puede rendir). */
  nextGradeCap: number | null;
}

/** Datos mínimos de un intento que necesitan las reglas. */
export type GradedAttempt = Pick<QuizAttempt, 'attemptNumber' | 'score' | 'totalQuestions'>;

// ─────────────────────────────────────────────
// Validaciones
// ─────────────────────────────────────────────

function assertAttemptNumber(attemptNumber: number, config: QuizConfig): void {
  if (!Number.isInteger(attemptNumber) || attemptNumber < 1 || attemptNumber > config.maxAttempts) {
    throw new RangeError(
      `El número de intento debe ser un entero entre 1 y ${config.maxAttempts} (se recibió ${attemptNumber}).`,
    );
  }
}

function assertScore(score: number, totalQuestions: number): void {
  if (!Number.isInteger(totalQuestions) || totalQuestions < 1) {
    throw new RangeError(`El total de preguntas debe ser un entero positivo (se recibió ${totalQuestions}).`);
  }
  if (!Number.isInteger(score) || score < 0 || score > totalQuestions) {
    throw new RangeError(
      `Las respuestas correctas deben ser un entero entre 0 y ${totalQuestions} (se recibió ${score}).`,
    );
  }
}

/** Redondea a un decimal, como se informan las notas (6,25 → 6,3). */
function roundGrade(value: number): number {
  // Se suma un épsilon para que 6.25 no quede en 6.2 por la representación binaria.
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

// ─────────────────────────────────────────────
// Reglas
// ─────────────────────────────────────────────

/**
 * Nota máxima que se puede obtener en un intento: 7,0 en los intentos 1 a 3,
 * 5,0 en los 4 a 6 y 4,0 en los 7 a 9 (DEC-15).
 */
export function getGradeCap(attemptNumber: number, config: QuizConfig = DEFAULT_QUIZ_CONFIG): number {
  assertAttemptNumber(attemptNumber, config);
  const blockIndex = Math.floor((attemptNumber - 1) / config.attemptsPerBlock);
  // Si la configuración tiene menos topes que bloques, rige el último tope.
  return config.gradeCaps[Math.min(blockIndex, config.gradeCaps.length - 1)];
}

/**
 * Nota por aciertos en la escala de 1,0 a 7,0, sin tope.
 * Con exigencia del 60 %: 0 aciertos dan 1,0, 6 de 10 dan 4,0 y 10 de 10 dan 7,0.
 */
export function calculateRawGrade(score: number, totalQuestions: number): number {
  assertScore(score, totalQuestions);
  const ratio = score / totalQuestions;

  if (ratio < GRADE_REQUIREMENT) {
    return roundGrade(MIN_GRADE + (PASSING_GRADE - MIN_GRADE) * (ratio / GRADE_REQUIREMENT));
  }
  return roundGrade(
    PASSING_GRADE + (MAX_GRADE - PASSING_GRADE) * ((ratio - GRADE_REQUIREMENT) / (1 - GRADE_REQUIREMENT)),
  );
}

/** Nota final de un intento: la nota por aciertos, limitada por el tope del bloque. */
export function calculateGrade(
  score: number,
  attemptNumber: number,
  config: QuizConfig = DEFAULT_QUIZ_CONFIG,
): number {
  const rawGrade = calculateRawGrade(score, config.questionsPerAttempt);
  return Math.min(rawGrade, getGradeCap(attemptNumber, config));
}

/** Si un puntaje alcanza la aprobación (8 de 10). */
export function isPassingScore(score: number, config: QuizConfig = DEFAULT_QUIZ_CONFIG): boolean {
  assertScore(score, config.questionsPerAttempt);
  return score >= config.passingScore;
}

/**
 * Estado del cuestionario a partir del historial de intentos:
 * aprobado, intentos restantes y bloqueo después del último intento.
 */
export function getQuizStatus(
  attempts: GradedAttempt[],
  config: QuizConfig = DEFAULT_QUIZ_CONFIG,
): QuizStatus {
  const attemptsUsed = attempts.length;
  const isApproved = attempts.some((attempt) => isPassingScore(attempt.score, config));
  const isBlocked = !isApproved && attemptsUsed >= config.maxAttempts;
  const canAttempt = !isApproved && !isBlocked;

  const bestScore = attemptsUsed > 0 ? Math.max(...attempts.map((a) => a.score)) : null;
  const bestGrade =
    attemptsUsed > 0
      ? Math.max(...attempts.map((a) => calculateGrade(a.score, a.attemptNumber, config)))
      : null;

  const nextAttemptNumber = canAttempt ? attemptsUsed + 1 : null;

  return {
    isApproved,
    attemptsUsed,
    attemptsRemaining: canAttempt ? config.maxAttempts - attemptsUsed : 0,
    isBlocked,
    bestScore,
    bestGrade,
    nextAttemptNumber,
    nextGradeCap: nextAttemptNumber !== null ? getGradeCap(nextAttemptNumber, config) : null,
  };
}
