/**
 * @module views/critical-incidents/hooks/useTheoryReferences
 *
 * Carga las referencias bibliográficas pertinentes al paso actual del
 * asistente, para el panel lateral `TheoryReferenceSidebar` (HU-03 / RF-03).
 *
 * Encapsula la consulta al servicio y sus estados de carga y error (R5, R9),
 * de modo que el panel solo se ocupa de mostrar la información.
 *
 * Si el estudiante cambia de paso mientras una consulta sigue en curso, se
 * descarta su respuesta para no mostrar referencias de otro paso.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

import type { IncidentStep, TheoryReference } from '../../../models/criticalIncident';
import { criticalIncidentService } from '../../../services/criticalIncidentService';

/** Estado y acciones expuestos por el hook. */
export interface UseTheoryReferencesReturn {
  /** Referencias pertinentes al paso indicado (vacío si no hay). */
  references: TheoryReference[];
  /** Si se están cargando las referencias. */
  isLoading: boolean;
  /** Mensaje de error (null si no hay error). */
  error: string | null;
  /** Vuelve a cargar las referencias del paso. */
  retry: () => Promise<void>;
}

export function useTheoryReferences(step: IncidentStep): UseTheoryReferencesReturn {
  const [references, setReferences] = useState<TheoryReference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Identifica la consulta más reciente; las anteriores se ignoran.
  const latestRequestRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++latestRequestRef.current;

    try {
      setIsLoading(true);
      setError(null);

      const result = await criticalIncidentService.getReferences(step);
      if (requestId !== latestRequestRef.current) return;

      setReferences(result);
    } catch {
      if (requestId !== latestRequestRef.current) return;

      setReferences([]);
      setError(
        'No se pudieron cargar las referencias de este paso. ' +
        'Intenta nuevamente.',
      );
    } finally {
      if (requestId === latestRequestRef.current) setIsLoading(false);
    }
  }, [step]);

  useEffect(() => {
    load();
  }, [load]);

  return { references, isLoading, error, retry: load };
}
