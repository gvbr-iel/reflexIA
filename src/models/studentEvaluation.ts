/**
 * @module models/studentEvaluation
 *
 * Evaluación de los talleres de un estudiante: la nota y el resultado que
 * pone el profesor guía.
 *
 * Vive en la colección `evaluations` de Cloud Firestore, con un documento por
 * estudiante (el id es su correo en minúsculas). Es una colección aparte de
 * `progress` porque el estudiante no debe poder escribir su propia nota: las
 * reglas de Firestore solo dejan escribir aquí a los profesores.
 *
 * Estado actual: **provisional**. Los datos se cargan a mano desde la consola
 * de Firebase mientras se construye la pantalla de reflexiones, donde el
 * profesor marcará el resultado y pondrá la nota. Si esa pantalla guarda en
 * otra colección o con otros campos, se cambian este modelo, la lectura del
 * panel docente (`teacherDashboardService`) y el bloque de `firestore.rules`.
 *
 * Los campos deben coincidir con las validaciones de `firestore.rules`.
 */

import type { WorkshopOutcome } from './criticalIncident';
import type { ProgressWorkshopId } from './studentProgress';

/** Nombre de la colección de Firestore. */
export const EVALUATIONS_COLLECTION = 'evaluations';

/** Evaluación de un taller. */
export interface WorkshopEvaluation {
  /** Nota de 1.0 a 7.0 (null si aún no se pone). */
  grade: number | null;
  /** Resultado del taller (null si aún no se marca). */
  outcome: WorkshopOutcome | null;
  /** Fecha de la evaluación en formato ISO 8601 (null si aún no se evalúa). */
  evaluatedAt: string | null;
}

/**
 * Documento de la colección `evaluations`.
 *
 * `workshops` solo trae los talleres que el profesor ya evaluó; un taller
 * sin entrada se considera sin evaluar.
 */
export interface StudentEvaluation {
  /** Correo institucional en minúsculas; es también el id del documento. */
  email: string;
  workshops: Partial<Record<ProgressWorkshopId, WorkshopEvaluation>>;
  /** Fecha de la última actualización en formato ISO 8601. */
  updatedAt: string;
}
