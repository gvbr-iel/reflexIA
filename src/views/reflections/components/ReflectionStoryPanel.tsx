import { CalendarDays } from 'lucide-react'

import { INCIDENT_STEPS } from '../../../models/criticalIncident'
import type { Reflection } from '../../../models/reflection'
import { formatDateTime } from '../../../utils/formatDateTime'
import ReviewStatusBadge from './ReviewStatusBadge'

/* ------------------------------------------------
   ReflectionStoryPanel — HU-02 / RF-02

   Relato que envió el estudiante, de solo lectura: un
   bloque por cada paso del asistente (Contexto,
   Descripción del hecho, Actores e influencia y
   Relevancia pedagógica), con el alias, el taller, el
   intento y el estado de la revisión arriba.

   El texto se muestra con saltos de línea respetados y
   en 16 px con interlineado amplio (AI_GUIDELINES §5).
   No tiene estado propio: todo llega por props.
   ------------------------------------------------ */

interface ReflectionStoryPanelProps {
  reflection: Reflection
}

export default function ReflectionStoryPanel({ reflection }: ReflectionStoryPanelProps) {
  return (
    <section
      aria-labelledby="story-title"
      className="rounded-xl border border-border bg-surface p-4 md:p-5"
    >
      <header className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="story-title" className="font-heading text-xl font-semibold text-texto">
            {reflection.studentAlias}
          </h2>
          <ReviewStatusBadge status={reflection.review.status} />
        </div>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-texto/70">
          <span>
            Taller {reflection.workshopNumber} · Intento {reflection.attemptNumber}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={14} aria-hidden="true" />
            Enviada el {formatDateTime(reflection.submittedAt)}
          </span>
        </p>
      </header>

      <div className="mt-4 space-y-4">
        {INCIDENT_STEPS.map((step) => (
          <div key={step.id}>
            <h3 className="font-heading text-base font-semibold text-texto">{step.title}</h3>
            <p className="mt-1 whitespace-pre-wrap text-base leading-relaxed text-texto">
              {reflection.content[step.id].trim() || 'Sin contenido en este paso.'}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
