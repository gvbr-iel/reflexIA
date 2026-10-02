/**
 * @component QuizTimer
 *
 * Contador regresivo visual para el cuestionario del marco teórico.
 *
 * Props recibidas desde el hook useTheoryQuiz (R5):
 * - timeRemaining: segundos restantes
 * - timeLimitSeconds: duración total para calcular el progreso
 *
 * Cambia de color conforme se agota el tiempo:
 * - Normal (> 50%):  color primario (azul institucional)
 * - Alerta (25-50%): color secundario (celeste)
 * - Crítico (< 25%): rojo semántico + animación de pulso
 */

import { useMemo } from 'react';

interface QuizTimerProps {
  /** Segundos restantes del temporizador. */
  timeRemaining: number;
  /** Duración total del intento en segundos (para calcular progreso). */
  timeLimitSeconds: number;
}

/** Formatea segundos a MM:SS. */
function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function QuizTimer({ timeRemaining, timeLimitSeconds }: QuizTimerProps) {
  const percentage = useMemo(
    () => Math.max(0, (timeRemaining / timeLimitSeconds) * 100),
    [timeRemaining, timeLimitSeconds],
  );

  const urgency = useMemo(() => {
    if (percentage <= 25) return 'critical';
    if (percentage <= 50) return 'warning';
    return 'normal';
  }, [percentage]);

  const formattedTime = formatTime(timeRemaining);

  // Colores según urgencia (usando tokens de AI_GUIDELINES §4)
  const colorStyles: Record<string, { bar: string; text: string; bg: string }> = {
    normal:   { bar: 'var(--color-primary)',   text: 'var(--color-primary)',   bg: 'var(--color-border)' },
    warning:  { bar: 'var(--color-secondary)', text: 'var(--color-secondary)', bg: 'var(--color-border)' },
    critical: { bar: 'var(--perf-fail)',       text: 'var(--perf-fail)',       bg: 'var(--color-border)' },
  };

  const colors = colorStyles[urgency];

  return (
    <div
      className="quiz-timer"
      role="timer"
      aria-label={`Tiempo restante: ${formattedTime}`}
      aria-live="polite"
      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}
    >
      {/* Ícono de reloj */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={colors.text}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{
          flexShrink: 0,
          animation: urgency === 'critical' ? 'pulse 1s ease-in-out infinite' : 'none',
        }}
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>

      {/* Barra de progreso */}
      <div
        style={{
          flex: 1,
          height: '0.5rem',
          borderRadius: '9999px',
          backgroundColor: colors.bg,
          overflow: 'hidden',
        }}
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progreso del tiempo"
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            borderRadius: '9999px',
            backgroundColor: colors.bar,
            transition: 'width 1s linear, background-color 0.3s ease',
          }}
        />
      </div>

      {/* Texto del tiempo */}
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
          color: colors.text,
          flexShrink: 0,
          minWidth: '3.5rem',
          textAlign: 'right',
          animation: urgency === 'critical' ? 'pulse 1s ease-in-out infinite' : 'none',
        }}
      >
        {formattedTime}
      </span>
    </div>
  );
}
