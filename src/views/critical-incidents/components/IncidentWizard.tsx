import { useEffect } from 'react'
import { ArrowLeft, ArrowRight, Lock, Save, Shield } from 'lucide-react'

import Button from '../../../components/Button'
import { INCIDENT_STEPS } from '../../../models/criticalIncident'
import { useIncidentWizard } from '../hooks/useIncidentWizard'
import { useTheoryReferences } from '../hooks/useTheoryReferences'
import { useSensitiveDataDetector } from '../hooks/useSensitiveDataDetector'
import { useImpulse } from '../hooks/useImpulse'
import StepWizard from './StepWizard'
import TheoryReferenceSidebar from './TheoryReferenceSidebar'
import SensitiveDataPreview from './SensitiveDataPreview'
import DraftManager from './DraftManager'
import ImpulsePanel from './ImpulsePanel'
import ConfiguredIncidentStepForm from './ConfiguredIncidentStepForm'

/* ------------------------------------------------
   IncidentWizard — asistente paso a paso de un taller
   Compone StepWizard, IncidentStepForm,
   TheoryReferenceSidebar, SensitiveDataPreview, DraftManager
   e ImpulsePanel ("El Impulso", HU-02) con la lógica de
   useIncidentWizard, useTheoryReferences,
   useSensitiveDataDetector y useImpulse.
   Solo se monta cuando el marco teórico está aprobado,
   por lo que no carga datos mientras el acceso está
   bloqueado.

   Distribución: en pantallas anchas (xl) el formulario
   va a la izquierda y las referencias a la derecha, fijas
   al hacer scroll. En el resto, una sola columna con las
   referencias plegables justo debajo del formulario.
   ------------------------------------------------ */

interface IncidentWizardProps {
  /** Taller que se está trabajando (e.g. "workshop-1"). */
  workshopId: string
  /** Se llama tras guardar o descartar el borrador del taller. */
  onDraftChange?: () => void
}

