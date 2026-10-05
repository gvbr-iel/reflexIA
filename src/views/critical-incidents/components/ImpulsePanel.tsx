import { CircleAlert, Info, Sparkles, X } from 'lucide-react'

import Button from '../../../components/Button'
import { INCIDENT_STEPS } from '../../../models/criticalIncident'
import { formatDateTime } from '../../../utils/formatDateTime'
import type { UseImpulseReturn } from '../hooks/useImpulse'

/* ------------------------------------------------
   ImpulsePanel — HU-02 / RF-02

   "El Impulso": caja de retroalimentación de la IA junto
   al asistente. Muestra el contador de intentos restantes
   (RF-06), el botón para pedir un impulso, el estado de
   carga mientras la IA responde (hasta 10 s, RNF-05), el
   error si algo falla y las orientaciones del intento
   elegido, agrupadas por paso.

   Sigue el diseño de El Impulso (AI_GUIDELINES §7): fondo
   suave, borde izquierdo en accent-ia, ícono y etiqueta.
   El texto va en la fuente del cuerpo, sin cursiva, y la
   diferencia con el texto del alumno no depende solo del
   color. Las orientaciones son desplegables.

   La IA nunca redacta ni corrige el relato (AI_GUIDELINES §8):
   solo señala qué elementos faltan.

   Solo dibuja lo que entrega el hook useImpulse (regla R5).
   Los avisos no usan rojo, reservado al desempeño
   (AI_GUIDELINES §4): se indican con ícono y texto.
   ------------------------------------------------ */

interface ImpulsePanelProps {
  /** Estado y acciones de "El Impulso", del hook useImpulse. */
  impulse: UseImpulseReturn
}

export default function ImpulsePanel({ impulse }: ImpulsePanelProps) {
  const {
    attempts,
    maxAttempts,
    attemptsRemaining,
    isLoadingAttempts,
    loadError,
    retryLoad,
    viewedFeedback,
    viewedAttemptNumber,
    viewAttempt,
    canRequest,
    blockedReason,
    isRequesting,
    requestError,
    dismissRequestError,
    requestImpulse,
  } = impulse

  // Orientaciones del intento elegido, agrupadas por paso en el orden del asistente.
  const groups = viewedFeedback
    ? INCIDENT_STEPS.map((step) => ({
        step,
        hints: viewedFeedback.hints.filter((hint) => hint.step === step.id),
      })).filter((group) => group.hints.length > 0)
    : []

  return (
    <section
      aria-labelledby="impulse-title"
      className="space-y-4 rounded-xl border border-l-4 border-border border-l-accent-ia bg-accent-ia/5 p-4 md:p-5"
    >
      {/* ---- Encabezado y contador de intentos ---- */}
      <header className="space-y-1">
        <h2
          id="impulse-title"
          className="inline-flex items-center gap-2 font-heading text-lg font-semibold text-texto"
        >
          <Sparkles size={20} className="text-accent-ia" aria-hidden="true" />
          El Impulso
        </h2>
        <p className="text-sm text-texto/70">
          La IA te orienta sobre qué elementos faltan en tu relato. Nunca lo redacta ni lo
          corrige por ti.
        </p>
        <p className="text-base font-medium text-texto" aria-live="polite">
          {isLoadingAttempts && attempts.length === 0
            ? 'Cargando tus intentos…'
            : `Te quedan ${attemptsRemaining} de ${maxAttempts} intentos de revisión`}
        </p>
      </header>

      {/* ---- Botón para pedir el impulso ---- */}
      <div className="space-y-2">
        <Button
          icon={<Sparkles size={18} />}
          isLoading={isRequesting}
          disabled={!canRequest}
          onClick={() => void requestImpulse()}
          aria-describedby={blockedReason ? 'impulse-blocked' : undefined}
        >
          Pedir impulso
        </Button>

        {blockedReason && (
          <p id="impulse-blocked" className="flex items-start gap-1.5 text-sm text-texto/70">
            <Info size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
            {blockedReason}
          </p>
        )}
      </div>

      {/* ---- Error de la solicitud ---- */}
      {requestError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3"
        >
          <CircleAlert size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <p className="flex-1 text-sm text-texto md:text-base">{requestError}</p>
          <button
            type="button"
            onClick={dismissRequestError}
            className="shrink-0 rounded-lg p-1 text-texto/60 transition-colors hover:bg-bg hover:text-texto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            aria-label="Cerrar aviso"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* ---- Resultado: carga, error, vacío o impulso ---- */}
      {isRequesting ? (
        <div role="status" aria-busy="true" className="space-y-2">
          <p className="text-sm text-texto/70">
            La IA está analizando tu relato. Puede tardar hasta 10 segundos.
          </p>
          <div className="h-4 w-11/12 animate-pulse rounded bg-border/50" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-border/50" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-border/50" />
        </div>
      ) : isLoadingAttempts && attempts.length === 0 ? (
        <div role="status" aria-busy="true" aria-label="Cargando tus intentos" className="space-y-2">
          <div className="h-4 w-11/12 animate-pulse rounded bg-border/50" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-border/50" />
        </div>
      ) : loadError ? (
        <div role="alert" className="space-y-2">
          <p className="flex items-start gap-1.5 text-base text-texto">
            <CircleAlert size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
            {loadError}
          </p>
          <Button variant="outline" size="sm" onClick={() => void retryLoad()}>
            Reintentar
          </Button>
        </div>
      ) : viewedFeedback ? (
        <div className="space-y-3">
          {/* Selector de intentos: solo si hay más de uno. */}
          {attempts.length > 1 && (
            <div role="group" aria-label="Impulsos de tus intentos" className="flex flex-wrap gap-2">
              {attempts.map((attempt) => (
                <Button
                  key={attempt.attemptNumber}
                  size="sm"
                  variant={attempt.attemptNumber === viewedAttemptNumber ? 'primary' : 'outline'}
                  aria-pressed={attempt.attemptNumber === viewedAttemptNumber}
                  onClick={() => viewAttempt(attempt.attemptNumber)}
                >
                  Intento {attempt.attemptNumber}
                </Button>
              ))}
            </div>
          )}

          {/* Orientaciones del intento elegido (desplegable). */}
          <details
            key={viewedAttemptNumber}
            open
            className="rounded-lg border border-border bg-surface p-3"
          >
            <summary className="cursor-pointer rounded font-heading text-base font-semibold text-texto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
              Orientaciones del intento {viewedAttemptNumber}
            </summary>

            <div className="mt-3 space-y-3">
              <p className="text-sm text-texto/70">
                Generadas el {formatDateTime(viewedFeedback.createdAt)}
              </p>
              <p className="text-base leading-relaxed text-texto">
                {viewedFeedback.generalComment}
              </p>

              {groups.length === 0 ? (
                <p className="text-base leading-relaxed text-texto/70">
                  La IA no encontró aspectos por profundizar en este intento.
                </p>
              ) : (
                groups.map(({ step, hints }) => (
                  <div key={step.id}>
                    <h3 className="font-heading text-sm font-semibold text-texto">{step.title}</h3>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-base leading-relaxed text-texto">
                      {hints.map((hint) => (
                        <li key={hint.id}>{hint.message}</li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </details>
        </div>
      ) : (
        <p className="text-base leading-relaxed text-texto/70">
          Aún no pediste un impulso. Cuando completes los 4 pasos, pídelo para saber qué
          aspectos de tu relato puedes profundizar.
        </p>
      )}
    </section>
  )
}
