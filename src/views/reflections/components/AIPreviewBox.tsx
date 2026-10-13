import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Scale,
  Sparkles,
  XCircle,
} from 'lucide-react'

import { INCIDENT_STEPS, type AIFeedback } from '../../../models/criticalIncident'
import { formatDateTime } from '../../../utils/formatDateTime'
import { getPerformanceStatus } from '../../../utils/performanceStatus'

/* ------------------------------------------------
   AIPreviewBox — HU-02 / RF-02

   Propuesta ORIGINAL de la IA ("El Impulso"), de solo
   lectura. El profesor la ve antes de actuar y sirve
   para auditar qué sugirió el sistema; nunca se modifica.
   Los cambios se hacen en el FeedbackEditor.

   Muestra:
     1. La nota orientativa sugerida por la IA (escala 1.0 a 7.0)
     2. La justificación pedagógica detallada de dicha sugerencia
     3. El desglose de cumplimiento de criterios analizados
     4. Las orientaciones pedagógicas sugeridas ("El Impulso")

   IMPORTANTE: Aclara que la IA NO califica automáticamente
   al estudiante, sino que proporciona un diagnóstico
   para apoyar el juicio pedagógico del docente.
   ------------------------------------------------ */

interface AIPreviewBoxProps {
  /** Propuesta original de la IA para esta reflexión. */
  feedback: AIFeedback
}

export default function AIPreviewBox({ feedback }: AIPreviewBoxProps) {
  const [showRubricDetails, setShowRubricDetails] = useState(false)

  // Orientaciones agrupadas por paso, en el orden del asistente.
  const groups = INCIDENT_STEPS.map((step) => ({
    step,
    hints: feedback.hints.filter((hint) => hint.step === step.id),
  })).filter((group) => group.hints.length > 0)

  const performanceStatus = getPerformanceStatus(feedback.suggestedGrade)

  return (
    <section
      aria-labelledby="ai-preview-title"
      className="space-y-4 rounded-xl border border-l-4 border-border border-l-accent-ia bg-accent-ia/5 p-4 md:p-5"
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3
            id="ai-preview-title"
            className="inline-flex items-center gap-2 font-heading text-lg font-semibold text-texto"
          >
            <Sparkles size={20} className="text-accent-ia" aria-hidden="true" />
            Revisión diagnóstica de la IA
          </h3>
          <p className="text-sm text-texto/70">
            Propuesta generada automáticamente · {formatDateTime(feedback.createdAt)}
          </p>
        </div>

        {/* Badge de nota sugerida por IA */}
        <div className="inline-flex items-center gap-2 rounded-lg border border-accent-ia/30 bg-surface px-3 py-1.5 shadow-sm">
          <Scale size={16} className="text-accent-ia" aria-hidden="true" />
          <span className="text-xs font-medium text-texto/70">Nota sugerida por IA:</span>
          <span className="font-heading text-base font-bold text-accent-ia">
            {feedback.suggestedGrade.toFixed(1)}
          </span>
          <span className="text-xs text-texto/50">/ 7.0</span>
        </div>
      </header>

      {/* Tarjeta de justificación pedagógica de la IA */}
      <div className="rounded-lg border border-border/70 bg-surface/90 p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                performanceStatus === 'failed'
                  ? 'bg-perf-fail/10 text-perf-fail border border-perf-fail/30'
                  : performanceStatus === 'approved'
                    ? 'bg-perf-pass/10 text-perf-pass border border-perf-pass/30'
                    : 'bg-perf-excellent/10 text-perf-excellent border border-perf-excellent/30'
              }`}
            >
              {performanceStatus === 'failed'
                ? 'Diagnóstico: Reprobado'
                : performanceStatus === 'approved'
                  ? 'Diagnóstico: Aprobado'
                  : 'Diagnóstico: Sobresaliente'}
            </span>
            <span className="text-xs text-texto/60">
              Escala 1.0 – 7.0 (Sugerencia orientativa)
            </span>
          </div>

          <span className="inline-flex items-center gap-1 text-xs text-texto/60">
            <AlertCircle size={13} className="text-primary/70" aria-hidden="true" />
            La IA nunca asigna la nota oficial
          </span>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-texto/70">
            Justificación del puntaje sugerido por la IA
          </h4>
          <p className="mt-1 text-sm leading-relaxed text-texto whitespace-pre-line">
            {feedback.gradeJustification}
          </p>
        </div>

        {/* Desglose de rúbrica orientativa */}
        {feedback.rubricBreakdown && feedback.rubricBreakdown.length > 0 && (
          <div className="pt-2 border-t border-border/40">
            <button
              type="button"
              onClick={() => setShowRubricDetails((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {showRubricDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showRubricDetails
                ? 'Ocultar desglose de los 12 criterios de la rúbrica'
                : `Ver desglose de los 12 criterios analizados (${
                    feedback.rubricBreakdown.filter((c) => c.isMet).length
                  }/12 cumplidos)`}
            </button>

            {showRubricDetails && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {feedback.rubricBreakdown.map((criterion) => (
                  <div
                    key={`${criterion.step}-${criterion.key}`}
                    className={`flex items-start gap-2 rounded border p-2 text-xs transition-colors ${
                      criterion.isMet
                        ? 'border-perf-pass/30 bg-perf-pass/5 text-texto'
                        : 'border-border bg-bg/50 text-texto/60'
                    }`}
                  >
                    {criterion.isMet ? (
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-perf-pass" />
                    ) : (
                      <XCircle size={14} className="mt-0.5 shrink-0 text-texto/40" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium">{criterion.label}</p>
                      <p className="text-[11px] text-texto/50">
                        {criterion.points.toFixed(1)} / {criterion.maxPoints.toFixed(1)} pts
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Orientaciones pedagógicas (El Impulso) */}
      <div className="pt-2">
        <h4 className="font-heading text-sm font-semibold text-texto">
          Orientaciones pedagógicas propuestas (&ldquo;El Impulso&rdquo;)
        </h4>
        <p className="mt-1 text-base leading-relaxed text-texto">{feedback.generalComment}</p>

        {groups.length === 0 ? (
          <p className="mt-2 text-sm text-texto/70">
            La IA no detectó omisiones principales en los pasos del relato.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {groups.map(({ step, hints }) => (
              <div key={step.id} className="rounded-lg bg-surface/60 p-3 border border-border/50">
                <h5 className="font-heading text-xs font-bold text-texto uppercase tracking-wider">
                  {step.title}
                </h5>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-sm leading-relaxed text-texto">
                  {hints.map((hint) => (
                    <li key={hint.id}>{hint.message}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