export default function IncidentWizard({ workshopId, onDraftChange }: IncidentWizardProps) {
  // Lógica del formulario por pasos y del borrador.
  const wizard = useIncidentWizard(workshopId, onDraftChange)
  // Detección de datos sensibles con IA (HU-05).
  const sensitiveDetector = useSensitiveDataDetector()
  const configuration = wizard.configuration
  const evaluationType = configuration?.evaluationType ?? 'text'
  const narrativeToCheck = [
    `Contexto:\n${(wizard.values.context ?? '').trim()}`,
    `Descripción del incidente:\n${(wizard.values.description ?? '').trim()}`,
    `Actores involucrados:\n${(wizard.values.actors ?? '').trim()}`,
    `Relevancia pedagógica:\n${(wizard.values.relevance ?? '').trim()}`,
    ...Object.entries(wizard.answers)
      .filter(([key]) => key.startsWith('guiding-'))
      .map(([key, value]) => `${key}:\n${value}`),
  ].join('\n\n')
  // "El Impulso": pide orientaciones a la IA y lleva el contador de intentos.
  // Guarda el borrador antes de pedir (no descuenta intentos) y avisa al
  // selector de talleres cuando se registra un intento.
  const impulse = useImpulse({
    workshopId,
    values: wizard.values,
    maxAttempts: wizard.workshop?.maxAttempts ?? null,
    hasSensitiveData: sensitiveDetector.hasSensitiveData,
    hasPassedSensitiveCheck:
      sensitiveDetector.hasAnalyzed && sensitiveDetector.analyzedText === narrativeToCheck,
    impulseAvailable: evaluationType === 'text',
    hasCompleteNarrative: wizard.allStepsCompleted,
    saveDraft: wizard.saveDraft,
    onAttemptRegistered: onDraftChange,
  })
  const orderedSections = [...(configuration?.sections ?? [])]
    .filter((section) => section.enabled)
    .sort((a, b) => a.order - b.order)
  const enabledSections = new Set(orderedSections.map((section) => section.id))
  const supportsSensitiveCheck = evaluationType === 'text'
  const referenceStep = INCIDENT_STEPS.find((step) => step.id === wizard.currentStep.id)
    ?? INCIDENT_STEPS[Math.min(wizard.currentIndex, INCIDENT_STEPS.length - 1)]
  const {
    references,
    isLoading: isLoadingReferences,
    error: referencesError,
    retry: retryReferences,
  } = useTheoryReferences(referenceStep.id)

  // Limpia los resultados de detección sensible al cambiar de taller
  useEffect(() => {
    sensitiveDetector.clearResults()
  }, [workshopId, sensitiveDetector.clearResults])

  useEffect(() => {
    sensitiveDetector.clearResults()
  }, [wizard.values, wizard.answers, sensitiveDetector.clearResults])

  // Pasa todo el relato (los 4 pasos) a OpenRouter en una sola llamada
  const handleDetectSensitiveData = () => void sensitiveDetector.analyze(narrativeToCheck)

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
      {orderedSections.length === 0 && (
        <p className="rounded-xl border border-border bg-surface p-5 text-texto/70">
          El docente desactivó todas las secciones de este taller. Contacta a tu docente guía.
        </p>
      )}

      {orderedSections.map((setting) => {
        switch (setting.id) {
          case 'objectives-context':
            return (
              <section key={setting.id} className="space-y-2 rounded-xl border border-border bg-surface p-4 md:p-6">
                <h2 className="font-heading text-lg font-semibold text-texto">Objetivo y contexto</h2>
                <p className="text-texto/70">{wizard.workshop?.description}</p>
                <p className="text-sm text-primary">{wizard.workshop?.topic}</p>
              </section>
            )
          case 'incident-form':
            return (
              <section key={setting.id} aria-label="Formulario del taller" className="space-y-4">
                <StepWizard
                  steps={wizard.steps}
                  currentStepId={wizard.currentStep.id}
                  completion={wizard.stepCompletion}
                  canGoToStep={wizard.canGoToStep}
                  onGoToStep={wizard.goToStep}
                />
                <ConfiguredIncidentStepForm
                  evaluationType={evaluationType}
                  configuration={configuration!}
                  step={wizard.currentStep}
                  totalSteps={wizard.steps.length}
                  value={wizard.currentValue}
                  onChange={(answer) => wizard.setFieldValue(wizard.currentStep.id, answer)}
                  error={wizard.stepError}
                />

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <Button
                    variant="outline"
                    icon={<ArrowLeft size={18} />}
                    onClick={wizard.goBack}
                    disabled={wizard.isFirstStep}
                  >
                    Atrás
                  </Button>
                  <Button
                    icon={
                      wizard.isLastStep
                        ? evaluationType === 'text'
                          ? <Shield size={18} />
                          : <Save size={18} />
                        : <ArrowRight size={18} />
                    }
                    isLoading={wizard.isLastStep && evaluationType === 'text' && sensitiveDetector.isAnalyzing}
                    onClick={
                      wizard.isLastStep
                        ? evaluationType === 'text'
                          ? handleDetectSensitiveData
                          : () => void wizard.saveDraft()
                        : wizard.goNext
                    }
                    disabled={
                      wizard.isLastStep
                        ? !wizard.allStepsCompleted ||
                          (evaluationType === 'text' && sensitiveDetector.isAnalyzing)
                        : !wizard.stepCompletion[wizard.currentStep.id]
                    }
                  >
                    {wizard.isLastStep
                      ? evaluationType === 'text'
                        ? 'Detectar datos sensibles'
                        : 'Guardar respuestas'
                      : 'Siguiente'}
                  </Button>
                </div>

                {supportsSensitiveCheck &&
                  (sensitiveDetector.hasAnalyzed ||
                    sensitiveDetector.isAnalyzing ||
                    sensitiveDetector.analysisError) && (
                    <SensitiveDataPreview
                      originalText={sensitiveDetector.analyzedText ?? ''}
                      detectedWords={sensitiveDetector.detectedWords}
                      isAnalyzing={sensitiveDetector.isAnalyzing}
                      analysisError={sensitiveDetector.analysisError}
                      hasAnalyzed={sensitiveDetector.hasAnalyzed}
                      hasSensitiveData={sensitiveDetector.hasSensitiveData}
                      onRetry={handleDetectSensitiveData}
                      onDismiss={sensitiveDetector.clearResults}
                      onCancel={sensitiveDetector.cancelAnalysis}
                    />
                  )}
              </section>
            )
          case 'theory-framework':
            return (
              <section key={setting.id} className="space-y-3 xl:max-w-2xl">
                <h2 className="font-heading font-semibold text-texto">
                  Marco teórico con lecturas que ayudarán a resolver el taller
                </h2>
                <TheoryReferenceSidebar
                  stepTitle={referenceStep.title}
                  references={references}
                  isLoading={isLoadingReferences}
                  error={referencesError}
                  onRetry={retryReferences}
                />
              </section>
            )
          case 'peer-feedback':
            return (
              <section key={setting.id} className="space-y-2 rounded-xl border border-border bg-surface p-4">
                <h2 className="font-heading font-semibold text-texto">Retroalimentación con pares</h2>
                <p className="text-sm text-texto/70">
                  Esta sección está configurada, pero el intercambio de comentarios entre estudiantes
                  aún no está disponible en la plataforma.
                </p>
              </section>
            )
          case 'evaluation-rubric':
            return (
              <section key={setting.id} className="space-y-4 rounded-xl border border-border bg-surface p-4">
                <div>
                  <h2 className="font-heading font-semibold text-texto">Rúbrica y escala de evaluación</h2>
                  <p className="mt-1 text-sm text-texto/70">
                    La revisión oficial corresponde al docente guía y utiliza la escala institucional
                    de 1,0 a 7,0. Los intentos se consumen solo al pedir un impulso.
                  </p>
                </div>
                {evaluationType === 'text' && <ImpulsePanel impulse={impulse} />}
              </section>
            )
          case 'prompt-bank':
            return (
              <section key={setting.id} className="space-y-2 rounded-xl border border-border bg-surface p-4">
                <h2 className="font-heading font-semibold text-texto">Banco de prompts y análisis</h2>
                {configuration?.formSchema.guidingQuestions.length ? (
                  <ul className="list-inside list-disc space-y-1 text-texto/80">
                    {configuration.formSchema.guidingQuestions.map((question, index) => (
                      <li key={`${index}-${question}`}>{question}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-texto/70">No hay preguntas orientadoras adicionales.</p>
                )}
              </section>
            )
        }
      })}

      {enabledSections.has('incident-form') && (
        <DraftManager
          saveStatus={wizard.saveStatus}
          savedAt={wizard.savedAt}
          lastSaveWasAuto={wizard.lastSaveWasAuto}
          hasDraft={wizard.hasDraft}
          isDirty={wizard.isDirty}
          attemptsUsed={
            impulse.isLoadingAttempts ? wizard.workshop.attemptsUsed : impulse.attemptsUsed
          }
          maxAttempts={impulse.maxAttempts}
          onSave={wizard.saveDraft}
          onDiscard={() => {
            sensitiveDetector.clearResults()
            return wizard.discardDraft()
          }}
        />
      )}
    </div>
  )
}
