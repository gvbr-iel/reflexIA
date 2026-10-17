import { ArrowUpRight, Lightbulb } from 'lucide-react';

import Button from '../../../components/Button';
import type { InnovationCase } from '../models/innovation';
import { WORKSHOP_TITLES } from '../models/innovation';

interface InnovationCardProps {
  innovation: InnovationCase;
  onOpen: (innovation: InnovationCase) => void;
}

export default function InnovationCard({ innovation, onOpen }: InnovationCardProps) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3 text-sm font-medium text-secondary">
        <span className="inline-flex items-center gap-2">
          <Lightbulb size={18} aria-hidden="true" />
          {WORKSHOP_TITLES[innovation.workshopId]}
        </span>
        <span className="shrink-0 rounded-full bg-accent-ia/10 px-2.5 py-1 font-semibold text-accent-ia">
          Nota {innovation.grade.toFixed(1).replace('.', ',')}
        </span>
      </div>
      <h2 className="font-heading text-lg font-semibold leading-snug text-texto">
        {innovation.title}
      </h2>
      <p className="mt-3 flex-1 text-base leading-relaxed text-texto/75">
        {innovation.summary}
      </p>
      <p className="mt-3 text-sm text-texto/65">{innovation.productType}</p>
      <ul className="mt-4 flex flex-wrap gap-2" aria-label="Etiquetas de innovación">
        {innovation.tags.map((tag) => (
          <li key={tag} className="rounded-full bg-primary/5 px-2.5 py-1 text-sm text-primary">
            {tag}
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="outline"
        className="mt-5 self-start"
        icon={<ArrowUpRight size={17} />}
        onClick={() => onOpen(innovation)}
        aria-label={`Ver trabajo: ${innovation.title}`}
      >
        Ver trabajo
      </Button>
    </article>
  );
}
