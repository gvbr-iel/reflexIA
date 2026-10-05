import { type ReactNode } from 'react'
import { CheckCircle2, Clock, Pencil } from 'lucide-react'

import { REVIEW_STATUS_LABELS, type ReviewStatus } from '../../../models/reflection'

/* ------------------------------------------------
   ReviewStatusBadge — HU-02 / RF-02

   Estado de la revisión docente de una reflexión:
   pendiente, editada o validada.

   El estado se indica con ícono y texto, no solo con
   color (AI_GUIDELINES §7). El texto va siempre en el
   color base para mantener el contraste; el color solo
   acompaña al ícono y al borde. No se usa rojo: está
   reservado para el desempeño (AI_GUIDELINES §4).
   ------------------------------------------------ */

interface ReviewStatusBadgeProps {
  status: ReviewStatus
  className?: string
}

interface StatusStyle {
  icon: ReactNode
  /** Colores del contenedor (borde y fondo). */
  container: string
  /** Color del ícono. */
  iconColor: string
}

const STATUS_STYLES: Record<ReviewStatus, StatusStyle> = {
  pending: {
    icon: <Clock size={14} />,
    container: 'border-border bg-bg',
    iconColor: 'text-texto/60',
  },
  edited: {
    icon: <Pencil size={14} />,
    container: 'border-primary/30 bg-primary/5',
    iconColor: 'text-primary',
  },
  validated: {
    icon: <CheckCircle2 size={14} />,
    container: 'border-accent-ia/30 bg-accent-ia/10',
    iconColor: 'text-accent-ia',
  },
}

export default function ReviewStatusBadge({ status, className = '' }: ReviewStatusBadgeProps) {
  const style = STATUS_STYLES[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm font-medium text-texto ${style.container} ${className}`}
    >
      <span className={`shrink-0 ${style.iconColor}`} aria-hidden="true">
        {style.icon}
      </span>
      {REVIEW_STATUS_LABELS[status]}
    </span>
  )
}
