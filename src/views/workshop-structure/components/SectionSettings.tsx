import { ArrowDown, ArrowUp } from 'lucide-react';

import Button from '../../../components/Button';
import {
  WORKSHOP_SECTIONS,
  type WorkshopSectionSetting,
} from '../../../models/workshopStructure';

interface SectionSettingsProps {
  sections: WorkshopSectionSetting[];
  disabled: boolean;
  onToggle: (sectionId: string, enabled: boolean) => void;
  onMove: (sectionId: string, direction: -1 | 1) => void;
}

export default function SectionSettings({
  sections,
  disabled,
  onToggle,
  onMove,
}: SectionSettingsProps) {
  const orderedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <section className="space-y-3" aria-labelledby="workshop-sections-title">
      <div>
        <h2 id="workshop-sections-title" className="font-heading text-lg font-semibold text-texto">
          Secciones del taller
        </h2>
        <p className="text-sm text-texto/70">
          Activa las secciones que verá el estudiante y ajusta su orden.
        </p>
      </div>

      <ol className="space-y-3">
        {orderedSections.map((setting, index) => {
          const section = WORKSHOP_SECTIONS.find((item) => item.id === setting.id);
          if (!section) return null;
          const toggleId = `section-${setting.id}`;

          return (
            <li
              key={setting.id}
              className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4"
            >
              <span className="pt-1 font-heading text-sm font-semibold text-primary" aria-hidden="true">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-texto">
                  {section.label}
                </p>
                <p className="mt-1 text-sm text-texto/70">{section.description}</p>
                <label htmlFor={toggleId} className="mt-3 inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm text-texto">
                  <input
                    id={toggleId}
                    type="checkbox"
                    checked={setting.enabled}
                    disabled={disabled}
                    onChange={(event) => onToggle(setting.id, event.target.checked)}
                    aria-label={`${section.label}: ${
                      setting.enabled ? 'sección visible para estudiantes' : 'sección desactivada'
                    }`}
                    className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                  />
                  {setting.enabled ? 'Sección visible para estudiantes' : 'Sección desactivada'}
                </label>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={`Mover ${section.label} hacia arriba`}
                  title="Mover arriba"
                  disabled={disabled || index === 0}
                  onClick={() => onMove(setting.id, -1)}
                >
                  <ArrowUp size={16} aria-hidden="true" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={`Mover ${section.label} hacia abajo`}
                  title="Mover abajo"
                  disabled={disabled || index === orderedSections.length - 1}
                  onClick={() => onMove(setting.id, 1)}
                >
                  <ArrowDown size={16} aria-hidden="true" />
                </Button>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
