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

import { useTheoryQuiz } from './hooks/useTheoryQuiz';
import QuizEngine from './components/QuizEngine';
import ScoreCard from './components/ScoreCard';

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
  } = useTheoryQuiz();

  // ── Fase: Carga inicial ───────────────────
  if (phase === 'loading') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1rem',
        padding: '2rem 1rem',
      }}>
        {/* Spinner */}
        <div
          style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '50%',
            border: '3px solid var(--color-border)',
            borderTopColor: 'var(--color-primary)',
            animation: 'spin 0.8s linear infinite',
          }}
          role="status"
          aria-label="Cargando evaluación"
        />
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-base)',
          color: 'var(--color-text)',
          opacity: 0.7,
        }}>
          Cargando evaluación del marco teórico…
        </p>
      </div>
    );
  }

  // ── Fase: Introducción ────────────────────
  if (phase === 'intro') {
    const hasAttempts = approval.result
      ? approval.result.hasAttemptsRemaining
      : true;
    const attemptsUsed = approval.result?.attemptsUsed ?? 0;
    const isRetry = attemptsUsed > 0;

    return (
      <div style={{
        maxWidth: '40rem',
        margin: '0 auto',
        padding: '2rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
      }}>
        {/* Encabezado */}
        <div style={{ textAlign: 'center' }}>
          {/* Ícono decorativo */}
          <div style={{
            width: '4rem',
            height: '4rem',
            borderRadius: '1rem',
            backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, var(--color-bg))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 700,
            color: 'var(--color-text)',
            marginBottom: '0.75rem',
          }}>
            Evaluación del Marco Teórico
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-base)',
            color: 'var(--color-text)',
            opacity: 0.7,
            lineHeight: 1.6,
            maxWidth: '32rem',
            margin: '0 auto',
          }}>
            {isRetry
              ? 'Puedes reintentar la evaluación. Se seleccionarán nuevas preguntas de forma aleatoria.'
              : 'Antes de iniciar los talleres prácticos, debes demostrar dominio de los conceptos fundamentales sobre reflexión profesional.'}
          </p>
        </div>

        {/* Error (si hay) */}
        {error && (
          <div
            role="alert"
            style={{
              padding: '1rem',
              borderRadius: '0.75rem',
              backgroundColor: 'color-mix(in srgb, var(--perf-fail) 8%, var(--color-surface))',
              border: '1px solid var(--perf-fail)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text)',
              lineHeight: 1.6,
            }}
          >
            {error}
          </div>
        )}

        {/* Tarjeta de instrucciones */}
        <div style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: '1rem',
          border: '1px solid var(--color-border)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--text-lg)',
            fontWeight: 600,
            color: 'var(--color-text)',
          }}>
            Instrucciones
          </h2>

          <ul style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-base)',
            color: 'var(--color-text)',
            lineHeight: 1.8,
            paddingLeft: '1.25rem',
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}>
            <li>Se presentarán <strong>{config.questionsPerAttempt} preguntas</strong> seleccionadas aleatoriamente de un banco de preguntas.</li>
            <li>Dispones de <strong>{Math.floor(config.timeLimitSeconds / 60)} minutos</strong> para completar la evaluación.</li>
            <li>Para aprobar necesitas al menos <strong>{config.passingScore} respuestas correctas</strong> de {config.questionsPerAttempt}.</li>
            <li>Tienes un máximo de <strong>{config.maxAttempts} intentos</strong> en total.</li>
            <li>Puedes navegar libremente entre las preguntas antes de finalizar.</li>
            <li>Si el tiempo se agota, se enviarán automáticamente las respuestas registradas.</li>
          </ul>
        </div>

        {/* Estado de intentos (solo si ya intentó) */}
        {isRetry && (
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            <div style={{
              padding: '0.625rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: 'color-mix(in srgb, var(--color-secondary) 10%, var(--color-surface))',
              border: '1px solid var(--color-secondary)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text)',
            }}>
              Intentos usados: <strong>{attemptsUsed} de {config.maxAttempts}</strong>
            </div>
            {approval.result && (
              <div style={{
                padding: '0.625rem 1rem',
                borderRadius: '0.5rem',
                backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, var(--color-surface))',
                border: '1px solid var(--color-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text)',
              }}>
                Mejor puntaje: <strong>{approval.result.bestScore}/{approval.result.totalQuestions}</strong>
              </div>
            )}
          </div>
        )}

        {/* Botón de acción */}
        <div style={{ textAlign: 'center' }}>
          {hasAttempts ? (
            <button
              onClick={startQuiz}
              disabled={isLoading}
              style={{
                padding: '1rem 2.5rem',
                borderRadius: '0.75rem',
                border: 'none',
                backgroundColor: 'var(--color-primary)',
                color: '#FFFFFF',
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-base)',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px color-mix(in srgb, var(--color-primary) 30%, transparent)',
              }}
            >
              {isLoading
                ? 'Cargando preguntas…'
                : isRetry
                  ? 'Reintentar evaluación'
                  : 'Comenzar evaluación'}
            </button>
          ) : (
            <div style={{
              padding: '1rem 1.5rem',
              borderRadius: '0.75rem',
              backgroundColor: 'color-mix(in srgb, var(--perf-fail) 8%, var(--color-surface))',
              border: '1px solid var(--perf-fail)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text)',
              lineHeight: 1.6,
            }}>
              Has agotado tus {config.maxAttempts} intentos. Contacta a tu profesor guía para recibir orientación.
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Fase: Cuestionario activo ──────────────
  if (phase === 'quiz') {
    return (
      <>
        {/* Error flotante durante el cuestionario */}
        {error && (
          <div
            role="alert"
            style={{
              maxWidth: '48rem',
              margin: '1rem auto',
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              backgroundColor: 'color-mix(in srgb, var(--perf-fail) 8%, var(--color-surface))',
              border: '1px solid var(--perf-fail)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text)',
            }}
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
    );
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
    );
  }

  // ── Fallback (no debería ocurrir) ─────────
  return null;
}
