/**
 * @component QuizEngine
 *
 * Motor interactivo del cuestionario del marco teórico.
 *
 * Renderiza la pregunta actual con sus opciones, barra de progreso,
 * temporizador (QuizTimer) y controles de navegación.
 *
 * No tiene estado propio (R5): recibe todo desde useTheoryQuiz.
 * Usa solo tokens de color y tipografía (R3).
 * Textos de interfaz en español (R10).
 */

import type { QuizQuestion } from '../../../models/theoryQuiz';
import type { AnswerMap } from '../hooks/useTheoryQuiz';
import QuizTimer from './QuizTimer';

interface QuizEngineProps {
  /** Preguntas del intento actual. */
  questions: QuizQuestion[];
  /** Índice de la pregunta actual (0-based). */
  currentIndex: number;
  /** Mapa de respuestas seleccionadas. */
  answers: AnswerMap;
  /** Segundos restantes del temporizador. */
  timeRemaining: number;
  /** Duración total en segundos. */
  timeLimitSeconds: number;
  /** Número del intento actual (1-based, para mostrar en UI). */
  attemptNumber: number;
  /** Máximo de intentos permitidos. */
  maxAttempts: number;
  /** Si se está enviando el cuestionario. */
  isSubmitting: boolean;
  /** Callback al seleccionar una opción. */
  onSelectAnswer: (questionId: string, optionId: string) => void;
  /** Callback para ir a la siguiente pregunta. */
  onNext: () => void;
  /** Callback para ir a la pregunta anterior. */
  onPrevious: () => void;
  /** Callback para saltar a una pregunta por índice. */
  onGoToQuestion: (index: number) => void;
  /** Callback para enviar el cuestionario. */
  onSubmit: () => void;
}

export default function QuizEngine({
  questions,
  currentIndex,
  answers,
  timeRemaining,
  timeLimitSeconds,
  attemptNumber,
  maxAttempts,
  isSubmitting,
  onSelectAnswer,
  onNext,
  onPrevious,
  onGoToQuestion,
  onSubmit,
}: QuizEngineProps) {
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === totalQuestions;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  if (!currentQuestion) return null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      maxWidth: '48rem',
      margin: '0 auto',
      padding: '1.5rem 1rem',
    }}>
      {/* Encabezado: intento + timer */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text)',
            opacity: 0.7,
          }}>
            Intento {attemptNumber} de {maxAttempts}
          </span>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text)',
            opacity: 0.7,
          }}>
            {answeredCount} de {totalQuestions} respondidas
          </span>
        </div>

        <QuizTimer
          timeRemaining={timeRemaining}
          timeLimitSeconds={timeLimitSeconds}
        />
      </div>

      {/* Navegación rápida por números de pregunta */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
        role="navigation"
        aria-label="Navegación de preguntas"
      >
        {questions.map((q, index) => {
          const isAnswered = q.id in answers;
          const isCurrent = index === currentIndex;

          return (
            <button
              key={q.id}
              onClick={() => onGoToQuestion(index)}
              aria-label={`Pregunta ${index + 1}${isAnswered ? ' (respondida)' : ''}${isCurrent ? ' (actual)' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
              style={{
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '0.5rem',
                border: isCurrent
                  ? '2px solid var(--color-primary)'
                  : '1px solid var(--color-border)',
                backgroundColor: isCurrent
                  ? 'var(--color-primary)'
                  : isAnswered
                    ? 'var(--color-secondary)'
                    : 'var(--color-surface)',
                color: isCurrent || isAnswered ? '#FFFFFF' : 'var(--color-text)',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      {/* Tarjeta de la pregunta actual */}
      <div style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: '1rem',
        border: '1px solid var(--color-border)',
        padding: '2rem 1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        {/* Número y enunciado */}
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-primary)',
          fontWeight: 600,
          marginBottom: '0.5rem',
        }}>
          Pregunta {currentIndex + 1} de {totalQuestions}
        </p>
        <h2
          id={`question-${currentQuestion.id}`}
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--text-lg)',
            fontWeight: 600,
            color: 'var(--color-text)',
            lineHeight: 1.5,
            marginBottom: '1.5rem',
          }}
        >
          {currentQuestion.statement}
        </h2>

        {/* Opciones */}
        <fieldset
          style={{ border: 'none', margin: 0, padding: 0 }}
          aria-labelledby={`question-${currentQuestion.id}`}
        >
          <legend className="sr-only">Opciones de respuesta</legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {currentQuestion.options.map((option) => {
              const isSelected = currentAnswer === option.id;

              return (
                <label
                  key={option.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: isSelected
                      ? '2px solid var(--color-primary)'
                      : '1px solid var(--color-border)',
                    backgroundColor: isSelected
                      ? 'color-mix(in srgb, var(--color-primary) 5%, var(--color-surface))'
                      : 'var(--color-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--color-secondary)';
                      e.currentTarget.style.backgroundColor =
                        'color-mix(in srgb, var(--color-secondary) 5%, var(--color-surface))';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                    }
                  }}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option.id}
                    checked={isSelected}
                    onChange={() => onSelectAnswer(currentQuestion.id, option.id)}
                    style={{
                      marginTop: '0.25rem',
                      accentColor: 'var(--color-primary)',
                      width: '1.125rem',
                      height: '1.125rem',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-base)',
                    color: 'var(--color-text)',
                    lineHeight: 1.6,
                  }}>
                    {option.label}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>

      {/* Controles de navegación */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <button
          onClick={onPrevious}
          disabled={isFirstQuestion}
          aria-label="Pregunta anterior"
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.75rem',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: isFirstQuestion ? 'var(--color-border)' : 'var(--color-text)',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            cursor: isFirstQuestion ? 'not-allowed' : 'pointer',
            opacity: isFirstQuestion ? 0.5 : 1,
            transition: 'all 0.2s ease',
          }}
        >
          ← Anterior
        </button>

        {isLastQuestion ? (
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '0.75rem',
              border: 'none',
              backgroundColor: allAnswered
                ? 'var(--color-accent-ia)'
                : 'var(--color-primary)',
              color: '#FFFFFF',
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {isSubmitting
              ? 'Enviando...'
              : allAnswered
                ? 'Finalizar evaluación'
                : `Finalizar (${answeredCount}/${totalQuestions} respondidas)`}
          </button>
        ) : (
          <button
            onClick={onNext}
            aria-label="Siguiente pregunta"
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.75rem',
              border: 'none',
              backgroundColor: 'var(--color-primary)',
              color: '#FFFFFF',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Siguiente →
          </button>
        )}
      </div>
    </div>
  );
}
