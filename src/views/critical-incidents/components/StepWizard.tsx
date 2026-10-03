import { Check } from 'lucide-react'

import type { IncidentStep, IncidentStepInfo } from '../../../models/criticalIncident'

/* ------------------------------------------------
   StepWizard — indicador de los 4 pasos (RF-03)
   Sin estado propio (R5): recibe todo desde
   useIncidentWizard. En móvil (360 px) muestra solo
   los números; el título aparece desde `sm`.
   ------------------------------------------------ */

interface StepWizardProps {
  steps: IncidentStepInfo[]
  /** Identificador del paso actual. */
  currentStepId: IncidentStep
  /** Si cada paso tiene su campo obligatorio completo. */
  completion: Record<IncidentStep, boolean>
  /** Si se puede ir a un paso (todos los anteriores completos). */
  canGoToStep: (step: IncidentStep) => boolean
  onGoToStep: (step: IncidentStep) => void
}

export default function StepWizard({
  steps,
  currentStepId,
  completion,
  canGoToStep,
  onGoToStep,
}: StepWizardProps) {
  return (
    <nav aria-label="Pasos del registro del incidente">
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStepId
          const isDone = completion[step.id]
          const isReachable = canGoToStep(step.id)

          return (
            <li key={step.id} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                onClick={() => onGoToStep(step.id)}
                disabled={!isReachable}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`Paso ${step.order}: ${step.title}${isDone ? ' (completado)' : ''}`}
                className="
                  flex items-center gap-2 rounded-lg p-1
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
                  disabled:cursor-not-allowed disabled:opacity-60
                "
              >
                <span
                  className={`
                    flex h-9 w-9 shrink-0 items-center justify-center
                    rounded-full border-2 text-sm font-semibold transition-colors
                    ${
                      isCurrent
                        ? 'border-primary bg-primary text-white'
                        : isDone
                          ? 'border-accent-ia bg-accent-ia text-white'
                          : 'border-border bg-surface text-texto/60'
                    }
                  `}
                >
                  {isDone && !isCurrent ? (
                    <Check size={16} aria-hidden="true" />
                  ) : (
                    step.order
                  )}
                </span>
                <span
                  className={`hidden sm:inline text-sm font-medium ${
                    isCurrent ? 'text-primary' : 'text-texto/70'
                  }`}
                >
                  {step.title}
                </span>
              </button>

              {index < steps.length - 1 && (
                <span
                  className={`mx-2 h-0.5 flex-1 rounded-full ${
                    isDone ? 'bg-accent-ia' : 'bg-border'
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
