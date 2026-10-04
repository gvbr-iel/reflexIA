/**
 * @module views/critical-incidents/hooks/useWorkshops
 *
 * Carga los 4 talleres con su estado en el flujo lineal y recuerda cuál
 * está seleccionado, para el selector de talleres de HU-03 / RF-03.
 *
 * El asistente es por taller: la vista usa el taller seleccionado para
 * saber en cuál trabajar. Al primer ingreso se elige uno por defecto:
 * el que tiene un borrador en curso, si no el primero disponible y, si
 * no, el primero de la lista.
 *
 * `refresh` vuelve a consultar sin mostrar la carga ni borrar la lista,
 * para actualizar los estados (por ejemplo "en curso" tras guardar un
 * borrador) sin que el selector parpadee.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

import type { Workshop } from '../../../models/criticalIncident';
import { criticalIncidentService } from '../../../services/criticalIncidentService';

/** Estado y acciones expuestos por el hook. */
export interface UseWorkshopsReturn {
  /** Los talleres con su estado (vacío mientras carga o si falló). */
  workshops: Workshop[];
  /** Si se están cargando los talleres por primera vez o al reintentar. */
  isLoading: boolean;
  /** Mensaje de error (null si no hay error). */
  error: string | null;
  /** Identificador del taller seleccionado (null hasta que cargan). */
  selectedWorkshopId: string | null;
  /** Selecciona un taller. */
  selectWorkshop: (workshopId: string) => void;
  /** Reintenta la carga mostrando el estado de carga. */
  retry: () => Promise<void>;
  /** Actualiza los estados sin mostrar la carga. */
  refresh: () => Promise<void>;
}

/** Taller que se muestra al ingresar por primera vez. */
function pickDefaultWorkshopId(workshops: Workshop[]): string | null {
  const preferred =
    workshops.find((w) => w.status === 'in-progress') ??
    workshops.find((w) => w.status === 'available') ??
    workshops[0];

  return preferred ? preferred.id : null;
}

export function useWorkshops(): UseWorkshopsReturn {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(null);

  // Identifica la consulta más reciente; las anteriores se ignoran.
  const latestRequestRef = useRef(0);

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
      setSelectedWorkshopId((current) => current ?? pickDefaultWorkshopId(loaded));
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

  useEffect(() => {
    load(false);
  }, [load]);

  const retry = useCallback(() => load(false), [load]);
  const refresh = useCallback(() => load(true), [load]);

  const selectWorkshop = useCallback((workshopId: string) => {
    setSelectedWorkshopId(workshopId);
  }, []);

  return {
    workshops,
    isLoading,
    error,
    selectedWorkshopId,
    selectWorkshop,
    retry,
    refresh,
  };
}
