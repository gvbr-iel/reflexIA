/**
 * @component ScoreCard
 *
 * Pantalla de resultados tras completar un intento del cuestionario.
 *
 * Muestra: puntaje con indicador visual circular, estado de
 * aprobación/reprobación, detalle por pregunta con explicación,
 * intentos restantes y acciones (reintentar o continuar a talleres).
 *
 * No tiene estado propio (R5): recibe todo desde useTheoryQuiz.
 * Usa solo tokens de color y tipografía (R3).
 * Textos de interfaz en español (R10).
 */

import type { QuizAttempt, TheoryApprovalStatus, QuizConfig } from '../../../models/theoryQuiz';

interface ScoreCardProps {
  /** Último intento completado. */
  attempt: QuizAttempt;
  /** Estado de aprobación del estudiante. */
  approval: TheoryApprovalStatus;
  /** Configuración del cuestionario. */
  config: QuizConfig;
  /** Callback para volver a la intro y reintentar. */
  onRetry: () => void;
}

export default function ScoreCard({
  attempt,
  approval,
  config,
  onRetry,
}: ScoreCardProps) {
  const { score, totalQuestions, answers, questions, status } = attempt;
  const percentage = Math.round((score / totalQuestions) * 100);
  const passed = score >= config.passingScore;
  const hasAttemptsRemaining = approval.result
    ? approval.result.hasAttemptsRemaining
    : false;
  const attemptsUsed = approval.result?.attemptsUsed ?? attempt.attemptNumber;
  const timedOut = status === 'timed-out';

  // Colores según resultado (tokens de AI_GUIDELINES §4)
  const resultColor = passed ? 'var(--perf-excellent)' : 'var(--perf-fail)';
  const resultBgColor = passed
    ? 'color-mix(in srgb, var(--perf-excellent) 8%, var(--color-surface))'
    : 'color-mix(in srgb, var(--perf-fail) 8%, var(--color-surface))';

  // Ángulo para el indicador circular SVG
  const circumference = 2 * Math.PI * 54; // radio = 54
  const strokeOffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
      maxWidth: '48rem',
      margin: '0 auto',
      padding: '1.5rem 1rem',
    }}>
      {/* Tarjeta principal de resultado */}
      <div style={{
        backgroundColor: resultBgColor,
        borderRadius: '1rem',
        border: `1px solid ${resultColor}`,
        padding: '2rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
      }}>
        {/* Indicador circular de puntaje */}
        <div style={{ position: 'relative', width: '8rem', height: '8rem' }}>
          <svg
            viewBox="0 0 120 120"
            style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}
            aria-hidden="true"
          >
            {/* Fondo del círculo */}
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="8"
            />
            {/* Progreso */}
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={resultColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
            />
          </svg>
          {/* Texto del porcentaje */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-2xl)',
              fontWeight: 700,
              color: resultColor,
            }}>
              {percentage}%
            </span>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text)',
              opacity: 0.7,
            }}>
              {score}/{totalQuestions}
            </span>
          </div>
        </div>

        {/* Estado y mensaje */}
        <div>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--text-xl)',
            fontWeight: 700,
            color: resultColor,
            marginBottom: '0.5rem',
          }}>
            {passed
              ? '¡Evaluación aprobada!'
              : timedOut
                ? 'Tiempo agotado'
                : 'Evaluación no aprobada'}
          </h2>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-base)',
            color: 'var(--color-text)',
            lineHeight: 1.6,
            maxWidth: '28rem',
            margin: '0 auto',
          }}>
            {passed
              ? 'Has demostrado dominio del marco teórico. Los talleres prácticos están desbloqueados.'
              : timedOut
                ? `El tiempo se agotó antes de completar todas las respuestas. Obtuviste ${score} de ${totalQuestions} (se requieren ${config.passingScore}).`
                : `Necesitas al menos ${config.passingScore} respuestas correctas de ${totalQuestions} para aprobar. Obtuviste ${score}.`}
          </p>
        </div>

        {/* Información de intentos */}
        <div style={{
          display: 'flex',
          gap: '1.5rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          <div style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text)',
            }}>
              Intento {attemptsUsed} de {config.maxAttempts}
            </span>
          </div>
          <div style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text)',
            }}>
              Mínimo para aprobar: {config.passingScore}/{totalQuestions}
            </span>
          </div>
        </div>

        {/* Botones de acción */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginTop: '0.5rem',
        }}>
          {passed ? (
            <button
              style={{
                padding: '0.875rem 2rem',
                borderRadius: '0.75rem',
                border: 'none',
                backgroundColor: 'var(--color-accent-ia)',
                color: '#FFFFFF',
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-base)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Continuar a los talleres →
            </button>
          ) : hasAttemptsRemaining ? (
            <button
              onClick={onRetry}
              style={{
                padding: '0.875rem 2rem',
                borderRadius: '0.75rem',
                border: 'none',
                backgroundColor: 'var(--color-primary)',
                color: '#FFFFFF',
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-base)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Reintentar evaluación ({config.maxAttempts - attemptsUsed} restante{config.maxAttempts - attemptsUsed !== 1 ? 's' : ''})
            </button>
          ) : (
            <div style={{
              padding: '1rem 1.5rem',
              borderRadius: '0.75rem',
              backgroundColor: 'color-mix(in srgb, var(--perf-fail) 8%, var(--color-surface))',
              border: '1px solid var(--perf-fail)',
            }}>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text)',
                textAlign: 'center',
                lineHeight: 1.6,
              }}>
                Has agotado tus {config.maxAttempts} intentos. Contacta a tu profesor guía para recibir orientación.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detalle por pregunta */}
      <div>
        <h3 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-lg)',
          fontWeight: 600,
          color: 'var(--color-text)',
          marginBottom: '1rem',
        }}>
          Revisión de respuestas
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {questions.map((question, index) => {
            const answer = answers.find((a) => a.questionId === question.id);
            const isCorrect = answer?.isCorrect ?? false;
            const selectedOption = question.options.find(
              (o) => o.id === answer?.selectedOptionId,
            );
            const correctOption = question.options.find(
              (o) => o.id === question.correctOptionId,
            );
            const wasNotAnswered = !answer || answer.selectedOptionId === '';

            return (
              <details
                key={question.id}
                style={{
                  borderRadius: '0.75rem',
                  border: `1px solid ${isCorrect ? 'var(--perf-excellent)' : wasNotAnswered ? 'var(--color-border)' : 'var(--perf-fail)'}`,
                  overflow: 'hidden',
                }}
              >
                <summary
                  style={{
                    padding: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    backgroundColor: isCorrect
                      ? 'color-mix(in srgb, var(--perf-excellent) 5%, var(--color-surface))'
                      : wasNotAnswered
                        ? 'var(--color-surface)'
                        : 'color-mix(in srgb, var(--perf-fail) 5%, var(--color-surface))',
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text)',
                  }}
                >
                  {/* Ícono de estado */}
                  <span
                    style={{
                      width: '1.5rem',
                      height: '1.5rem',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      backgroundColor: isCorrect
                        ? 'var(--perf-excellent)'
                        : wasNotAnswered
                          ? 'var(--perf-none)'
                          : 'var(--perf-fail)',
                    }}
                    aria-hidden="true"
                  >
                    {isCorrect ? '✓' : wasNotAnswered ? '–' : '✗'}
                  </span>
                  <span style={{ flex: 1 }}>
                    <strong>Pregunta {index + 1}:</strong> {question.statement.slice(0, 80)}
                    {question.statement.length > 80 ? '…' : ''}
                  </span>
                </summary>

                <div style={{
                  padding: '1rem 1rem 1rem 3.25rem',
                  backgroundColor: 'var(--color-surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text)',
                  lineHeight: 1.6,
                }}>
                  {wasNotAnswered ? (
                    <p style={{ fontStyle: 'italic', opacity: 0.7 }}>
                      No respondida.
                    </p>
                  ) : (
                    <p>
                      <strong>Tu respuesta:</strong> {selectedOption?.label ?? '—'}
                    </p>
                  )}
                  {!isCorrect && (
                    <p style={{ color: 'var(--perf-excellent)' }}>
                      <strong>Respuesta correcta:</strong> {correctOption?.label ?? '—'}
                    </p>
                  )}
                  <p style={{
                    marginTop: '0.25rem',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    backgroundColor: 'var(--color-bg)',
                    borderLeft: '3px solid var(--color-accent-ia)',
                  }}>
                    {question.explanation}
                  </p>
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </div>
  );
}
