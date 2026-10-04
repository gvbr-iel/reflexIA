import { AlertCircle } from 'lucide-react'

import type { IncidentStepInfo } from '../../../models/criticalIncident'

/* ------------------------------------------------
   IncidentStepForm — campo de texto de un paso (RF-03)
   Un campo separado por paso (AI_GUIDELINES §7).
   Sin estado propio (R5). El Textarea vive aquí por
   ahora; se moverá a components/ cuando otro feature
   lo necesite (R2).
   El error no depende solo del color: lleva ícono y texto.
   ------------------------------------------------ */

interface IncidentStepFormProps {
  step: IncidentStepInfo
  /** Total de pasos, para mostrar "Paso X de N". */
  totalSteps: number
  value: string
  onChange: (text: string) => void
  /** Mensaje de error (null si no hay error). */
  error: string | null
}

export default function IncidentStepForm({
  step,
  totalSteps,
  value,
  onChange,
  error,
}: IncidentStepFormProps) {
  const fieldId = `incident-${step.id}`
  const hintId = `${fieldId}-hint`
  const errorId = `${fieldId}-error`

  return (
    <section
      aria-labelledby={`${fieldId}-title`}
      className="rounded-xl border border-border bg-surface p-4 md:p-6 space-y-4"
    >
      <div className="space-y-1">
        <p className="text-sm font-medium text-primary">
          Paso {step.order} de {totalSteps}
        </p>
        <h2
          id={`${fieldId}-title`}
          className="font-heading font-semibold text-xl text-texto"
        >
          {step.title}
        </h2>
        <p id={hintId} className="text-texto/70">
          {step.instruction}
        </p>
      </div>

      <div>
        <label htmlFor={fieldId} className="block text-sm font-medium text-texto mb-1">
          {step.title} <span className="text-texto/60">(obligatorio)</span>
        </label>
        <textarea
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={step.placeholder}
          rows={10}
          required
          aria-required="true"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${hintId} ${errorId}` : hintId}
          className={`
            w-full resize-y rounded-lg border bg-surface px-3 py-2
            font-body text-base leading-relaxed text-texto placeholder:text-texto/40
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
            ${error ? 'border-primary ring-1 ring-primary' : 'border-border'}
          `}
        />

        {error && (
          <p
            id={errorId}
            role="alert"
            className="mt-2 flex items-start gap-2 text-sm font-medium text-primary"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    </section>
  )
}
