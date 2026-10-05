import { CircleAlert, CircleCheck, X } from 'lucide-react'

import type { PacingNotice as Notice } from '../hooks/useWorkPacing'

/* ------------------------------------------------
   PacingNotice — HU-06 / RF-06

   Aviso que muestra el resultado de guardar o de
   restablecer (por ejemplo, "Cambios guardados").

   Este componente solo lo dibuja. Quien decide cuándo
   aparece y cuándo se oculta solo (a los 6 segundos) es
   el hook useWorkPacing.
   ------------------------------------------------ */

interface PacingNoticeProps {
  /** El aviso a mostrar (null si no hay ninguno). */
  notice: Notice | null
  /** Se llama cuando el usuario cierra el aviso con la ✕. */
  onDismiss: () => void
}

export default function PacingNotice({ notice, onDismiss }: PacingNoticeProps) {
  return (
    // Esta región existe siempre, aunque no haya aviso: así los lectores de
    // pantalla detectan el cambio y anuncian el mensaje cuando aparece.
    <div aria-live="polite" role="status">
      {notice && (
        <div
          // La key cambia con cada aviso nuevo, para que se dibuje de cero.
          key={notice.id}
          // Éxito: borde y fondo azules suaves. Error: borde y fondo neutros.
          // No se usa rojo: está reservado para el desempeño (AI_GUIDELINES §4).
          className={`flex items-start gap-3 rounded-xl border p-4 ${
            notice.tone === 'success'
              ? 'border-primary/30 bg-primary/5'
              : 'border-border bg-surface'
          }`}
        >
          {/* El ícono cambia según el tipo de aviso, no solo el color. */}
          {notice.tone === 'success' ? (
            <CircleCheck size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          ) : (
            <CircleAlert size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          )}

          <p className="flex-1 text-sm text-texto md:text-base">{notice.message}</p>

          {/* Botón para cerrar el aviso antes de que se oculte solo. */}
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
