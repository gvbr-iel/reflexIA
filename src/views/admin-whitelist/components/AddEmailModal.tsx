import { type FormEvent, useState } from 'react'
import { CircleAlert } from 'lucide-react'

import Button from '../../../components/Button'
import Modal from '../../../components/Modal'
import { INSTITUTIONAL_DOMAIN, type WhitelistRole } from '../../../models/whitelist'
import type { ActionResult } from '../hooks/useWhitelist'
import { fieldClassName, labelClassName } from './fieldStyles'
import RoleSelector from './RoleSelector'

/* ------------------------------------------------
   AddEmailModal — HU-01 / RF-01
   Autoriza un correo institucional individual.
   Los errores se muestran con ícono y texto, sin
   rojo (reservado al desempeño, AI_GUIDELINES §4).
   ------------------------------------------------ */

interface AddEmailModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (email: string, role: WhitelistRole) => Promise<ActionResult>
}

const FORM_ID = 'add-email-form'

export default function AddEmailModal({ isOpen, onClose, onSubmit }: AddEmailModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<WhitelistRole>('student')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleClose() {
    setEmail('')
    setRole('student')
    setError(null)
    onClose()
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (email.trim() === '') {
      setError('Escribe el correo institucional que quieres autorizar.')
      return
    }

    setIsSubmitting(true)
    const result = await onSubmit(email, role)
    setIsSubmitting(false)

    if (result.ok) handleClose()
    else setError(result.message)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Autorizar correo"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} isLoading={isSubmitting}>
            Autorizar correo
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label htmlFor="add-email-input" className={labelClassName}>
            Correo institucional
          </label>
          <input
            id="add-email-input"
            type="email"
            inputMode="email"
            autoComplete="off"
            autoFocus
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError(null)
            }}
            placeholder={`usuario${INSTITUTIONAL_DOMAIN}`}
            aria-invalid={error !== null}
            aria-describedby={error ? 'add-email-error' : 'add-email-hint'}
            className={`${fieldClassName} h-11`}
          />
          {error ? (
            <p
              id="add-email-error"
              role="alert"
              className="mt-2 flex items-start gap-1.5 text-sm text-texto"
            >
              <CircleAlert size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              {error}
            </p>
          ) : (
            <p id="add-email-hint" className="mt-2 text-sm text-texto/60">
              Solo se aceptan correos {INSTITUTIONAL_DOMAIN}.
            </p>
          )}
        </div>

        <RoleSelector name="add-email-role" legend="Perfil" value={role} onChange={setRole} />
      </form>
    </Modal>
  )
}
