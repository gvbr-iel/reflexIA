import { Award, CircleCheck, Info, Sparkles } from 'lucide-react'

import Button from '../../../components/Button'
import Modal from '../../../components/Modal'
import type { Reflection } from '../../../models/reflection'
import { getPerformanceStatus } from '../../../utils/performanceStatus'
import PerformanceBadge from '../../teacher-dashboard/components/PerformanceBadge'
import { getStudentLabel } from './studentLabel'

/* ------------------------------------------------
   ValidateFeedbackModal — HU-02 / RF-02

   Confirmación antes de validar la retroalimentación y la
   calificación de una reflexión. Resume a quién corresponde,
   la nota real asignada por el docente frente a la sugerencia
   de la IA, y ratifica que la calificación definitiva es una
   decisión pedagógica humana.
   ------------------------------------------------ */

interface ValidateFeedbackModalProps {
  isOpen: boolean
  /** Reflexión cuya retroalimentación se va a validar. */
  reflection: Reflection
  /** true mientras se valida: los botones muestran el avance y no se puede cerrar. */
  isValidating: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function ValidateFeedbackModal({
  isOpen,
  reflection,
  isValidating,
  onClose,
  onConfirm,
}: ValidateFeedbackModalProps) {
  const hintCount = reflection.review.hints.length
  const wasEdited = reflection.review.status === 'edited'
  const assignedGrade = reflection.review.assignedGrade
  const suggestedGrade = reflection.aiFeedback.suggestedGrade

  return (
    <Modal
      isOpen={isOpen}
      onClose={isValidating ? () => undefined : onClose}
      title="Validar retroalimentación y calificación"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isValidating}>
            Cancelar
          </Button>
          <Button
            variant="secondary"
            icon={<CircleCheck size={18} />}
            isLoading={isValidating}
            onClick={onConfirm}
          >
            Confirmar y validar entrega
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-base leading-relaxed text-texto">
        <p>
          Vas a oficializar la evaluación y retroalimentación de{' '}
          <strong>{getStudentLabel(reflection)}</strong> (Taller {reflection.workshopNumber}, intento{' '}
          {reflection.attemptNumber}).
        </p>

        {/* Resumen de Calificación */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-primary/10 pb-2">
            <span className="inline-flex items-center gap-1.5 font-heading text-sm font-semibold text-texto">
              <Award size={18} className="text-primary" />
              Nota real asignada por ti:
            </span>
            {assignedGrade !== null ? (
              <div className="flex items-center gap-2">
                <span className="font-heading text-xl font-bold text-primary">
                  {assignedGrade.toFixed(1)}
                </span>
                <PerformanceBadge status={getPerformanceStatus(assignedGrade)} />
              </div>
            ) : (
              <span className="text-sm font-medium text-perf-fail">Sin calificar</span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-texto/70">
            <span className="inline-flex items-center gap-1">
              <Sparkles size={14} className="text-accent-ia" />
              Nota sugerida por IA (orientativa):
            </span>
            <span>{suggestedGrade.toFixed(1)} / 7.0</span>
          </div>

          {reflection.review.gradeNotes && (
            <div className="border-t border-primary/10 pt-2 text-xs text-texto/80">
              <span className="font-medium">Tus observaciones de la nota: </span>
              <span className="italic">{reflection.review.gradeNotes}</span>
            </div>
          )}
        </div>

        <p className="text-sm text-texto/80">
          Esta retroalimentación incluye {hintCount} {hintCount === 1 ? 'impulso' : 'impulsos'} y un
          comentario general{wasEdited ? ', con tus ediciones docentes' : ', tal como los propuso la IA'}.
        </p>

        <p className="flex items-start gap-2 rounded-lg bg-accent-ia/10 px-3 py-2 text-xs leading-relaxed text-texto">
          <Info size={16} className="mt-0.5 shrink-0 text-accent-ia" aria-hidden="true" />
          Al confirmar, la calificación y orientaciones quedan oficialmente validadas por ti como
          docente guía para este taller.
        </p>
      </div>
    </Modal>
  )
}
