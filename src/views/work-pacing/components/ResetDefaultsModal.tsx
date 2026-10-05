import { RotateCcw } from 'lucide-react'

import Button from '../../../components/Button'
import Modal from '../../../components/Modal'

/* ------------------------------------------------
   ResetDefaultsModal — HU-06 / RF-06

   Ventana de confirmación para restablecer los valores
   por defecto. Se pide confirmar porque la acción borra
   todo lo que el profesor configuró.

   Usa el componente global Modal. El botón de confirmar
   NO usa la variante "danger": el rojo está reservado
   para el desempeño (AI_GUIDELINES §4).
   ------------------------------------------------ */

interface ResetDefaultsModalProps {
  /** true para mostrar la ventana. */
  isOpen: boolean
  /** true mientras se restablece: bloquea el cierre y muestra un indicador de carga. */
  isResetting: boolean
  /** true si hay cambios sin guardar, que también se perderían. */
  hasUnsavedChanges: boolean
  /** Se llama al cancelar o al cerrar la ventana. */
  onCancel: () => void
  /** Se llama al confirmar el restablecimiento. */
  onConfirm: () => void
}

export default function ResetDefaultsModal({
  isOpen,
  isResetting,
  hasUnsavedChanges,
  onCancel,
  onConfirm,
}: ResetDefaultsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      // Cerrar con Esc o con un clic fuera de la ventana. Mientras se está
      // restableciendo no se permite cerrar, para no dejar la acción a medias.
      onClose={() => {
        if (!isResetting) onCancel()
      }}
      title="Restablecer valores por defecto"
      size="sm"
      // Botones del pie de la ventana.
      footer={
        <>
          <Button variant="outline" onClick={onCancel} disabled={isResetting}>
            Cancelar
          </Button>
          <Button icon={<RotateCcw size={18} />} onClick={onConfirm} isLoading={isResetting}>
            Restablecer
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-texto">
          Los plazos y los intentos de todas las actividades volverán a sus valores originales.
        </p>

        {/* Solo se avisa de los cambios sin guardar si de verdad existen. */}
        {hasUnsavedChanges && (
          <p className="text-sm text-texto/70">
            También se descartarán los cambios que aún no has guardado.
          </p>
        )}
      </div>
    </Modal>
  )
}
