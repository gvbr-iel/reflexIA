import { ArrowUpRight, Lightbulb } from 'lucide-react'
import Button from '../../../components/Button'
import type { InnovationCase } from '../models/innovation'

interface InnovationCardProps {
  innovation: InnovationCase
  onOpen: (innovation: InnovationCase) => void
}

export default function InnovationCard({ innovation, onOpen }: InnovationCardProps) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-secondary">
        <Lightbulb size={18} aria-hidden="true" />
        <span>{innovation.category}</span>
      </div>

      <h2 className="font-heading text-lg font-semibold leading-snug text-texto">
        {innovation.title}
      </h2>
      <p className="mt-3 flex-1 text-base leading-relaxed text-texto/75">
        {innovation.summary}
      </p>

      <ul className="mt-4 flex flex-wrap gap-2" aria-label="Temas del caso">
        {innovation.tags.map((tag) => (
          <li
            key={tag}
            className="rounded-full bg-primary/5 px-2.5 py-1 text-sm text-primary"
          >
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
        aria-label={`Ver detalle: ${innovation.title}`}
      >
        Ver caso
      </Button>
    </article>
  )
}
