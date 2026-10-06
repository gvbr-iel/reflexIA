import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

import Button from '../../../components/Button'
import type { TheoryReference } from '../../../models/criticalIncident'

/* ------------------------------------------------
   TheoryReferenceSidebar — marco de referencia (RF-03)
   Panel con las referencias bibliográficas pertinentes
   al paso actual, visibles mientras el estudiante escribe.
   Pantalla ancha (desde 1280 px): siempre visible, como
   columna lateral. Móvil y tablet (360 px en adelante):
   plegable, cerrado por defecto para no empujar el formulario.
   El breakpoint es xl porque el menú lateral de la app ya
   ocupa 240 px y a 1024 px el formulario quedaría muy angosto.
   Sin lógica propia (R5): solo el estado del pliegue.
   Incluye estados de carga, error y vacío (R9).
   ------------------------------------------------ */

interface TheoryReferenceSidebarProps {
  /** Título del paso actual, para contextualizar las lecturas. */
  stepTitle: string
  references: TheoryReference[]
  isLoading: boolean
  /** Mensaje de error (null si no hay error). */
  error: string | null
  onRetry: () => void
}

const PANEL_ID = 'theory-reference-panel'

export default function TheoryReferenceSidebar({
  stepTitle,
  references,
  isLoading,
  error,
  onRetry,
}: TheoryReferenceSidebarProps) {
  // En pantallas angostas las referencias se pliegan; esto indica si están abiertas.
  const [isOpen, setIsOpen] = useState(false)

  /** Dibuja el contenido según el estado: carga, error, vacío o la lista de referencias. */
  function renderContent() {
    /* ---- Estado de carga ---- */
    if (isLoading) {
      return (
        <div
          className="space-y-3"
          role="status"
          aria-busy="true"
          aria-label="Cargando referencias"
        >
          <div className="h-24 rounded-lg bg-border/50 animate-pulse" />
          <div className="h-24 rounded-lg bg-border/50 animate-pulse" />
        </div>
      )
    }

    /* ---- Estado de error ---- */
    if (error) {
      return (
        <div role="alert" className="space-y-3">
          <p className="text-texto">{error}</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Reintentar
          </Button>
        </div>
      )
    }

    /* ---- Estado vacío ---- */
    if (references.length === 0) {
      return (
        <p className="text-texto/70">
          Por ahora no hay referencias para este paso.
        </p>
      )
    }

    return (
      <ul className="space-y-3">
        {references.map((reference) => (
          <li
            key={reference.id}
            className="rounded-lg border border-border bg-bg p-3 space-y-1"
          >
            <p className="font-heading font-semibold text-texto">
              {reference.title}
            </p>
            <p className="text-sm text-texto/60">
              {reference.author} ({reference.year})
            </p>
            <p className="text-texto/80 leading-relaxed">{reference.excerpt}</p>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <aside
      aria-label="Marco de referencia"
      className="rounded-xl border border-border bg-surface"
    >
      {/* Botón de pliegue: solo en móvil y tablet */}
      <div className="p-2 xl:hidden">
        <Button
          variant="ghost"
          fullWidth
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls={PANEL_ID}
        >
          <span className="flex-1 text-left font-heading font-semibold">
            Marco de referencia
          </span>
          <ChevronDown
            size={20}
            aria-hidden="true"
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </Button>
      </div>

      <div
        id={PANEL_ID}
        className={`
          ${isOpen ? 'block' : 'hidden'} xl:block
          space-y-4 border-t border-border p-4 md:p-5 xl:border-t-0
        `}
      >
        <div className="space-y-1">
          <h2 className="hidden font-heading font-semibold text-lg text-texto xl:block">
            Marco de referencia
          </h2>
          <p className="text-sm text-texto/60">
            Lecturas que te ayudan a analizar este paso: {stepTitle}.
          </p>
        </div>

        {renderContent()}
      </div>
    </aside>
  )
}
