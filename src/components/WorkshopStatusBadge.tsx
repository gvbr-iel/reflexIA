import { type ReactNode } from 'react'
import { CheckCircle2, Circle, Lock, Pencil, XCircle } from 'lucide-react'

import type { Workshop, WorkshopStatus } from '../models/criticalIncident'

/* ------------------------------------------------
   WorkshopStatusBadge — estado de un taller
   Componente reutilizable global (R2): lo usan el
   selector del asistente de incidentes críticos y la
   lista de talleres, para mostrar siempre lo mismo.
   El estado se indica con ícono y texto, no solo con
   color. Un taller completado muestra su resultado:
   verde si fue aprobado y rojo si fue reprobado; el
   rojo es el color semántico de desempeño reprobatorio
   (AI_GUIDELINES §4).
   ------------------------------------------------ */

interface WorkshopStatusBadgeProps {
  workshop: Workshop
  /** Resalta el estado con el color primario (por ejemplo, taller elegido). */
  highlighted?: boolean
  className?: string
}

interface StatusInfo {
  label: string
  icon: ReactNode
}

const STATUS_INFO: Record<Exclude<WorkshopStatus, 'completed'>, StatusInfo> = {
  locked: { label: 'Bloqueado', icon: <Lock size={16} /> },
  available: { label: 'Disponible', icon: <Circle size={16} /> },
  'in-progress': { label: 'En curso', icon: <Pencil size={16} /> },
}

/** Texto e ícono del estado; un taller completado muestra su resultado. */
function getStatusInfo(workshop: Workshop): StatusInfo {
  if (workshop.status === 'completed') {
    return workshop.outcome === 'failed'
      ? { label: 'Reprobado', icon: <XCircle size={16} /> }
      : { label: 'Aprobado', icon: <CheckCircle2 size={16} /> }
  }
  return STATUS_INFO[workshop.status]
}

export default function WorkshopStatusBadge({
  workshop,
  highlighted = false,
  className = '',
}: WorkshopStatusBadgeProps) {
  const status = getStatusInfo(workshop)
  const outcome = workshop.status === 'completed' ? workshop.outcome : null

  return (
    <span
      className={`flex items-center gap-1.5 text-sm ${
        outcome
          ? 'font-medium text-texto'
          : highlighted || workshop.status === 'in-progress'
            ? 'text-primary'
            : 'text-texto/60'
      } ${className}`}
    >
      <span
        className={`shrink-0 ${
          outcome === 'approved'
            ? 'text-perf-excellent'
            : outcome === 'failed'
              ? 'text-perf-fail'
              : ''
        }`}
        aria-hidden="true"
      >
        {status.icon}
      </span>
      {status.label}
    </span>
  )
}
