import { useState } from 'react'
import { Save, Trash2 } from 'lucide-react'

import Button from '../../../components/Button'
import Modal from '../../../components/Modal'
import type { SaveStatus } from '../hooks/useIncidentWizard'

/* ------------------------------------------------
   DraftManager — gestor de borradores (RF-03)
   Guardado manual, estado del último guardado y
   descarte con confirmación. Muestra el contador de
   intentos para dejar claro que guardar un borrador
   NO descuenta intentos de revisión.
   Sin lógica propia (R5): solo el estado del modal.
   ------------------------------------------------ */

interface DraftManagerProps {
  saveStatus: SaveStatus
  /** Marca temporal ISO 8601 del último guardado (null si no hay). */
  savedAt: string | null
  /** Si el último guardado fue automático. */
  lastSaveWasAuto: boolean
  hasDraft: boolean
  /** Si hay cambios sin guardar. */
  isDirty: boolean
  attemptsUsed: number
  maxAttempts: number
  onSave: () => void
  onDiscard: () => void
}

/** Formatea una marca temporal ISO 8601 como hora local (HH:MM). */
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function DraftManager({
  saveStatus,
  savedAt,
  lastSaveWasAuto,
  hasDraft,
  isDirty,
  attemptsUsed,
  maxAttempts,
  onSave,
  onDiscard,
}: DraftManagerProps) {
  // Controla la ventana que confirma si se quiere descartar el borrador.
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  /** Texto del estado del guardado ("Guardando…", "Borrador guardado a las…", etc.). */
  function statusMessage(): string {
    if (saveStatus === 'saving') return 'Guardando borrador…'
    if (saveStatus === 'error') {
      return 'No se pudo guardar el borrador. Intenta nuevamente.'
    }
    if (savedAt) {
      return `Borrador guardado a las ${formatTime(savedAt)}${
        lastSaveWasAuto ? ' (guardado automático)' : ''
      }.`
    }
    return 'Aún no has guardado un borrador.'
  }

  /** Cierra la confirmación y descarta el borrador. */
  function handleConfirmDiscard() {
    setIsConfirmOpen(false)
    onDiscard()
  }

  return (
    <>
      <section
        aria-label="Borrador"
        className="rounded-xl border border-border bg-surface p-4 md:p-6 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm text-texto" role="status" aria-live="polite">
              {statusMessage()}
            </p>
            {isDirty && saveStatus !== 'saving' && (
              <p className="text-sm font-medium text-primary">
                Tienes cambios sin guardar.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {hasDraft && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 size={16} />}
                onClick={() => setIsConfirmOpen(true)}
                disabled={saveStatus === 'saving'}
              >
                Descartar borrador
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              icon={<Save size={16} />}
              isLoading={saveStatus === 'saving'}
              onClick={onSave}
            >
              Guardar borrador
            </Button>
          </div>
        </div>

        <p className="text-sm text-texto/60">
          Intentos de revisión: {attemptsUsed} de {maxAttempts}. Guardar un
          borrador no consume intentos.
        </p>
      </section>

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Descartar borrador"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmDiscard}>Descartar borrador</Button>
          </>
        }
      >
        <p className="text-texto/80">
          Se eliminará el texto que guardaste en este taller y los cuatro
          pasos quedarán vacíos. Esta acción no se puede deshacer.
        </p>
      </Modal>
    </>
  )
}
