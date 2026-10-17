import Modal from '../../../components/Modal';
import {
  WORKSHOP_EVALUATION_TYPES,
  WORKSHOP_SECTIONS,
  type WorkshopId,
  type WorkshopStructureConfiguration,
} from '../../../models/workshopStructure';

interface WorkshopStructurePreviewProps {
  isOpen: boolean;
  workshopId: WorkshopId;
  configuration: WorkshopStructureConfiguration;
  onClose: () => void;
}

const WORKSHOP_TITLES: Record<WorkshopId, string> = {
  'workshop-1': 'Taller 1',
  'workshop-2': 'Taller 2',
  'workshop-3': 'Taller 3',
  'workshop-4': 'Taller 4',
};

export default function WorkshopStructurePreview({
  isOpen,
  workshopId,
  configuration,
  onClose,
}: WorkshopStructurePreviewProps) {
  const format = WORKSHOP_EVALUATION_TYPES.find(
    (item) => item.id === configuration.evaluationType,
  );
  const sections = [...configuration.sections]
    .filter((section) => section.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Vista previa · ${WORKSHOP_TITLES[workshopId]}`} size="lg">
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="rounded-xl bg-primary/5 p-5">
          <p className="text-sm font-medium text-primary">Experiencia reflexiva</p>
          <h3 className="mt-1 font-heading text-2xl font-bold text-texto">
            {WORKSHOP_TITLES[workshopId]}
          </h3>
          <p className="mt-2 text-texto/70">
            Completa las secciones activas siguiendo las orientaciones de tu docente.
          </p>
        </div>

        {sections.length === 0 ? (
          <p className="rounded-lg border border-border bg-bg p-4 text-texto/70">
            Este taller no tiene secciones activas. El docente puede habilitarlas desde la
            configuración.
          </p>
        ) : (
          sections.map((setting) => {
            const section = WORKSHOP_SECTIONS.find((item) => item.id === setting.id);
            if (!section) return null;
            return (
              <section
                key={setting.id}
                className="space-y-3 rounded-xl border border-border bg-surface p-4"
              >
                <div>
                  <h4 className="font-heading text-lg font-semibold text-texto">
                    {section.label}
                  </h4>
                  <p className="text-sm text-texto/70">{section.description}</p>
                </div>
                {setting.id === 'incident-form' ? (
                  <FormPreview configuration={configuration} formatLabel={format?.label ?? ''} />
                ) : setting.id === 'prompt-bank' ? (
                  <ul className="list-inside list-disc space-y-2 text-texto/80">
                    {configuration.formSchema.guidingQuestions.length > 0 ? (
                      configuration.formSchema.guidingQuestions.map((question, index) => (
                        <li key={`${index}-${question}`}>
                          {question || <span className="text-texto/50">Pregunta sin completar</span>}
                        </li>
                      ))
                    ) : (
                      <li className="text-texto/60">No hay preguntas orientadoras configuradas.</li>
                    )}
                  </ul>
                ) : setting.id === 'evaluation-rubric' ? (
                  <p className="rounded-lg bg-bg p-3 text-sm text-texto/70">
                    La pauta y la escala de notas configuradas se mostrarán aquí.
                  </p>
                ) : setting.id === 'peer-feedback' ? (
                  <p className="rounded-lg bg-bg p-3 text-sm text-texto/70">
                    Aquí se habilitará el espacio para recibir aportes de pares.
                  </p>
                ) : (
                  <p className="rounded-lg bg-bg p-3 text-sm text-texto/70">
                    Revisa las orientaciones y referencias asociadas a este taller.
                  </p>
                )}
              </section>
            );
          })
        )}
        <p className="text-xs text-texto/60">
          Previsualización del diseño configurado; no envía respuestas ni guarda cambios.
        </p>
      </div>
    </Modal>
  );
}

function FormPreview({
  configuration,
  formatLabel,
}: {
  configuration: WorkshopStructureConfiguration;
  formatLabel: string;
}) {
  const schema = configuration.formSchema;
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-primary">{formatLabel}</p>
      {configuration.evaluationType === 'text' && (
        <div className="space-y-3">
          {schema.guidingQuestions.map((question, index) => (
            <label key={`${index}-${question}`} className="block space-y-1">
              <span className="text-sm font-medium text-texto">
                {question || `Pregunta ${index + 1}`}
              </span>
              <textarea
                disabled
                rows={3}
                aria-label={question || `Pregunta ${index + 1}`}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-base"
              />
            </label>
          ))}
        </div>
      )}
      {configuration.evaluationType === 'multiple-choice' && (
        <div className="space-y-4">
          {schema.questions.length === 0 && (
            <p className="text-sm text-texto/70">Aún no hay preguntas en este cuestionario.</p>
          )}
          {schema.questions.map((question, index) => (
            <fieldset key={question.id} className="space-y-2">
              <legend className="font-medium text-texto">
                {question.prompt || `Pregunta ${index + 1}`}
              </legend>
              {question.options.map((option, optionIndex) => (
                <label key={`${question.id}-${optionIndex}`} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`preview-${question.id}`}
                    disabled
                    className="h-5 w-5 text-primary"
                  />
                  <span className="text-texto/80">{option || `Alternativa ${optionIndex + 1}`}</span>
                </label>
              ))}
            </fieldset>
          ))}
        </div>
      )}
    </div>
  );
}
