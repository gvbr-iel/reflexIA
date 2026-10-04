/**
 * @module views/critical-incidents/dev/useWorkshopResultSimulator
 *
 * Utilidad SOLO PARA DESARROLLO: simula la notificación del resultado de un
 * taller (aprobado o reprobado), que más adelante vendrá del sistema real
 * tras la revisión. Permite probar y demostrar el desbloqueo lineal de los
 * talleres mientras no exista el envío a revisión.
 *
 * Se elimina junto con `DevWorkshopResultToggle` y los métodos
 * `simulateWorkshopResult` y `clearWorkshopResult` del servicio.
 */

import { useState, useCallback } from 'react';

import type { WorkshopOutcome } from '../../../models/criticalIncident';
import { criticalIncidentService } from '../../../services/criticalIncidentService';

/** Estado y acciones expuestos por el hook. */
export interface UseWorkshopResultSimulatorReturn {
  /** Si hay una simulación en curso. */
  isBusy: boolean;
  /** Mensaje de error (null si no hay error). */
  error: string | null;
  /** Simula el resultado de un taller. */
  simulate: (workshopId: string, outcome: WorkshopOutcome) => Promise<void>;
  /** Quita el resultado simulado del taller y de los siguientes. */
  reset: (workshopId: string) => Promise<void>;
}

/**
 * @param onChanged Se llama tras cada cambio, para que la vista actualice
 *                  el estado de los talleres.
 */
export function useWorkshopResultSimulator(
  onChanged: () => void | Promise<void>,
): UseWorkshopResultSimulatorReturn {
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (action: () => Promise<void>) => {
      try {
        setIsBusy(true);
        setError(null);

        await action();
        await onChanged();
      } catch {
        setError(
          'No se pudo simular el resultado del taller. ' +
          'Intenta nuevamente.',
        );
      } finally {
        setIsBusy(false);
      }
    },
    [onChanged],
  );

  const simulate = useCallback(
    (workshopId: string, outcome: WorkshopOutcome) =>
      run(() => criticalIncidentService.simulateWorkshopResult(workshopId, outcome)),
    [run],
  );

  const reset = useCallback(
    (workshopId: string) =>
      run(() => criticalIncidentService.clearWorkshopResult(workshopId)),
    [run],
  );

  return { isBusy, error, simulate, reset };
}
