import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import Button from '../../../components/Button';
import {
  WORKSHOP_EVALUATION_TYPES,
  type ImportedWorkshopQuestion,
  type WorkshopChoiceQuestion,
  type WorkshopEvaluationType,
  type WorkshopFormSchema,
} from '../../../models/workshopStructure';
import { parseQuestionsCsv } from '../utils/parseQuestionsCsv';

interface FormSchemaEditorProps {
  evaluationType: WorkshopEvaluationType;
  formSchema: WorkshopFormSchema;
  disabled: boolean;
  onEvaluationTypeChange: (type: WorkshopEvaluationType) => void;
  onGuidingQuestionChange: (index: number, value: string) => void;
  onAddGuidingQuestion: () => void;
  onRemoveGuidingQuestion: (index: number) => void;
  onQuestionChange: (
    questionId: string,
    updater: (question: WorkshopChoiceQuestion) => WorkshopChoiceQuestion,
  ) => void;
  onAddQuestion: () => void;
  onAddOpenEndedQuestion: () => void;
  onImportQuestions: (questions: ImportedWorkshopQuestion[]) => void;
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
  onQuestionChange,
  onAddQuestion,
  onAddOpenEndedQuestion,
  onImportQuestions,
  onRemoveQuestion,
}: FormSchemaEditorProps) {
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleCsvImport = async (file: File) => {
    setImportMessage(null);
    setImportError(null);
    try {
      if (file.size > 1_000_000) {
        throw new Error('El CSV supera el límite de 1 MB.');
      }
      const questions = parseQuestionsCsv(await file.text());
      onImportQuestions(questions);
      setImportMessage(`Se agregaron ${questions.length} preguntas de alternativas.`);
    } catch (cause) {
      setImportError(
        cause instanceof Error
          ? cause.message
          : 'No se pudo importar el CSV. Revisa el archivo e inténtalo nuevamente.',
      );
    }
  };

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
              Aún no hay preguntas. Agrega una pregunta de alternativas o una de respuesta abierta.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              icon={<Plus size={16} />}
              disabled={disabled || formSchema.questions.length >= 30}
              onClick={onAddQuestion}
            >
              Agregar pregunta de alternativas
            </Button>
            <Button
              variant="outline"
              icon={<Plus size={16} />}
              disabled={disabled || formSchema.questions.length >= 30}
              onClick={onAddOpenEndedQuestion}
            >
              Agregar pregunta abierta
            </Button>
          </div>
          <fieldset className="space-y-3 rounded-xl border border-border bg-surface p-4">
            <legend className="px-1 font-heading font-semibold text-texto">
              Importar preguntas de alternativas desde CSV
            </legend>
            <p className="text-sm text-texto/70">
              El archivo debe incluir las columnas pregunta, alternativa1, alternativa2 y
              respuestaCorrecta; puedes agregar alternativa3 hasta alternativa6. La respuesta
              correcta debe coincidir exactamente con el texto de una alternativa. Las preguntas
              importadas se agregan al final y son solo de alternativas.
            </p>
            <label className="block text-sm font-medium text-texto">
              Archivo CSV
              <input
                type="file"
                accept=".csv,text/csv"
                disabled={disabled || formSchema.questions.length >= 30}
                className="mt-2 block min-h-11 w-full rounded-lg border border-border bg-surface p-2 text-base"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleCsvImport(file);
                  event.target.value = '';
                }}
              />
            </label>
            {importMessage && <p role="status" className="text-sm text-texto">{importMessage}</p>}
            {importError && <p role="alert" className="text-sm text-texto">{importError}</p>}
          </fieldset>
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
        <label htmlFor={`question-type-${question.id}`} className="block text-sm font-medium text-texto">
          Tipo de respuesta
        </label>
        <select
          id={`question-type-${question.id}`}
          className={inputClassName}
          value={question.type}
          disabled={disabled}
          onChange={(event) =>
            onChange((current) =>
              event.target.value === 'open-ended'
                ? { id: current.id, prompt: current.prompt, type: 'open-ended' }
                : {
                    id: current.id,
                    prompt: current.prompt,
                    type: 'multiple-choice',
                    options: ['', ''],
                    correctOptionIndex: 0,
                  },
            )
          }
        >
          <option value="multiple-choice">Alternativas</option>
          <option value="open-ended">Respuesta abierta</option>
        </select>
      </div>
      {question.type === 'open-ended' ? (
        <p className="rounded-lg bg-bg p-3 text-sm text-texto/70">
          El estudiante responderá en texto libre. Esta pregunta no tiene alternativas ni respuesta
          correcta predefinida.
        </p>
      ) : (
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
                    onChange((current) =>
                      current.type === 'multiple-choice'
                        ? { ...current, correctOptionIndex: optionIndex }
                        : current,
                    )
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
                    onChange((current) =>
                      current.type === 'multiple-choice'
                        ? {
                            ...current,
                            options: current.options.map((item, index) =>
                              index === optionIndex ? event.target.value : item,
                            ),
                          }
                        : current,
                    )
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={`Eliminar alternativa ${optionIndex + 1}`}
                  disabled={disabled || question.options.length <= 2}
                  onClick={() =>
                    onChange((current) => {
                      if (current.type !== 'multiple-choice') return current;
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
              onChange((current) =>
                current.type === 'multiple-choice'
                  ? { ...current, options: [...current.options, ''] }
                  : current,
              )
            }
          >
            Agregar alternativa
          </Button>
        </div>
      )}
    </fieldset>
  );
}
