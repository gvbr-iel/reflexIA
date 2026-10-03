import { ArrowLeft, ArrowRight, Lock } from 'lucide-react'

import Button from '../../../components/Button'
import { useIncidentWizard } from '../hooks/useIncidentWizard'
import StepWizard from './StepWizard'
import IncidentStepForm from './IncidentStepForm'
import DraftManager from './DraftManager'

/* ------------------------------------------------
   IncidentWizard — asistente paso a paso de un taller
   Compone StepWizard, IncidentStepForm y DraftManager
   con la lógica de useIncidentWizard. Solo se monta
   cuando el marco teórico está aprobado, por lo que
   no carga datos mientras el acceso está bloqueado.
   ------------------------------------------------ */

interface IncidentWizardProps {
  workshopId: string
}

export default function IncidentWizard({ workshopId }: IncidentWizardProps) {
  const wizard = useIncidentWizard(workshopId)

  /* ---- Estado de carga ---- */
  if (wizard.isLoading) {
    return (
      <div
        className="space-y-3"
        role="status"
        aria-busy="true"
        aria-label="Cargando el taller"
      >
        <div className="h-9 rounded-lg bg-border/50 animate-pulse" />
        <div className="h-72 rounded-xl bg-border/50 animate-pulse" />
      </div>
    )
  }

  /* ---- Estado de error ---- */
  if (wizard.loadError || !wizard.workshop) {
    return (
      <div role="alert" className="rounded-xl border border-border bg-surface p-6 space-y-4">
        <p className="text-texto">{wizard.loadError}</p>
        <Button variant="outline" onClick={wizard.retryLoad}>
          Reintentar
        </Button>
      </div>
    )
  }

  /* ---- Taller bloqueado por el flujo lineal ---- */
  if (wizard.workshop.status === 'locked') {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 flex items-start gap-4">
        <span className="text-primary shrink-0" aria-hidden="true">
          <Lock size={24} />
        </span>
        <div className="space-y-1">
          <h2 className="font-heading font-semibold text-lg text-texto">
            {wizard.workshop.title} bloqueado
          </h2>
          <p className="text-texto/70">
            Este taller se desbloquea cuando completes el taller anterior.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <StepWizard
        steps={wizard.steps}
        currentStepId={wizard.currentStep.id}
        completion={wizard.stepCompletion}
        canGoToStep={wizard.canGoToStep}
        onGoToStep={wizard.goToStep}
      />

      <IncidentStepForm
        key={wizard.currentStep.id}
        step={wizard.currentStep}
        totalSteps={wizard.steps.length}
        value={wizard.values[wizard.currentStep.id]}
        onChange={(text) => wizard.setFieldValue(wizard.currentStep.id, text)}
        error={wizard.stepError}
      />

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          icon={<ArrowLeft size={18} />}
          onClick={wizard.goBack}
          disabled={wizard.isFirstStep}
        >
          Atrás
        </Button>

        {!wizard.isLastStep && (
          <Button onClick={wizard.goNext}>
            Siguiente
            <ArrowRight size={18} aria-hidden="true" />
          </Button>
        )}
      </div>

      {wizard.isLastStep && wizard.allStepsCompleted && (
        <p role="status" className="text-sm text-texto/70">
          Completaste los 4 pasos. Puedes guardar tu borrador y retomarlo
          cuando quieras; el envío a revisión se habilitará más adelante.
        </p>
      )}

      <DraftManager
        saveStatus={wizard.saveStatus}
        savedAt={wizard.savedAt}
        lastSaveWasAuto={wizard.lastSaveWasAuto}
        hasDraft={wizard.hasDraft}
        isDirty={wizard.isDirty}
        attemptsUsed={wizard.workshop.attemptsUsed}
        maxAttempts={wizard.workshop.maxAttempts}
        onSave={wizard.saveDraft}
        onDiscard={wizard.discardDraft}
      />
    </div>
  )
}
