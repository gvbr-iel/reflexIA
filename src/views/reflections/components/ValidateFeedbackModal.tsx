import { CircleCheck, Info } from 'lucide-react'

import Button from '../../../components/Button'
import Modal from '../../../components/Modal'
import type { Reflection } from '../../../models/reflection'

/* ------------------------------------------------
   ValidateFeedbackModal — HU-02 / RF-02

   Confirmación antes de validar la retroalimentación de
   una reflexión. Resume a quién corresponde y qué incluye,
   y avisa que la entrega al estudiante es simulada en esta
   versión (todavía no hay backend).

   Es solo presentación: quien ejecuta la validación y cierra
   el modal al terminar es la vista, con las acciones del hook
   useReflectionReview. Mientras se valida no se puede cerrar,
   para no dejar la acción a medias.
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={isValidating ? () => undefined : onClose}
      title="Validar retroalimentación"
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
            Validar retroalimentación
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-base leading-relaxed text-texto">
        <p>
          Vas a validar la retroalimentación de <strong>{reflection.studentAlias}</strong> (Taller{' '}
          {reflection.workshopNumber}, intento {reflection.attemptNumber}).
        </p>
        <p>
          Incluye {hintCount} {hintCount === 1 ? 'impulso' : 'impulsos'} y un comentario general
          {wasEdited ? ', con tus ediciones' : ', tal como los propuso la IA'}.
        </p>
        <p>
          Al validarla, queda lista para entregarse al estudiante. Si después la editas, tendrás
          que validarla otra vez.
        </p>
        <p className="flex items-start gap-2 rounded-lg bg-primary/5 px-3 py-2 text-sm text-primary">
          <Info size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          Esta versión es un prototipo: la entrega al estudiante es simulada y todavía no se
          envía a ninguna cuenta.
        </p>
      </div>
    </Modal>
  )
}
