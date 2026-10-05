/**
 * @module utils/performanceStatus
 *
 * Convierte una nota en su estado de desempeño (colores de la rueda,
 * AI_GUIDELINES §4). Lo usa el panel docente.
 */

import { GRADE_THRESHOLDS, type PerformanceStatus } from '../models/teacherDashboard';

/**
 * Devuelve el estado de desempeño según la nota:
 * - sin nota o nota 1.0: no entregado
 * - de 1.1 a 3.9: reprobado
 * - de 4.0 a 4.9: aprobado
 * - de 5.0 a 7.0: sobresaliente
 */
export function getPerformanceStatus(grade: number | null): PerformanceStatus {
  if (grade === null || grade <= GRADE_THRESHOLDS.min) return 'not-submitted';
  if (grade < GRADE_THRESHOLDS.approved) return 'failed';
  if (grade < GRADE_THRESHOLDS.excellent) return 'approved';
  return 'excellent';
}
