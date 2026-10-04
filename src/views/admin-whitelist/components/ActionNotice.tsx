import { CircleAlert, CircleCheck, X } from 'lucide-react'

import type { WhitelistNotice } from '../hooks/useWhitelist'

/* ------------------------------------------------
   ActionNotice — HU-01 / RF-01
   Aviso del resultado de una acción. Se oculta solo
   (el temporizador vive en useWhitelist).
   ------------------------------------------------ */

interface ActionNoticeProps {
  notice: WhitelistNotice | null
  onDismiss: () => void
}

export default function ActionNotice({ notice, onDismiss }: ActionNoticeProps) {
  /* La región existe siempre para que los lectores de pantalla anuncien el cambio. */
  return (
    <div aria-live="polite" role="status">
      {notice && (
        <div
          key={notice.id}
          className={`flex items-start gap-3 rounded-xl border p-4 ${
            notice.tone === 'success'
              ? 'border-primary/30 bg-primary/5'
              : 'border-border bg-surface'
          }`}
        >
          {notice.tone === 'success' ? (
            <CircleCheck size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          ) : (
            <CircleAlert size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          )}
          <p className="flex-1 text-sm text-texto md:text-base">{notice.message}</p>
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-lg p-1 text-texto/60 transition-colors hover:bg-bg hover:text-texto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            aria-label="Cerrar aviso"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
