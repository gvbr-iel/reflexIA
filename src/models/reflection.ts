/**
 * @module models/reflection
 *
 * Tipos e interfaces para la Historia de Usuario 2:
 * Retroalimentación asistida por IA y su revisión por el profesor guía (RF-02).
 *
 * El estudiante envía su incidente crítico y la IA propone "impulsos"
 * (orientaciones, nunca texto redactado). El profesor ve esa propuesta ANTES
 * de actuar: puede auditarla, editarla y validarla (AI_GUIDELINES §2, RF-02).
 *
 * Reutiliza `AIFeedback`, `AIFeedbackHint` y `WorkshopAttempt` del modelo de
 * incidentes críticos (HU-03) para no duplicar contratos: este archivo solo
 * agrega lo que es propio de la revisión docente.
 *
 * Frontend: el profesor trabaja con reflexiones de ejemplo (el almacenamiento
 * local particionado por usuario impide leer los envíos reales de otra cuenta).
 */

import type { AIFeedback, AIFeedbackHint, WorkshopAttempt } from './criticalIncident';

// ─────────────────────────────────────────────
// Estado de la revisión
// ─────────────────────────────────────────────

/**
 * Estado de la revisión docente de una reflexión.
 *
 * - `pending`: el profesor aún no la ha revisado; solo existe la propuesta de la IA.
 * - `edited`: el profesor modificó los impulsos pero todavía no los valida.
 * - `validated`: el profesor validó la retroalimentación y queda lista para
 *   entregarse al estudiante.
 */
export type ReviewStatus = 'pending' | 'edited' | 'validated';

/** Nombre visible de cada estado de revisión (interfaz en español). */
export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: 'Pendiente',
  edited: 'Editada',
  validated: 'Validada',
};

// ─────────────────────────────────────────────
// Reflexión a revisar
// ─────────────────────────────────────────────

/** Contenido enviado por el estudiante: los 4 campos del asistente. */
export type ReflectionContent = WorkshopAttempt['content'];

/**
 * Versión de la retroalimentación que maneja el profesor.
 *
 * Se guarda aparte de la propuesta original de la IA (`Reflection.aiFeedback`)
 * para poder auditar qué sugirió el sistema y qué cambió el docente.
 */
export interface ReflectionReview {
  /** Estado actual de la revisión. */
  status: ReviewStatus;
  /** Impulsos vigentes, con los cambios del docente si los hubo. */
  hints: AIFeedbackHint[];
  /** Comentario general vigente, con los cambios del docente si los hubo. */
  generalComment: string;
  /**
   * Nota real asignada por el docente guía (escala chilena de 1.0 a 7.0).
   * La IA solo sugiere una nota diagnóstica; la nota real es potestad humana
   * y exclusiva del docente. null si aún no ha sido calificada.
   */
  assignedGrade: number | null;
  /** Observaciones pedagógicas o justificación del docente sobre la nota real. */
  gradeNotes?: string;
  /** Marca temporal ISO 8601 de la última acción docente (null si ninguna). */
  reviewedAt: string | null;
}

/**
 * Reflexión de un estudiante lista para ser revisada por el profesor.
 *
 * El estudiante se identifica con su nombre y su correo institucional. La
 * regla de anonimización (AI_GUIDELINES §8) aplica a las personas que
 * aparecen dentro del relato, no al estudiante en práctica que lo escribe.
 */
export interface Reflection {
  /** Identificador único de la reflexión. */
  id: string;
  /**
   * Nombre del estudiante, leído de `profiles/{correo}` en Firestore.
   * Es null si aún no tiene un perfil cargado: en ese caso se muestra el correo.
   */
  studentName: string | null;
  /**
   * Correo institucional del estudiante, en minúsculas. Es el dato que une la
   * reflexión con su nota en Firestore (`evaluations/{correo}`) y con su
   * nombre (`profiles/{correo}`).
   */
  studentEmail: string;
  /** ID del taller al que pertenece (e.g. "workshop-1"). */
  workshopId: string;
  /** Número ordinal del taller (1–4). */
  workshopNumber: number;
  /** Número de intento de revisión con que se envió (1–3). */
  attemptNumber: number;
  /** Contenido enviado por el estudiante. */
  content: ReflectionContent;
  /** Marca temporal ISO 8601 del envío. */
  submittedAt: string;
  /** Propuesta original de la IA. No se modifica: sirve para auditar. */
  aiFeedback: AIFeedback;
  /** Estado de la revisión docente y su versión editable. */
  review: ReflectionReview;
}

// ─────────────────────────────────────────────
// Filtros y resumen del panel
// ─────────────────────────────────────────────

/** Valor que representa "sin filtro" en los selectores de la lista. */
export const ALL_FILTER = 'all' as const;

/** Filtros combinables de la lista de reflexiones. */
export interface ReflectionFilters {
  /** ID de un taller o `all`. */
  workshopId: string;
  /** Estado de revisión o `all`. */
  status: ReviewStatus | typeof ALL_FILTER;
  /** Texto libre; se busca en el nombre, el correo y el contenido del relato. */
  query: string;
}

/** Valores iniciales de los filtros: muestra todas las reflexiones. */
export const DEFAULT_REFLECTION_FILTERS: ReflectionFilters = {
  workshopId: ALL_FILTER,
  status: ALL_FILTER,
  query: '',
};

/** Conteo de reflexiones por estado, para el resumen del panel. */
export interface ReflectionStats {
  total: number;
  pending: number;
  edited: number;
  validated: number;
}

// ─────────────────────────────────────────────
// Payloads del servicio
// ─────────────────────────────────────────────

/**
 * Payload para guardar los cambios del profesor sobre los impulsos.
 * Usado por `reflectionService.saveEdit()`.
 */
export interface SaveReviewEditPayload {
  /** ID de la reflexión editada. */
  reflectionId: string;
  /** Impulsos con los cambios del docente. */
  hints: AIFeedbackHint[];
  /** Comentario general con los cambios del docente. */
  generalComment: string;
  /** Nota real asignada por el docente (o null si aún está en borrador sin calificar). */
  assignedGrade: number | null;
  /** Observaciones o justificación del docente sobre la nota. */
  gradeNotes?: string;
}

/**
 * Payload para validar la retroalimentación vigente de una reflexión.
 * Usado por `reflectionService.validate()`.
 * Requiere que el docente haya establecido la nota real del estudiante.
 */
export interface ValidateReviewPayload {
  /** ID de la reflexión validada. */
  reflectionId: string;
  /** Nota real y definitiva asignada por el docente (de 1.0 a 7.0). */
  assignedGrade: number;
  /** Observaciones o justificación del docente sobre la nota real. */
  gradeNotes?: string;
}
