import { type ReactNode, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

/* ------------------------------------------------
   Modal — componente reutilizable global
   Overlay, cierre con Escape / clic exterior,
   cabecera con título y botón cerrar.
   Se renderiza en un portal sobre <body> para que
   los estilos del contenedor donde se usa (márgenes
   de space-y-*, overflow, z-index) no lo afecten.
   ------------------------------------------------ */

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`
          relative w-full ${sizeStyles[size]}
          bg-surface rounded-xl shadow-lg
          border border-border
          animate-in fade-in zoom-in-95
          flex flex-col max-h-[85vh]
        `}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2
            id="modal-title"
            className="font-heading font-semibold text-lg text-texto"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="
              p-1.5 rounded-lg text-texto/60
              hover:bg-bg hover:text-texto
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
              transition-colors
            "
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Pie (opcional) */}
        {footer && (
          <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
