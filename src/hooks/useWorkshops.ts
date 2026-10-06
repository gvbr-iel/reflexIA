/**
 * @module hooks/useWorkshops
 *
 * Carga los 4 talleres con su estado en el flujo lineal (bloqueado,
 * disponible, en curso, aprobado o reprobado).
 *
 * Es hook global (R2) porque lo usan dos features: el asistente de
 * incidentes críticos (HU-03) y la lista de talleres (RepositoryView).
 * Así ambas pantallas leen la misma fuente y no pueden contradecirse.
 *
 * `refresh` vuelve a consultar sin mostrar la carga ni borrar la lista,
 * para actualizar los estados (por ejemplo "en curso" tras guardar un
 * borrador) sin que la pantalla parpadee.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

import type { Workshop } from '../models/criticalIncident';
import { criticalIncidentService } from '../services/criticalIncidentService';

/** Estado y acciones expuestos por el hook. */
export interface UseWorkshopsReturn {
  /** Los talleres con su estado (vacío mientras carga o si falló). */
  workshops: Workshop[];
  /** Si se están cargando los talleres por primera vez o al reintentar. */
  isLoading: boolean;
  /** Mensaje de error (null si no hay error). */
  error: string | null;
  /** Reintenta la carga mostrando el estado de carga. */
  retry: () => Promise<void>;
  /** Actualiza los estados sin mostrar la carga. */
  refresh: () => Promise<void>;
}

/** Hook global con los talleres del estudiante y su estado. */
export function useWorkshops(): UseWorkshopsReturn {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Identifica la consulta más reciente; las anteriores se ignoran.
  const latestRequestRef = useRef(0);

  /**
   * Pide los talleres al servicio.
   * @param silent - true actualiza sin mostrar la carga (lo usa `refresh`).
   */
  const load = useCallback(async (silent: boolean) => {
    const requestId = ++latestRequestRef.current;

    try {
      if (!silent) {
        setIsLoading(true);
        setError(null);
      }

      const { workshops: loaded } = await criticalIncidentService.fetchWorkshops();
      if (requestId !== latestRequestRef.current) return;

      setWorkshops(loaded);
    } catch {
      if (requestId !== latestRequestRef.current) return;

      // Una actualización silenciosa que falla conserva la lista actual.
      if (!silent) {
        setError(
          'No se pudieron cargar los talleres. ' +
          'Verifica tu conexión e intenta nuevamente.',
        );
      }
    } finally {
      if (requestId === latestRequestRef.current) setIsLoading(false);
    }
  }, []);

  // Carga los talleres una vez, al montar el componente que usa el hook.
  useEffect(() => {
    load(false);
  }, [load]);

  const retry = useCallback(() => load(false), [load]);
  const refresh = useCallback(() => load(true), [load]);

  return { workshops, isLoading, error, retry, refresh };
}
