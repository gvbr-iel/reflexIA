import { BookOpenCheck } from 'lucide-react'
import Button from '../../../components/Button'
import Modal from '../../../components/Modal'
import type { InnovationCase } from '../models/innovation'

/* ------------------------------------------------
   InnovationDetailModal — HU-07
   Ventana con el caso completo: contexto, desafío,
   actuación mejorada, pasos para adaptarla y
   resultados esperados. Usa el Modal global.
   ------------------------------------------------ */

interface InnovationDetailModalProps {
  /** Caso a mostrar. Con null la ventana no se dibuja. */
  innovation: InnovationCase | null
  onClose: () => void
}

export default function InnovationDetailModal({
  innovation,
  onClose,
}: InnovationDetailModalProps) {
  // Sin caso elegido no hay nada que mostrar.
  if (!innovation) return null

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={innovation.title}
      size="lg"
      footer={
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
        >
          Cerrar
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-secondary">
          <BookOpenCheck size={18} aria-hidden="true" />
          <span>{innovation.category}</span>
        </div>

        <p className="text-base leading-relaxed text-texto/80">{innovation.summary}</p>

        <section>
          <h3 className="font-heading text-base font-semibold text-texto">
            Contexto sugerido
          </h3>
          <p className="mt-2 text-base leading-relaxed text-texto/75">{innovation.context}</p>
        </section>

        <section>
          <h3 className="font-heading text-base font-semibold text-texto">
            Desafío pedagógico
          </h3>
          <p className="mt-2 text-base leading-relaxed text-texto/75">
            {innovation.challenge}
          </p>
        </section>

        <section>
          <h3 className="font-heading text-base font-semibold text-texto">
            Actuación mejorada
          </h3>
          <p className="mt-2 text-base leading-relaxed text-texto/75">{innovation.action}</p>
        </section>

        <section>
          <h3 className="font-heading text-base font-semibold text-texto">
            Claves para adaptarla
          </h3>
          <ol className="mt-2 list-inside list-decimal space-y-2 text-base leading-relaxed text-texto/75">
            {innovation.implementation.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="rounded-lg border-l-4 border-accent-ia bg-accent-ia/5 p-4">
          <h3 className="font-heading text-base font-semibold text-texto">
            Resultados esperados
          </h3>
          <p className="mt-2 text-base leading-relaxed text-texto/75">
            {innovation.expectedImpact}
          </p>
        </section>

        <p className="border-t border-border pt-4 text-sm leading-relaxed text-texto/60">
          Ejemplo ilustrativo para orientar la reflexión; no corresponde a un caso real
          verificado ni a resultados medidos.
        </p>
      </div>
    </Modal>
  )
}
