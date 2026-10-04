import Button from '../../../components/Button'
import WorkshopStatusBadge from '../../../components/WorkshopStatusBadge'
import type { Workshop } from '../../../models/criticalIncident'

/* ------------------------------------------------
   WorkshopSelector — selector de talleres 1 a 4 (RF-03)
   Muestra cada taller con su estado en el flujo lineal
   y permite elegir en cuál trabajar. El estado se indica
   con ícono y texto (WorkshopStatusBadge), no solo con color.
   La tarjeta de un taller completado se pinta en verde si fue
   aprobado y en rojo si fue reprobado; el rojo es el color
   semántico de desempeño reprobatorio (AI_GUIDELINES §4).
   Ambos resultados desbloquean el siguiente taller.
   Se puede elegir un taller bloqueado: el asistente
   explica por qué no está disponible.
   Sin lógica propia (R5): recibe todo desde useWorkshops.
   Incluye estados de carga, error y vacío (R9).
   ------------------------------------------------ */

interface WorkshopSelectorProps {
  workshops: Workshop[]
  /** Identificador del taller seleccionado (null si aún no hay). */
  selectedWorkshopId: string | null
  isLoading: boolean
  /** Mensaje de error (null si no hay error). */
  error: string | null
  onSelect: (workshopId: string) => void
  onRetry: () => void
}

export default function WorkshopSelector({
  workshops,
  selectedWorkshopId,
  isLoading,
  error,
  onSelect,
  onRetry,
}: WorkshopSelectorProps) {
  /* ---- Estado de carga ---- */
  if (isLoading) {
    return (
      <div
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        role="status"
        aria-busy="true"
        aria-label="Cargando talleres"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-20 rounded-xl bg-border/50 animate-pulse" />
        ))}
      </div>
    )
  }

  /* ---- Estado de error ---- */
  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-border bg-surface p-4 space-y-3"
      >
        <p className="text-texto">{error}</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    )
  }

  /* ---- Estado vacío ---- */
  if (workshops.length === 0) {
    return (
      <p className="text-texto/70">Por ahora no hay talleres disponibles.</p>
    )
  }

  return (
    <nav aria-label="Talleres">
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {workshops.map((workshop) => {
          const isSelected = workshop.id === selectedWorkshopId
          const isLocked = workshop.status === 'locked'
          const outcome = workshop.status === 'completed' ? workshop.outcome : null

          return (
            <li key={workshop.id}>
              <button
                type="button"
                onClick={() => onSelect(workshop.id)}
                aria-current={isSelected ? 'true' : undefined}
                className={`
                  w-full rounded-xl border p-3 text-left transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
                  ${
                    outcome === 'approved'
                      ? 'border-perf-excellent bg-perf-excellent/10'
                      : outcome === 'failed'
                        ? 'border-perf-fail bg-perf-fail/10'
                        : isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border bg-surface hover:border-primary/50'
                  }
                  ${isSelected && outcome ? 'ring-2 ring-primary/60' : ''}
                `}
              >
                <span
                  className={`block font-heading font-semibold ${
                    isLocked ? 'text-texto/60' : 'text-texto'
                  }`}
                >
                  {workshop.title}
                </span>
                <WorkshopStatusBadge
                  workshop={workshop}
                  highlighted={isSelected}
                  className="mt-1"
                />
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
