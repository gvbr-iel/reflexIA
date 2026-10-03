import { type ReactNode } from 'react'
import { CheckCircle2, Circle, Lock, Pencil } from 'lucide-react'

import Button from '../../../components/Button'
import type { Workshop, WorkshopStatus } from '../../../models/criticalIncident'

/* ------------------------------------------------
   WorkshopSelector — selector de talleres 1 a 4 (RF-03)
   Muestra cada taller con su estado en el flujo lineal
   y permite elegir en cuál trabajar. El estado se indica
   con ícono y texto, no solo con color.
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

interface StatusInfo {
  label: string
  icon: ReactNode
}

const STATUS_INFO: Record<WorkshopStatus, StatusInfo> = {
  locked: { label: 'Bloqueado', icon: <Lock size={16} /> },
  available: { label: 'Disponible', icon: <Circle size={16} /> },
  'in-progress': { label: 'En curso', icon: <Pencil size={16} /> },
  completed: { label: 'Completado', icon: <CheckCircle2 size={16} /> },
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
          const status = STATUS_INFO[workshop.status]

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
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border bg-surface hover:border-primary/50'
                  }
                `}
              >
                <span
                  className={`block font-heading font-semibold ${
                    isLocked ? 'text-texto/60' : 'text-texto'
                  }`}
                >
                  {workshop.title}
                </span>
                <span
                  className={`mt-1 flex items-center gap-1.5 text-sm ${
                    workshop.status === 'completed'
                      ? 'text-accent-ia'
                      : isSelected || workshop.status === 'in-progress'
                        ? 'text-primary'
                        : 'text-texto/60'
                  }`}
                >
                  <span className="shrink-0" aria-hidden="true">
                    {status.icon}
                  </span>
                  {status.label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
