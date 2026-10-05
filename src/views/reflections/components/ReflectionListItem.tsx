import { CalendarDays, Lightbulb } from 'lucide-react'

import type { Reflection } from '../../../models/reflection'
import { formatDateTime } from '../../../utils/formatDateTime'
import ReviewStatusBadge from './ReviewStatusBadge'

/* ------------------------------------------------
   ReflectionListItem — HU-02 / RF-02

   Una reflexión en la lista del profesor: alias del
   estudiante, estado de la revisión, taller, intento,
   fecha de envío y cantidad de impulsos.

   Es un botón que abre el detalle. La reflexión abierta
   se marca con aria-current y con borde azul, no solo
   con color. No tiene estado propio: todo llega por props.
   ------------------------------------------------ */

interface ReflectionListItemProps {
  reflection: Reflection
  /** true si es la reflexión abierta en el detalle. */
  isSelected: boolean
  onSelect: (reflectionId: string) => void
}

export default function ReflectionListItem({
  reflection,
  isSelected,
  onSelect,
}: ReflectionListItemProps) {
  const hintCount = reflection.review.hints.length

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(reflection.id)}
        aria-current={isSelected ? 'true' : undefined}
        className={`w-full rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
          isSelected
            ? 'border-primary bg-primary/5'
            : 'border-border bg-surface hover:border-primary/40'
        }`}
      >
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-heading text-base font-semibold text-texto">
            {reflection.studentAlias}
          </span>
          <ReviewStatusBadge status={reflection.review.status} />
        </span>

        <span className="mt-1 block text-sm text-texto/70">
          Taller {reflection.workshopNumber} · Intento {reflection.attemptNumber}
        </span>

        <span className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-texto/70">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={14} aria-hidden="true" />
            {formatDateTime(reflection.submittedAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Lightbulb size={14} aria-hidden="true" />
            {hintCount} {hintCount === 1 ? 'impulso' : 'impulsos'}
          </span>
        </span>
      </button>
    </li>
  )
}
