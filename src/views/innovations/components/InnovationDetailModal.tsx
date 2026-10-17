import { BookOpenCheck } from 'lucide-react';

import Button from '../../../components/Button';
import Modal from '../../../components/Modal';
import type { InnovationCase } from '../models/innovation';
import { WORKSHOP_TITLES } from '../models/innovation';

interface InnovationDetailModalProps {
  innovation: InnovationCase | null;
  onClose: () => void;
}

export default function InnovationDetailModal({
  innovation,
  onClose,
}: InnovationDetailModalProps) {
  if (!innovation) return null;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={innovation.title}
      size="lg"
      footer={<Button type="button" variant="ghost" onClick={onClose}>Cerrar</Button>}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-secondary">
          <span className="inline-flex items-center gap-2">
            <BookOpenCheck size={18} aria-hidden="true" />
            {WORKSHOP_TITLES[innovation.workshopId]}
          </span>
          <span className={`rounded-full px-3 py-1 ${
            innovation.isExample
              ? 'bg-primary/5 text-primary'
              : 'bg-accent-ia/10 text-accent-ia'
          }`}>
            {innovation.isExample
              ? 'Ejemplo pedagógico'
              : `Nota ${innovation.grade?.toFixed(1).replace('.', ',') ?? '—'}`}
          </span>
        </div>
        <p className="text-base leading-relaxed text-texto/80">{innovation.summary}</p>
        <section>
          <h3 className="font-heading text-base font-semibold text-texto">Tipo de producto</h3>
          <p className="mt-2 text-base text-texto/75">{innovation.productType}</p>
        </section>
        <section>
          <h3 className="font-heading text-base font-semibold text-texto">Trabajo anonimizado</h3>
          <div className="mt-2 whitespace-pre-wrap rounded-lg border border-border bg-bg p-4 text-base leading-relaxed text-texto/80">
            {innovation.work}
          </div>
        </section>
        <section>
          <h3 className="font-heading text-base font-semibold text-texto">Estilo de innovación</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {innovation.tags.map((tag) => (
              <li key={tag} className="rounded-full bg-primary/5 px-3 py-1 text-sm text-primary">
                {tag}
              </li>
            ))}
          </ul>
        </section>
        <p className="border-t border-border pt-4 text-sm leading-relaxed text-texto/60">
          {innovation.isExample
            ? 'Ejemplo ficticio elaborado para mostrar el tipo de producto que podría surgir del taller. No representa una entrega de estudiante, una calificación ni un resultado observado.'
            : 'Trabajo de un taller con nota oficial igual o superior a 6,0, revisado y anonimizado por un docente antes de su publicación.'}
        </p>
      </div>
    </Modal>
  );
}
