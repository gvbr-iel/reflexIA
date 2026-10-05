/**
 * @module views/theory-verification/TheoryQuizView
 *
 * Vista principal de la Historia de Usuario 4:
 * Verificación del dominio del marco teórico (REF-21 / RF-04).
 *
 * Orquesta las fases del flujo:
 *   loading → intro → quiz → result
 *
 * Delega toda la lógica al hook useTheoryQuiz (R5) y renderiza
 * los componentes correspondientes según la fase actual.
 *
 * Esta vista se monta dentro de StudentLayout (R6) y es el primer
 * destino del estudiante tras iniciar sesión (prerrequisito para
 * acceder a los talleres prácticos, RF-03).
 */

import { BookOpen } from 'lucide-react'
import Button from '../../components/Button'
import { useTheoryQuiz } from './hooks/useTheoryQuiz'
import QuizEngine from './components/QuizEngine'
import ScoreCard from './components/ScoreCard'

export default function TheoryQuizView() {
  const {
    // Estado
    phase,
    questions,
    currentIndex,
    answers,
    timeRemaining,
    config,
    approval,
    lastAttempt,
    currentAttemptNumber,
    isLoading,
    error,

    // Acciones
    startQuiz,
    selectAnswer,
    goToNext,
    goToPrevious,
    goToQuestion,
    submitQuiz,
    resetToIntro,
  } = useTheoryQuiz()

  // ── Fase: Carga inicial ───────────────────
  if (phase === 'loading') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 py-8 text-center">
        {/* Spinner */}
        <div
          className="h-12 w-12 rounded-full border-[3px] border-border border-t-primary animate-spin"
          role="status"
          aria-label="Cargando evaluación"
        />
        <p className="text-base text-texto/70">
          Cargando evaluación del marco teórico…
        </p>
      </div>
    )
  }

  // ── Fase: Introducción ────────────────────
  if (phase === 'intro') {
    const hasAttempts = approval.result
      ? approval.result.hasAttemptsRemaining
      : true
    const attemptsUsed = approval.result?.attemptsUsed ?? 0
    const isRetry = attemptsUsed > 0

    return (
      <div className="mx-auto flex max-w-xl flex-col gap-8 px-4 py-8">
        {/* Encabezado */}
        <div className="text-center">
          {/* Ícono decorativo */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BookOpen size={28} aria-hidden="true" />
          </div>

          <h1 className="mb-3 font-heading text-2xl font-bold text-texto sm:text-3xl">
            Evaluación del Marco Teórico
          </h1>
          <p className="mx-auto max-w-lg text-base leading-relaxed text-texto/70">
            {isRetry
              ? 'Puedes reintentar la evaluación. Se seleccionarán nuevas preguntas de forma aleatoria.'
              : 'Antes de iniciar los talleres prácticos, debes demostrar dominio de los conceptos fundamentales sobre reflexión profesional.'}
          </p>
        </div>

        {/* Error (si hay) */}
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-perf-fail bg-perf-fail/10 p-4 text-sm leading-relaxed text-texto"
          >
            {error}
          </div>
        )}

        {/* Tarjeta de instrucciones */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold text-texto">
            Instrucciones
          </h2>

          <ul className="flex flex-col gap-2 pl-5 text-base leading-relaxed text-texto/80 list-disc">
            <li>
              Se presentarán <strong>{config.questionsPerAttempt} preguntas</strong> seleccionadas aleatoriamente de un banco de preguntas.
            </li>
            <li>
              Dispones de <strong>{Math.floor(config.timeLimitSeconds / 60)} minutos</strong> para completar la evaluación.
            </li>
            <li>
              Para aprobar necesitas al menos <strong>{config.passingScore} respuestas correctas</strong> de {config.questionsPerAttempt}.
            </li>
            <li>
              Tienes un máximo de <strong>{config.maxAttempts} intentos</strong> en total.
            </li>
            <li>Puedes navegar libremente entre las preguntas antes de finalizar.</li>
            <li>Si el tiempo se agota, se enviarán automáticamente las respuestas registradas.</li>
          </ul>
        </div>

        {/* Estado de intentos (solo si ya intentó) */}
        {isRetry && (
          <div className="flex flex-wrap justify-center gap-3">
            <div className="rounded-lg border border-secondary/30 bg-secondary/10 px-4 py-2 text-sm text-texto">
              Intentos usados: <strong>{attemptsUsed} de {config.maxAttempts}</strong>
            </div>
            {approval.result && (
              <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-texto">
                Mejor puntaje: <strong>{approval.result.bestScore}/{approval.result.totalQuestions}</strong>
              </div>
            )}
          </div>
        )}

        {/* Botón de acción */}
        <div className="text-center">
          {hasAttempts ? (
            <Button
              size="lg"
              onClick={startQuiz}
              disabled={isLoading}
              isLoading={isLoading}
              className="px-8 shadow-md shadow-primary/20"
            >
              {isRetry ? 'Reintentar evaluación' : 'Comenzar evaluación'}
            </Button>
          ) : (
            <div className="rounded-xl border border-perf-fail bg-perf-fail/10 p-4 text-sm leading-relaxed text-texto">
              Has agotado tus {config.maxAttempts} intentos. Contacta a tu profesor guía para recibir orientación.
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Fase: Cuestionario activo ──────────────
  if (phase === 'quiz') {
    return (
      <>
        {/* Error flotante durante el cuestionario */}
        {error && (
          <div
            role="alert"
            className="mx-auto my-4 max-w-3xl rounded-xl border border-perf-fail bg-perf-fail/10 p-3 text-sm text-texto"
          >
            {error}
          </div>
        )}

        <QuizEngine
          questions={questions}
          currentIndex={currentIndex}
          answers={answers}
          timeRemaining={timeRemaining}
          timeLimitSeconds={config.timeLimitSeconds}
          attemptNumber={currentAttemptNumber}
          maxAttempts={config.maxAttempts}
          isSubmitting={isLoading}
          onSelectAnswer={selectAnswer}
          onNext={goToNext}
          onPrevious={goToPrevious}
          onGoToQuestion={goToQuestion}
          onSubmit={submitQuiz}
        />
      </>
    )
  }

  // ── Fase: Resultado ───────────────────────
  if (phase === 'result' && lastAttempt) {
    return (
      <ScoreCard
        attempt={lastAttempt}
        approval={approval}
        config={config}
        onRetry={resetToIntro}
      />
    )
  }

  // ── Fallback (no debería ocurrir) ─────────
  return null
}
