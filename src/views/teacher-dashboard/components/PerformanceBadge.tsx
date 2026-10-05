import { type ReactNode } from 'react'
import { Award, CheckCircle2, Circle, XCircle } from 'lucide-react'

import type { PerformanceStatus } from '../../../models/teacherDashboard'

/* ------------------------------------------------
   PerformanceBadge — panel docente

   Estado de desempeño de una actividad, con los colores de
   la rueda (AI_GUIDELINES §4). El estado se indica con
   ícono y texto, no solo con color. El rojo se usa solo
   en el ícono de "Reprobado", como color semántico de
   desempeño.
   ------------------------------------------------ */

interface PerformanceBadgeProps {
  status: PerformanceStatus
}

interface StatusInfo {
  label: string
  icon: ReactNode
  /** Color del ícono, tomado de los tokens de desempeño. */
  iconClassName: string
}

const STATUS_INFO: Record<PerformanceStatus, StatusInfo> = {
  'not-submitted': { label: 'No entregado', icon: <Circle size={16} />, iconClassName: 'text-perf-none' },
  failed: { label: 'Reprobado', icon: <XCircle size={16} />, iconClassName: 'text-perf-fail' },
  approved: { label: 'Aprobado', icon: <CheckCircle2 size={16} />, iconClassName: 'text-perf-pass' },
  excellent: { label: 'Sobresaliente', icon: <Award size={16} />, iconClassName: 'text-perf-excellent' },
}

export default function PerformanceBadge({ status }: PerformanceBadgeProps) {
  const { label, icon, iconClassName } = STATUS_INFO[status]

  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-texto">
      <span className={`shrink-0 ${iconClassName}`} aria-hidden="true">
        {icon}
      </span>
      {label}
    </span>
  )
}
