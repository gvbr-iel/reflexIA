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

import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Minus, RotateCcw, X } from 'lucide-react'
import Button from '../../../components/Button'
import type { QuizAttempt, TheoryApprovalStatus, QuizConfig } from '../../../models/theoryQuiz'

interface ScoreCardProps {
  /** Último intento completado. */
  attempt: QuizAttempt
  /** Estado de aprobación del estudiante. */
  approval: TheoryApprovalStatus
  /** Configuración del cuestionario. */
  config: QuizConfig
  /** Callback para volver a la intro y reintentar. */
  onRetry: () => void
}

export default function ScoreCard({
  attempt,
  approval,
  config,
  onRetry,
}: ScoreCardProps) {
  const navigate = useNavigate()
  const { score, totalQuestions, answers, questions, status } = attempt
  const percentage = Math.round((score / totalQuestions) * 100)
  const passed = score >= config.passingScore
  const hasAttemptsRemaining = approval.result
    ? approval.result.hasAttemptsRemaining
    : false
  const attemptsUsed = approval.result?.attemptsUsed ?? attempt.attemptNumber
  const timedOut = status === 'timed-out'

  // Ángulo para el indicador circular SVG
  const circumference = 2 * Math.PI * 54 // radio = 54
  const strokeOffset = circumference - (percentage / 100) * circumference

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-6">
      {/* Tarjeta principal de resultado */}
      <div
        className={`flex flex-col items-center gap-6 rounded-2xl border p-6 text-center sm:p-8 ${
          passed
            ? 'border-accent-ia/30 bg-accent-ia/5'
            : 'border-perf-fail/30 bg-perf-fail/5'
        }`}
      >
        {/* Indicador circular de puntaje */}
        <div className="relative h-32 w-32">
          <svg
            viewBox="0 0 120 120"
            className="h-full w-full -rotate-90"
            aria-hidden="true"
          >
            {/* Fondo del círculo */}
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-border"
            />
            {/* Progreso */}
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              className={`transition-[stroke-dashoffset] duration-700 ease-out ${
                passed ? 'stroke-accent-ia' : 'stroke-perf-fail'
              }`}
            />
          </svg>
          {/* Texto del porcentaje */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`font-heading text-2xl font-bold ${
                passed ? 'text-accent-ia' : 'text-perf-fail'
              }`}
            >
              {percentage}%
            </span>
            <span className="text-xs text-texto/70">
              {score}/{totalQuestions}
            </span>
          </div>
        </div>

        {/* Estado y mensaje */}
        <div>
          <h2
            className={`mb-2 font-heading text-xl font-bold sm:text-2xl ${
              passed ? 'text-accent-ia' : 'text-perf-fail'
            }`}
          >
            {passed
              ? '¡Evaluación aprobada!'
              : timedOut
                ? 'Tiempo agotado'
                : 'Evaluación no aprobada'}
          </h2>
          <p className="mx-auto max-w-md text-base leading-relaxed text-texto/80">
            {passed
              ? 'Has demostrado dominio del marco teórico. Los talleres prácticos están desbloqueados.'
              : timedOut
                ? `El tiempo se agotó antes de completar todas las respuestas. Obtuviste ${score} de ${totalQuestions} (se requieren ${config.passingScore}).`
                : `Necesitas al menos ${config.passingScore} respuestas correctas de ${totalQuestions} para aprobar. Obtuviste ${score}.`}
          </p>
        </div>

        {/* Información de intentos */}
        <div className="flex flex-wrap justify-center gap-3">
          <div className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-texto">
            Intento {attemptsUsed} de {config.maxAttempts}
          </div>
          <div className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-texto">
            Mínimo para aprobar: {config.passingScore}/{totalQuestions}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          {passed ? (
            <Button
              variant="primary"
              size="lg"
              icon={<ArrowRight size={18} />}
              onClick={() => navigate('/estudiante/talleres')}
              className="bg-accent-ia hover:bg-accent-ia/90 focus-visible:ring-accent-ia/50"
            >
              Continuar a los talleres
            </Button>
          ) : hasAttemptsRemaining ? (
            <Button
              variant="primary"
              size="lg"
              icon={<RotateCcw size={18} />}
              onClick={onRetry}
            >
              Reintentar evaluación ({config.maxAttempts - attemptsUsed} restante
              {config.maxAttempts - attemptsUsed !== 1 ? 's' : ''})
            </Button>
          ) : (
            <div className="rounded-xl border border-perf-fail bg-perf-fail/10 p-4 text-center text-sm leading-relaxed text-texto">
              Has agotado tus {config.maxAttempts} intentos. Contacta a tu profesor guía para recibir orientación.
            </div>
          )}
        </div>
      </div>

      {/* Detalle por pregunta */}
      <div>
        <h3 className="mb-4 font-heading text-lg font-semibold text-texto">
          Revisión de respuestas
        </h3>

        <div className="flex flex-col gap-3">
          {questions.map((question, index) => {
            const answer = answers.find((a) => a.questionId === question.id)
            const isCorrect = answer?.isCorrect ?? false
            const selectedOption = question.options.find(
              (o) => o.id === answer?.selectedOptionId,
            )
            const correctOption = question.options.find(
              (o) => o.id === question.correctOptionId,
            )
            const wasNotAnswered = !answer || answer.selectedOptionId === ''

            return (
              <details
                key={question.id}
                className={`overflow-hidden rounded-xl border transition-colors ${
                  isCorrect
                    ? 'border-accent-ia/30 bg-surface'
                    : wasNotAnswered
                      ? 'border-border bg-surface'
                      : 'border-perf-fail/30 bg-surface'
                }`}
              >
                <summary
                  className={`flex cursor-pointer items-center gap-3 p-4 text-sm font-medium transition-colors ${
                    isCorrect
                      ? 'bg-accent-ia/5 text-texto'
                      : wasNotAnswered
                        ? 'bg-bg text-texto/80'
                        : 'bg-perf-fail/5 text-texto'
                  }`}
                >
                  {/* Ícono de estado */}
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                      isCorrect
                        ? 'bg-accent-ia'
                        : wasNotAnswered
                          ? 'bg-perf-none'
                          : 'bg-perf-fail'
                    }`}
                    aria-hidden="true"
                  >
                    {isCorrect ? <Check size={14} /> : wasNotAnswered ? <Minus size={14} /> : <X size={14} />}
                  </span>
                  <span className="flex-1">
                    <strong>Pregunta {index + 1}:</strong> {question.statement.slice(0, 80)}
                    {question.statement.length > 80 ? '…' : ''}
                  </span>
                </summary>

                <div className="flex flex-col gap-2 border-t border-border/50 bg-surface p-4 pl-12 text-sm leading-relaxed text-texto">
                  {wasNotAnswered ? (
                    <p className="italic text-texto/70">No respondida.</p>
                  ) : (
                    <p>
                      <strong>Tu respuesta:</strong> {selectedOption?.label ?? '—'}
                    </p>
                  )}
                  {!isCorrect && (
                    <p className="text-accent-ia">
                      <strong>Respuesta correcta:</strong> {correctOption?.label ?? '—'}
                    </p>
                  )}
                  <p className="mt-1 rounded-lg border-l-4 border-accent-ia bg-bg p-3 text-xs leading-relaxed text-texto/85">
                    {question.explanation}
                  </p>
                </div>
              </details>
            )
          })}
        </div>
      </div>
    </div>
  )
}
