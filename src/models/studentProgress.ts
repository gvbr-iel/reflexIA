/**
 * @module models/studentProgress
 *
 * Tipos y constantes del resumen de avance de un estudiante.
 *
 * Cada estudiante publica en Cloud Firestore un resumen de su avance, en la
 * colección `progress`, con un documento por estudiante (el id del documento
 * es su correo en minúsculas, igual que en la whitelist). El panel docente
 * (`/docente`) lee esos resúmenes para mostrar el seguimiento.
 *
 * El resumen guarda solo números y estados: cuántos intentos usó, si aprobó
 * el marco teórico y si tiene un borrador. **Nunca** guarda el texto de los
 * relatos, que sigue en el almacenamiento local del estudiante.
 *
 * La nota y el resultado de cada taller NO van aquí: los pone el profesor y
 * el estudiante no debe poder escribirlos.
 *
 * Los campos deben coincidir con las validaciones de `firestore.rules`.
 */

// ─────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────

/** Nombre de la colección de Firestore. */
export const PROGRESS_COLLECTION = 'progress';

/**
 * Ids de los talleres que lleva el resumen. Son los mismos que usan
 * `models/workPacing.ts` y el servicio de talleres.
 */
export const PROGRESS_WORKSHOP_IDS = [
  'workshop-1',
  'workshop-2',
  'workshop-3',
  'workshop-4',
] as const;

/** Id de un taller del resumen ("workshop-1" a "workshop-4"). */
export type ProgressWorkshopId = (typeof PROGRESS_WORKSHOP_IDS)[number];

// ─────────────────────────────────────────────
// Resumen de avance
// ─────────────────────────────────────────────

/** Avance del estudiante en el cuestionario del marco teórico (HU-04). */
export interface TheoryProgressSummary {
  /** Si ya aprobó el cuestionario. */
  isApproved: boolean;
  /** Intentos que ya usó. */
  attemptsUsed: number;
  /** Porcentaje de su mejor intento, de 0 a 100 (null si no ha intentado). */
  bestScorePercentage: number | null;
  /** Fecha de aprobación en formato ISO 8601 (null si no ha aprobado). */
  approvedAt: string | null;
}

/** Avance del estudiante en un taller de incidentes críticos (HU-03). */
export interface WorkshopProgressSummary {
  /** Intentos de revisión usados (impulsos que pidió a la IA). */
  attemptsUsed: number;
  /** Si tiene un borrador guardado. */
  hasDraft: boolean;
}

/** Documento de la colección `progress`: el resumen de un estudiante. */
export interface StudentProgressSummary {
  /** Correo institucional en minúsculas; es también el id del documento. */
  email: string;
  theory: TheoryProgressSummary;
  /** Los 4 talleres, indexados por su id. */
  workshops: Record<ProgressWorkshopId, WorkshopProgressSummary>;
  /** Fecha de la última actualización en formato ISO 8601. */
  updatedAt: string;
}
