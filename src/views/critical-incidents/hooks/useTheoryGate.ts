/**
 * @module views/critical-incidents/hooks/useTheoryGate
 *
 * Único punto de contacto entre HU-03 (incidentes críticos) y HU-04
 * (marco teórico): indica si el estudiante aprobó la evaluación teórica
 * y, por tanto, puede registrar incidentes (RF-04 condiciona RF-03).
 *
 * Lee el contrato público `TheoryApprovalStatus` a través de
 * `theoryQuizService.getApprovalStatus()`. Cuando HU-04 esté integrada
 * o exista backend, la firma del servicio no cambia y este hook sigue
 * funcionando sin modificaciones.
 *
 * Falla cerrado: si no se puede verificar la aprobación, se trata al
 * estudiante como no aprobado y se informa el error (R9).
 */

import { useState, useCallback, useEffect } from 'react';

import { theoryQuizService } from '../../../services/theoryQuizService';

/** Estado y acciones expuestos por el hook. */
export interface UseTheoryGateReturn {
  /** Si el estudiante aprobó el marco teórico. */
  isApproved: boolean;
  /** Si se está verificando la aprobación. */
  isLoading: boolean;
  /** Mensaje de error (null si no hay error). */
  error: string | null;
  /** Vuelve a consultar el estado de aprobación. */
  refresh: () => Promise<void>;
}

/** Hook que responde "¿el estudiante aprobó el marco teórico?" (único punto de consulta). */
export function useTheoryGate(): UseTheoryGateReturn {
  const [isApproved, setIsApproved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Consulta la aprobación. Ante un error, por seguridad se considera "no aprobado". */
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const status = await theoryQuizService.getApprovalStatus();
      setIsApproved(status.isApproved);
    } catch {
      setIsApproved(false);
      setError(
        'No se pudo verificar si aprobaste el marco teórico. ' +
        'Verifica tu conexión e intenta nuevamente.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Consulta una vez al abrir la pantalla.
  useEffect(() => {
    refresh();
  }, [refresh]);

  return { isApproved, isLoading, error, refresh };
}
