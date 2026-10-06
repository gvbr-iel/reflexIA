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
  /** Controla si la ventana se ve. Con false el componente no dibuja nada. */
  isOpen: boolean
  /** Se llama al cerrar: botón X, tecla Escape o clic en el fondo oscuro. */
  onClose: () => void
  /** Título de la cabecera (también nombra el diálogo para lectores de pantalla). */
  title: string
  /** Contenido del cuerpo. */
  children: ReactNode
  /** Botones del pie (opcional), por ejemplo "Cancelar" y "Confirmar". */
  footer?: ReactNode
  /** Ancho máximo de la ventana. */
  size?: 'sm' | 'md' | 'lg'
}

/** Ancho máximo de cada tamaño (clases de Tailwind). */
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
  /** Cierra la ventana al presionar Escape. useCallback mantiene la misma
      función entre renders para poder quitar el listener después. */
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  // Mientras está abierta: escucha la tecla Escape y bloquea el scroll de la página.
  // La función de limpieza (return) deshace ambas cosas al cerrar.
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

  // Cerrada: no se dibuja nada.
  if (!isOpen) return null

  // createPortal dibuja la ventana directamente dentro de <body>.
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
