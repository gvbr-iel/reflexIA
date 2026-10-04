/**
 * @module utils/routes
 *
 * Rutas de los talleres de incidentes críticos (HU-03 / RF-03).
 *
 * Centralizadas para que la lista de talleres (RepositoryView) y el
 * asistente (WorkshopWorkspace) construyan la misma URL. Si el equipo
 * decide renombrar la ruta (AI_GUIDELINES §6 la ubica en /talleres),
 * se cambia aquí y en `App.tsx`.
 */

/** Ruta base del asistente de incidentes críticos. */
export const INCIDENTS_ROUTE = '/estudiante/innovaciones';

/** Ruta del asistente para un taller concreto. */
export function workshopRoute(workshopId: string): string {
  return `${INCIDENTS_ROUTE}/${workshopId}`;
}
