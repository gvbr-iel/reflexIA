import { CheckCircle2, XCircle } from 'lucide-react'

import type { WorkshopOutcome } from '../../../models/criticalIncident'

/* ------------------------------------------------
   WorkshopResultBanner — resultado del taller (RF-03)
   Avisa al estudiante si aprobó o reprobó el taller y
   recuerda que, en ambos casos, puede continuar con el
   siguiente. El resultado se indica con ícono y texto,
   no solo con color. El rojo es el color semántico de
   desempeño reprobatorio (AI_GUIDELINES §4).
   ------------------------------------------------ */

interface WorkshopResultBannerProps {
  outcome: WorkshopOutcome
  /** Si existe un taller siguiente al que continuar. */
  hasNext: boolean
}

export default function WorkshopResultBanner({
  outcome,
  hasNext,
}: WorkshopResultBannerProps) {
  const isApproved = outcome === 'approved'

  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-xl border p-4 ${
        isApproved
          ? 'border-perf-excellent bg-perf-excellent/10'
          : 'border-perf-fail bg-perf-fail/10'
      }`}
    >
      <span
        className={`shrink-0 ${isApproved ? 'text-perf-excellent' : 'text-perf-fail'}`}
        aria-hidden="true"
      >
        {isApproved ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
      </span>

      <div className="space-y-1">
        <p className="font-heading font-semibold text-texto">
          {isApproved ? 'Taller aprobado' : 'Taller reprobado'}
        </p>
        <p className="text-texto/80">
          {hasNext
            ? isApproved
              ? 'Ya puedes continuar con el siguiente taller.'
              : 'Aun así, puedes continuar con el siguiente taller.'
            : 'Este era el último taller.'}
        </p>
      </div>
    </div>
  )
}
