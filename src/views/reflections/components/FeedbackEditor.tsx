import { CircleAlert, CircleCheck, RotateCcw, Save, Trash2, Undo2 } from 'lucide-react'

import Button from '../../../components/Button'
import type { ReviewStatus } from '../../../models/reflection'
import type { UseReflectionReviewReturn } from '../hooks/useReflectionReview'
import { fieldClassName, labelClassName } from './fieldStyles'
import { getStepTitle } from './stepTitle'

/* ------------------------------------------------
   FeedbackEditor — HU-02 / RF-02

   Editor del profesor: puede reescribir o quitar cada
   impulso que propuso la IA y ajustar el comentario
   general. Desde aquí guarda los cambios, los descarta,
   restaura la propuesta original o pide validar.

   Solo dibuja lo que entrega el hook useReflectionReview
   (regla R5): no tiene lógica propia. Los errores de
   campo no usan rojo, que está reservado para el
   desempeño (AI_GUIDELINES §4): se indican con ícono y
   texto.
   ------------------------------------------------ */

interface FeedbackEditorProps {
  /** Estado y acciones de la revisión, del hook useReflectionReview. */
  review: UseReflectionReviewReturn
  /** Estado de la revisión guardada (pendiente, editada o validada). */
  status: ReviewStatus
  /** Se llama al pulsar "Validar retroalimentación" (abre la confirmación). */
  onRequestValidate: () => void
}

/** Mensaje de error de un campo: ícono y texto, sin depender del color. */
function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-sm text-texto">
      <CircleAlert size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
      {message}
    </p>
  )
}

export default function FeedbackEditor({ review, status, onRequestValidate }: FeedbackEditorProps) {
  const {
    draftHints,
    draftComment,
    updateHintMessage,
    removeHint,
    updateComment,
    discardChanges,
    restoreProposal,
    isDirty,
    differsFromProposal,
    emptyHintIds,
    isCommentEmpty,
    isSaving,
    isValidating,
    canSave,
    canValidate,
    saveEdit,
  } = review

  const isBusy = isSaving || isValidating

  return (
    <section
      aria-labelledby="editor-title"
      className="rounded-xl border border-border bg-surface p-4 md:p-5"
    >
      <h3 id="editor-title" className="font-heading text-lg font-semibold text-texto">
        Retroalimentación para el estudiante
      </h3>
      <p className="mt-1 text-sm text-texto/70">
        Revisa y ajusta las orientaciones antes de validarlas. Deben orientar al estudiante, no
        redactar el relato por él.
      </p>

      {/* ---- Impulsos editables ---- */}
      <div className="mt-4 space-y-4">
        {draftHints.length === 0 ? (
          <p className="text-base text-texto/70">
            No hay impulsos en esta retroalimentación. Puedes dejar solo el comentario general.
          </p>
        ) : (
          draftHints.map((hint) => {
            const fieldId = `hint-${hint.id}`
            const isEmpty = emptyHintIds.includes(hint.id)

            return (
              <div key={hint.id}>
                <label htmlFor={fieldId} className={labelClassName}>
                  {getStepTitle(hint.step)}
                </label>
                <textarea
                  id={fieldId}
                  value={hint.message}
                  onChange={(e) => updateHintMessage(hint.id, e.target.value)}
                  rows={3}
                  disabled={isBusy}
                  aria-invalid={isEmpty}
                  aria-describedby={isEmpty ? `${fieldId}-error` : undefined}
                  className={`${fieldClassName} min-h-[5rem] resize-y py-2 leading-relaxed`}
                />
                {isEmpty && (
                  <FieldError
                    id={`${fieldId}-error`}
                    message="Escribe la orientación o quita este impulso."
                  />
                )}
                <div className="mt-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={16} />}
                    onClick={() => removeHint(hint.id)}
                    disabled={isBusy}
                  >
                    Quitar impulso
                  </Button>
                </div>
              </div>
            )
          })
        )}

        {/* ---- Comentario general ---- */}
        <div>
          <label htmlFor="general-comment" className={labelClassName}>
            Comentario general
          </label>
          <textarea
            id="general-comment"
            value={draftComment}
            onChange={(e) => updateComment(e.target.value)}
            rows={3}
            disabled={isBusy}
            aria-invalid={isCommentEmpty}
            aria-describedby={isCommentEmpty ? 'general-comment-error' : undefined}
            className={`${fieldClassName} min-h-[5rem] resize-y py-2 leading-relaxed`}
          />
          {isCommentEmpty && (
            <FieldError
              id="general-comment-error"
              message="Escribe un comentario general para poder guardar."
            />
          )}
        </div>
      </div>

      {/* ---- Estado de los cambios ---- */}
      <p className="mt-4 text-sm text-texto/70" aria-live="polite">
        {isDirty ? (
          'Tienes cambios sin guardar.'
        ) : status === 'validated' ? (
          <span className="inline-flex items-center gap-1.5">
            <CircleCheck size={16} className="text-accent-ia" aria-hidden="true" />
            Esta retroalimentación ya fue validada.
          </span>
        ) : (
          'No hay cambios sin guardar.'
        )}
      </p>

      {/* ---- Acciones ---- */}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          icon={<Save size={18} />}
          isLoading={isSaving}
          disabled={!canSave}
          onClick={() => void saveEdit()}
        >
          Guardar cambios
        </Button>
        <Button
          variant="secondary"
          icon={<CircleCheck size={18} />}
          isLoading={isValidating}
          disabled={!canValidate}
          onClick={onRequestValidate}
        >
          Validar retroalimentación
        </Button>
        <Button
          variant="outline"
          icon={<Undo2 size={18} />}
          disabled={!isDirty || isBusy}
          onClick={discardChanges}
        >
          Descartar cambios
        </Button>
        <Button
          variant="ghost"
          icon={<RotateCcw size={18} />}
          disabled={!differsFromProposal || isBusy}
          onClick={restoreProposal}
        >
          Restaurar propuesta de la IA
        </Button>
      </div>

      {isDirty && status !== 'validated' && (
        <p className="mt-2 text-sm text-texto/70">Guarda tus cambios para poder validar.</p>
      )}
    </section>
  )
}
