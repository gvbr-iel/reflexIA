import { Sparkles } from 'lucide-react'

import { INCIDENT_STEPS, type AIFeedback } from '../../../models/criticalIncident'
import { formatDateTime } from '../../../utils/formatDateTime'

/* ------------------------------------------------
   AIPreviewBox — HU-02 / RF-02

   Propuesta ORIGINAL de la IA ("El Impulso"), de solo
   lectura. El profesor la ve antes de actuar y sirve
   para auditar qué sugirió el sistema; nunca se modifica.
   Los cambios se hacen en el FeedbackEditor.

   Sigue el diseño de El Impulso (AI_GUIDELINES §7): fondo
   suave, borde izquierdo en accent-ia, ícono y etiqueta.
   El texto va en la fuente del cuerpo, sin cursiva, y la
   diferencia con el relato del estudiante no depende solo
   del color: lleva ícono, etiqueta y contenedor propio.
   ------------------------------------------------ */

interface AIPreviewBoxProps {
  /** Propuesta original de la IA para esta reflexión. */
  feedback: AIFeedback
}

export default function AIPreviewBox({ feedback }: AIPreviewBoxProps) {
  // Orientaciones agrupadas por paso, en el orden del asistente.
  const groups = INCIDENT_STEPS.map((step) => ({
    step,
    hints: feedback.hints.filter((hint) => hint.step === step.id),
  })).filter((group) => group.hints.length > 0)

  return (
    <section
      aria-labelledby="ai-preview-title"
      className="rounded-xl border border-l-4 border-border border-l-accent-ia bg-accent-ia/5 p-4 md:p-5"
    >
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3
          id="ai-preview-title"
          className="inline-flex items-center gap-2 font-heading text-lg font-semibold text-texto"
        >
          <Sparkles size={20} className="text-accent-ia" aria-hidden="true" />
          El Impulso
        </h3>
        <span className="text-sm text-texto/70">
          Propuesta original de la IA · {formatDateTime(feedback.createdAt)}
        </span>
      </header>

      <p className="mt-1 text-sm text-texto/70">
        Es solo de lectura: sirve para auditar lo que sugirió el sistema. Tus cambios se hacen
        en el editor de más abajo.
      </p>

      <p className="mt-3 text-base leading-relaxed text-texto">{feedback.generalComment}</p>

      {groups.length === 0 ? (
        <p className="mt-3 text-base leading-relaxed text-texto/70">
          La IA no encontró aspectos por profundizar en este intento.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {groups.map(({ step, hints }) => (
            <div key={step.id}>
              <h4 className="font-heading text-sm font-semibold text-texto">{step.title}</h4>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-base leading-relaxed text-texto">
                {hints.map((hint) => (
                  <li key={hint.id}>{hint.message}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
