import { UserX } from 'lucide-react'

import Button from '../../../components/Button'
import Modal from '../../../components/Modal'
import { ROLE_LABELS, type WhitelistEntry } from '../../../models/whitelist'

/* ------------------------------------------------
   RevokeAccessModal — HU-01 / RF-01
   Confirma la revocación. El acceso se pierde de
   inmediato y puede restablecerse después.
   Sin variante "danger": el rojo es solo semántico
   de desempeño (AI_GUIDELINES §4).
   ------------------------------------------------ */

interface RevokeAccessModalProps {
  /** Entrada a revocar; el modal se muestra mientras no sea null. */
  entry: WhitelistEntry | null
  onCancel: () => void
  onConfirm: (entry: WhitelistEntry) => void
}

export default function RevokeAccessModal({ entry, onCancel, onConfirm }: RevokeAccessModalProps) {
  return (
    <Modal
      isOpen={entry !== null}
      onClose={onCancel}
      title="Revocar acceso"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button icon={<UserX size={18} />} onClick={() => entry && onConfirm(entry)}>
            Revocar acceso
          </Button>
        </>
      }
    >
      {entry && (
        <div className="space-y-3">
          <p className="text-texto">
            <span className="break-all font-medium">{entry.email}</span>
            <span className="text-texto/70"> ({ROLE_LABELS[entry.role]})</span> no podrá ingresar
            a ReflexIA desde este momento.
          </p>
          <p className="text-sm text-texto/70">
            Su información no se elimina: puedes restablecer el acceso cuando lo necesites.
          </p>
        </div>
      )}
    </Modal>
  )
}
