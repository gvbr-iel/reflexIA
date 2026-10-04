/**
 * @module utils/routes
 *
 * Rutas de los talleres de incidentes críticos (HU-03 / RF-03).
 *
 * La lista de talleres (RepositoryView) y el asistente de cada taller
 * (WorkshopWorkspace) viven bajo la misma sección, Talleres, para que
 * al abrir un taller no se salga de ella. Centralizadas aquí para que
 * ambas construyan la misma URL; si se renombran, se cambia aquí y en
 * `App.tsx`.
 */

/** Ruta de la sección de talleres (la lista). */
export const WORKSHOPS_ROUTE = '/estudiante/talleres';

/** Ruta del asistente de incidentes críticos para un taller concreto. */
export function workshopRoute(workshopId: string): string {
  return `${WORKSHOPS_ROUTE}/${workshopId}`;
}
