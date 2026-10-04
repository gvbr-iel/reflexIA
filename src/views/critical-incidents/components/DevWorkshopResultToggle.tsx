import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react'

import Button from '../../../components/Button'
import type { Workshop, WorkshopOutcome } from '../../../models/criticalIncident'

/* ------------------------------------------------
   DevWorkshopResultToggle — SOLO DESARROLLO
   Simula la notificación del resultado del taller
   seleccionado (aprobado o reprobado). Ambos resultados
   desbloquean el siguiente taller. No se renderiza
   fuera de `npm run dev`.
   El botón verde reutiliza `Button` con los tokens de
   desempeño; el de reprobado va neutro porque los
   botones no pueden ser rojos (AI_GUIDELINES §4).
   ------------------------------------------------ */

interface DevWorkshopResultToggleProps {
  /** Taller seleccionado (null si aún no hay). */
  workshop: Workshop | null
  isBusy: boolean
  /** Mensaje de error (null si no hay error). */
  error: string | null
  onSimulate: (outcome: WorkshopOutcome) => void
  onReset: () => void
}

export default function DevWorkshopResultToggle({
  workshop,
  isBusy,
  error,
  onSimulate,
  onReset,
}: DevWorkshopResultToggleProps) {
  if (!import.meta.env.DEV || !workshop) return null

  const isLocked = workshop.status === 'locked'
  const isCompleted = workshop.status === 'completed'

  function message(): string {
    if (isLocked) {
      return `${workshop!.title} está bloqueado: completa el taller anterior para simular su resultado.`
    }
    if (isCompleted) {
      return `${workshop!.title}: resultado simulado "${
        workshop!.outcome === 'failed' ? 'reprobado' : 'aprobado'
      }".`
    }
    return `Simular la notificación del resultado de ${workshop!.title}.`
  }

  return (
    <div className="space-y-2">
      <div
        role="note"
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-secondary bg-secondary/5 px-4 py-3"
      >
        <p className="text-sm text-texto">
          <strong className="font-heading font-semibold">Modo desarrollo:</strong>{' '}
          {message()}
        </p>

        <div className="flex flex-wrap gap-2">
          {isCompleted && (
            <Button
              variant="outline"
              size="sm"
              icon={<RotateCcw size={16} />}
              disabled={isBusy}
              onClick={onReset}
            >
              Quitar resultado
            </Button>
          )}

          {!isLocked && !isCompleted && (
            <>
              <Button
                size="sm"
                icon={<CheckCircle2 size={16} />}
                disabled={isBusy}
                onClick={() => onSimulate('approved')}
                className="!bg-perf-excellent hover:!bg-perf-excellent/90 focus-visible:!ring-perf-excellent/50"
              >
                Simular aprobado
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<XCircle size={16} />}
                disabled={isBusy}
                onClick={() => onSimulate('failed')}
              >
                Simular reprobado
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-primary">
          {error}
        </p>
      )}
    </div>
  )
}
