import { Plus, Trash2 } from 'lucide-react';

import Button from '../../../components/Button';
import {
  WORKSHOP_EVALUATION_TYPES,
  type WorkshopChoiceQuestion,
  type WorkshopEvaluationType,
  type WorkshopFormSchema,
} from '../../../models/workshopStructure';

interface FormSchemaEditorProps {
  evaluationType: WorkshopEvaluationType;
  formSchema: WorkshopFormSchema;
  disabled: boolean;
  onEvaluationTypeChange: (type: WorkshopEvaluationType) => void;
  onGuidingQuestionChange: (index: number, value: string) => void;
  onAddGuidingQuestion: () => void;
  onRemoveGuidingQuestion: (index: number) => void;
  onMatrixRowChange: (index: number, value: string) => void;
  onAddMatrixRow: () => void;
  onRemoveMatrixRow: (index: number) => void;
  onQuestionChange: (
    questionId: string,
    updater: (question: WorkshopChoiceQuestion) => WorkshopChoiceQuestion,
  ) => void;
  onAddQuestion: () => void;
  onRemoveQuestion: (questionId: string) => void;
}

const inputClassName =
  'min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 text-base text-texto focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30';

function EditableList({
  label,
  items,
  placeholder,
  disabled,
  onChange,
  onAdd,
  onRemove,
}: {
  label: string;
  items: string[];
  placeholder: string;
  disabled: boolean;
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={`${label}-${index}`} className="flex items-start gap-2">
            <label className="sr-only" htmlFor={`${label}-${index}`}>
              {label} {index + 1}
            </label>
            <input
              id={`${label}-${index}`}
              className={inputClassName}
              value={item}
              maxLength={500}
              disabled={disabled}
              placeholder={placeholder}
              onChange={(event) => onChange(index, event.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              aria-label={`Eliminar ${label.toLowerCase()} ${index + 1}`}
              disabled={disabled}
              onClick={() => onRemove(index)}
            >
              <Trash2 size={16} aria-hidden="true" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        icon={<Plus size={16} />}
        disabled={disabled || items.length >= 30}
        onClick={onAdd}
      >
        Agregar {label.toLowerCase()}
      </Button>
    </div>
  );
}

export default function FormSchemaEditor({
  evaluationType,
  formSchema,
  disabled,
  onEvaluationTypeChange,
  onGuidingQuestionChange,
  onAddGuidingQuestion,
  onRemoveGuidingQuestion,
  onMatrixRowChange,
  onAddMatrixRow,
  onRemoveMatrixRow,
  onQuestionChange,
  onAddQuestion,
  onRemoveQuestion,
}: FormSchemaEditorProps) {
  return (
    <section className="space-y-5" aria-labelledby="workshop-format-title">
      <div>
        <h2 id="workshop-format-title" className="font-heading text-lg font-semibold text-texto">
          Formato de entrada
        </h2>
        <p className="text-sm text-texto/70">
          Elige el mecanismo de trabajo y personaliza sus preguntas orientadoras.
        </p>
      </div>

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="sr-only">Tipo de formato o mecanismo de evaluación</legend>
        {WORKSHOP_EVALUATION_TYPES.map((format) => (
          <label
            key={format.id}
            className={`cursor-pointer rounded-xl border p-4 transition-colors ${
              evaluationType === format.id
                ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                : 'border-border bg-surface hover:bg-bg'
            }`}
          >
            <span className="flex items-start gap-3">
              <input
                type="radio"
                name="workshop-format"
                value={format.id}
                checked={evaluationType === format.id}
                disabled={disabled}
                onChange={() => onEvaluationTypeChange(format.id)}
                className="mt-1 h-5 w-5 text-primary focus:ring-primary"
              />
              <span>
                <span className="block font-medium text-texto">{format.label}</span>
                <span className="mt-1 block text-sm text-texto/70">{format.description}</span>
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      {evaluationType === 'text' && (
        <EditableList
          label="Pregunta orientadora"
          items={formSchema.guidingQuestions}
          placeholder="Escribe una pregunta para orientar el relato"
          disabled={disabled}
          onChange={onGuidingQuestionChange}
          onAdd={onAddGuidingQuestion}
          onRemove={onRemoveGuidingQuestion}
        />
      )}

      {evaluationType === 'file' && (
        <div className="space-y-3">
          <p className="text-sm text-texto/70">
            Define las instrucciones que acompañarán la carga de archivo o diagrama.
          </p>
          <EditableList
            label="Instrucción"
            items={formSchema.guidingQuestions}
            placeholder="Ej.: Adjunta un mapa conceptual anonimizado"
            disabled={disabled}
            onChange={onGuidingQuestionChange}
            onAdd={onAddGuidingQuestion}
            onRemove={onRemoveGuidingQuestion}
          />
        </div>
      )}

      {evaluationType === 'matrix' && (
        <EditableList
          label="Fila de la matriz"
          items={formSchema.matrixRows}
          placeholder="Escribe una fila o dimensión de análisis"
          disabled={disabled}
          onChange={onMatrixRowChange}
          onAdd={onAddMatrixRow}
          onRemove={onRemoveMatrixRow}
        />
      )}

      {evaluationType === 'multiple-choice' && (
        <div className="space-y-4">
          {formSchema.questions.map((question, questionIndex) => (
            <QuestionEditor
              key={question.id}
              question={question}
              questionNumber={questionIndex + 1}
              disabled={disabled}
              onChange={(updater) => onQuestionChange(question.id, updater)}
              onRemove={() => onRemoveQuestion(question.id)}
            />
          ))}
          {formSchema.questions.length === 0 && (
            <p className="rounded-lg bg-bg p-4 text-sm text-texto/70">
              Aún no hay preguntas. Agrega una para definir sus alternativas y respuesta correcta.
            </p>
          )}
          <Button
            variant="outline"
            icon={<Plus size={16} />}
            disabled={disabled || formSchema.questions.length >= 30}
            onClick={onAddQuestion}
          >
            Agregar pregunta
          </Button>
        </div>
      )}
    </section>
  );
}

function QuestionEditor({
  question,
  questionNumber,
  disabled,
  onChange,
  onRemove,
}: {
  question: WorkshopChoiceQuestion;
  questionNumber: number;
  disabled: boolean;
  onChange: (updater: (question: WorkshopChoiceQuestion) => WorkshopChoiceQuestion) => void;
  onRemove: () => void;
}) {
  const promptId = `question-prompt-${question.id}`;
  const inputClassName =
    'min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 text-base text-texto focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30';

  return (
    <fieldset className="space-y-4 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <legend className="font-heading font-semibold text-texto">Pregunta {questionNumber}</legend>
        <Button
          variant="outline"
          size="sm"
          icon={<Trash2 size={16} />}
          disabled={disabled}
          onClick={onRemove}
        >
          Eliminar pregunta
        </Button>
      </div>
      <div className="space-y-2">
        <label htmlFor={promptId} className="block text-sm font-medium text-texto">
          Enunciado
        </label>
        <textarea
          id={promptId}
          className={inputClassName}
          rows={2}
          maxLength={500}
          value={question.prompt}
          disabled={disabled}
          onChange={(event) =>
            onChange((current) => ({ ...current, prompt: event.target.value }))
          }
        />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-texto">
          Alternativas <span className="font-normal text-texto/70">(marca la correcta)</span>
        </p>
        {question.options.map((option, optionIndex) => {
          const optionId = `question-option-${question.id}-${optionIndex}`;
          return (
            <div key={optionId} className="flex items-center gap-2">
              <input
                id={`correct-${optionId}`}
                type="radio"
                name={`correct-${question.id}`}
                checked={question.correctOptionIndex === optionIndex}
                disabled={disabled}
                onChange={() =>
                  onChange((current) => ({ ...current, correctOptionIndex: optionIndex }))
                }
                className="h-5 w-5 shrink-0 text-primary focus:ring-primary"
              />
              <label className="sr-only" htmlFor={`correct-${optionId}`}>
                Marcar alternativa {optionIndex + 1} como correcta
              </label>
              <label className="sr-only" htmlFor={optionId}>
                Alternativa {optionIndex + 1}
              </label>
              <input
                id={optionId}
                className={inputClassName}
                value={option}
                maxLength={300}
                disabled={disabled}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    options: current.options.map((item, index) =>
                      index === optionIndex ? event.target.value : item,
                    ),
                  }))
                }
              />
              <Button
                variant="outline"
                size="sm"
                aria-label={`Eliminar alternativa ${optionIndex + 1}`}
                disabled={disabled || question.options.length <= 2}
                onClick={() =>
                  onChange((current) => {
                    const options = current.options.filter((_, index) => index !== optionIndex);
                    const correctOptionIndex =
                      current.correctOptionIndex === optionIndex
                        ? 0
                        : current.correctOptionIndex > optionIndex
                          ? current.correctOptionIndex - 1
                          : current.correctOptionIndex;
                    return { ...current, options, correctOptionIndex };
                  })
                }
              >
                <Trash2 size={16} aria-hidden="true" />
              </Button>
            </div>
          );
        })}
        <Button
          variant="outline"
          size="sm"
          icon={<Plus size={16} />}
          disabled={disabled || question.options.length >= 6}
          onClick={() =>
            onChange((current) => ({
              ...current,
              options: [...current.options, ''],
            }))
          }
        >
          Agregar alternativa
        </Button>
      </div>
    </fieldset>
  );
}
