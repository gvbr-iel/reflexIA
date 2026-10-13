import {
  Award,
  CircleAlert,
  CircleCheck,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Undo2,
} from 'lucide-react'

import Button from '../../../components/Button'
import type { ReviewStatus } from '../../../models/reflection'
import { getPerformanceStatus } from '../../../utils/performanceStatus'
import PerformanceBadge from '../../teacher-dashboard/components/PerformanceBadge'
import type { UseReflectionReviewReturn } from '../hooks/useReflectionReview'
import { fieldClassName, labelClassName } from './fieldStyles'
import { getStepTitle } from './stepTitle'

/* ------------------------------------------------
   FeedbackEditor — HU-02 / RF-02

   Editor del profesor guía:
     1. Revisa, edita o quita los impulsos sugeridos por la IA.
     2. Ajusta el comentario general orientativo.
     3. ASIGNA LA NOTA REAL DEFINITIVA: La IA nunca califica
        automáticamente al estudiante ni asigna la nota oficial.
        El docente es el único facultado para ingresar y validar
        la nota final del estudiante (escala 1.0 a 7.0).
     4. Guarda borradores o valida la retroalimentación.

   Solo dibuja lo que entrega el hook useReflectionReview (regla R5).
   ------------------------------------------------ */

interface FeedbackEditorProps {
  /** Estado y acciones de la revisión, del hook useReflectionReview. */
  review: UseReflectionReviewReturn
  /** Estado de la revisión guardada (pendiente, editada o validada). */
  status: ReviewStatus
  /** Nota sugerida por la IA (para ofrecerla como punto de partida). */
  suggestedGrade?: number
  /** Se llama al pulsar "Validar retroalimentación" (abre la confirmación). */
  onRequestValidate: () => void
}

/** Mensaje de error de un campo: ícono y texto, sin depender solo del color. */
function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-sm text-texto">
      <CircleAlert size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
      {message}
    </p>
  )
}

export default function FeedbackEditor({
  review,
  status,
  suggestedGrade,
  onRequestValidate,
}: FeedbackEditorProps) {
  const {
    draftHints,
    draftComment,
    draftGrade,
    parsedGrade,
    draftGradeNotes,
    gradeError,
    updateHintMessage,
    removeHint,
    updateComment,
    updateGrade,
    updateGradeNotes,
    applySuggestedGrade,
    discardChanges,
    restoreProposal,
    isDirty,
    differsFromProposal,
    emptyHintIds,
    isCommentEmpty,
    isGradeValid,
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
      className="space-y-6 rounded-xl border border-border bg-surface p-4 md:p-5"
    >
      <div>
        <h3 id="editor-title" className="font-heading text-lg font-semibold text-texto">
          Revisión docente y calificación oficial
        </h3>
        <p className="mt-1 text-sm text-texto/70">
          Ajusta las orientaciones pedagógicas y asigna la nota definitiva del estudiante. Recuerda
          que la IA solo ofrece una propuesta; la nota oficial siempre la defines tú.
        </p>
      </div>

      {/* ---- Sección 1: Calificación Real del Docente ---- */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 md:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/10 pb-3">
          <div className="inline-flex items-center gap-2">
            <Award size={20} className="text-primary" aria-hidden="true" />
            <h4 className="font-heading text-base font-semibold text-texto">
              Calificación oficial del estudiante (Nota real)
            </h4>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-texto/80 border border-border/80">
            <ShieldCheck size={14} className="text-accent-ia" aria-hidden="true" />
            Evaluación humana docente
          </span>
        </div>

        <p className="text-xs text-texto/70 leading-relaxed">
          Se estableció explícitamente que la IA <strong>no califica</strong> a los estudiantes. Ingresa
          a continuación la nota real oficial en escala chilena (1.0 a 7.0, aprobatoria desde 4.0).
        </p>

        <div className="grid gap-4 sm:grid-cols-[14rem_minmax(0,1fr)] items-start">
          {/* Campo de Nota Real */}
          <div>
            <label htmlFor="teacher-grade-input" className={labelClassName}>
              Nota asignada por el docente *
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                id="teacher-grade-input"
                type="number"
                step="0.1"
                min="1.0"
                max="7.0"
                placeholder="Ej: 5.5"
                value={draftGrade}
                onChange={(e) => updateGrade(e.target.value)}
                disabled={isBusy}
                aria-invalid={!!gradeError}
                aria-describedby={gradeError ? 'grade-error-msg' : undefined}
                className={`${fieldClassName} text-lg font-bold w-full`}
              />
              {parsedGrade !== null && isGradeValid && (
                <div className="shrink-0">
                  <PerformanceBadge status={getPerformanceStatus(parsedGrade)} />
                </div>
              )}
            </div>

            {gradeError && <FieldError id="grade-error-msg" message={gradeError} />}

            {/* Atajo para usar nota de IA como referencia */}
            {suggestedGrade !== undefined && (
              <div className="mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={<Sparkles size={14} className="text-accent-ia" />}
                  onClick={applySuggestedGrade}
                  disabled={isBusy}
                >
                  Tomar nota sugerida ({suggestedGrade.toFixed(1)}) como base
                </Button>
              </div>
            )}
          </div>

          {/* Justificación / Observaciones de la nota docente */}
          <div>
            <label htmlFor="teacher-grade-notes" className={labelClassName}>
              Fundamentación u observaciones docentes de la nota (opcional)
            </label>
            <textarea
              id="teacher-grade-notes"
              rows={3}
              placeholder="Escribe aquí las observaciones formativas o el criterio aplicado para la nota asignada..."
              value={draftGradeNotes}
              onChange={(e) => updateGradeNotes(e.target.value)}
              disabled={isBusy}
              className={`${fieldClassName} min-h-[4.5rem] resize-y py-2 leading-relaxed text-sm`}
            />
          </div>
        </div>
      </div>

      {/* ---- Sección 2: Impulsos editables ---- */}
      <div className="space-y-4">
        <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-texto/80">
          Orientaciones pedagógicas para el estudiante
        </h4>

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
      <div className="text-sm text-texto/70" aria-live="polite">
        {isDirty ? (
          <span className="text-primary font-medium">Tienes cambios sin guardar.</span>
        ) : status === 'validated' ? (
          <span className="inline-flex items-center gap-1.5 text-accent-ia font-medium">
            <CircleCheck size={16} aria-hidden="true" />
            Esta retroalimentación ya fue validada con nota oficial.
          </span>
        ) : (
          'No hay cambios sin guardar.'
        )}
      </div>

      {/* ---- Acciones ---- */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
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
          Validar retroalimentación y nota
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

      {/* Avisos de validación contextual */}
      {isDirty && status !== 'validated' && (
        <p className="text-xs text-texto/70">
          Guarda tus cambios antes de validar la entrega oficial del estudiante.
        </p>
      )}

      {!isDirty && status !== 'validated' && (!draftGrade.trim() || !isGradeValid) && (
        <p className="text-xs text-primary font-medium inline-flex items-center gap-1">
          <CircleAlert size={14} />
          Para validar la retroalimentación, primero debes ingresar una nota real válida entre 1.0 y 7.0 y guardar.
        </p>
      )}
    </section>
  )
}
