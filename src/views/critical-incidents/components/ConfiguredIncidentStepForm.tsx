import type {
  WorkshopEvaluationType,
  WorkshopStudentConfiguration,
} from '../../../models/workshopStructure';
import type { WorkshopFormStep } from '../../../models/criticalIncident';
import IncidentStepForm from './IncidentStepForm';

interface ConfiguredIncidentStepFormProps {
  evaluationType: WorkshopEvaluationType;
  configuration: WorkshopStudentConfiguration;
  step: WorkshopFormStep;
  totalSteps: number;
  value: string;
  onChange: (value: string) => void;
  error: string | null;
}

export default function ConfiguredIncidentStepForm({
  evaluationType,
  configuration,
  step,
  totalSteps,
  value,
  onChange,
  error,
}: ConfiguredIncidentStepFormProps) {
  if (evaluationType === 'multiple-choice') {
    const questionId = step.id.startsWith('choice-') ? step.id.slice('choice-'.length) : '';
    const question = configuration.formSchema.questions.find((item) => item.id === questionId);

    if (!question) {
      return (
        <p role="status" className="rounded-xl border border-border bg-surface p-5 text-texto/70">
          No hay preguntas de alternativas configuradas para este taller.
        </p>
      );
    }

    return (
      <fieldset className="space-y-4 rounded-xl border border-border bg-surface p-4 md:p-6">
        <legend className="font-heading text-lg font-semibold text-texto">
          Pregunta {step.order} de {totalSteps}
        </legend>
        <p className="font-medium leading-relaxed text-texto">{question.prompt}</p>
        <div className="space-y-2">
          {question.options.map((option, index) => {
            const optionId = `student-${question.id}-${index}`;
            return (
              <label
                key={optionId}
                htmlFor={optionId}
                className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-bg"
              >
                <input
                  id={optionId}
                  type="radio"
                  name={`student-answer-${question.id}`}
                  value={index}
                  checked={value === String(index)}
                  onChange={() => onChange(String(index))}
                  className="h-5 w-5 shrink-0 text-primary focus:ring-primary"
                />
                <span className="text-texto">{option}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }

  return (
    <IncidentStepForm
      step={step}
      totalSteps={totalSteps}
      value={value}
      onChange={onChange}
      error={error}
    />
  );
}
