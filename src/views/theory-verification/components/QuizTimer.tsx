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

import { useMemo } from 'react'
import { Clock } from 'lucide-react'

interface QuizTimerProps {
  /** Segundos restantes del temporizador. */
  timeRemaining: number
  /** Duración total del intento en segundos (para calcular progreso). */
  timeLimitSeconds: number
}

/** Formatea segundos a MM:SS. */
function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function QuizTimer({ timeRemaining, timeLimitSeconds }: QuizTimerProps) {
  const percentage = useMemo(
    () => Math.max(0, (timeRemaining / timeLimitSeconds) * 100),
    [timeRemaining, timeLimitSeconds],
  )

  const urgency = useMemo(() => {
    if (percentage <= 25) return 'critical'
    if (percentage <= 50) return 'warning'
    return 'normal'
  }, [percentage])

  const formattedTime = formatTime(timeRemaining)

  const urgencyConfig = {
    normal: {
      barClass: 'bg-primary',
      textClass: 'text-primary',
      pulse: false,
    },
    warning: {
      barClass: 'bg-secondary',
      textClass: 'text-secondary',
      pulse: false,
    },
    critical: {
      barClass: 'bg-perf-fail',
      textClass: 'text-perf-fail',
      pulse: true,
    },
  }[urgency]

  return (
    <div
      className="flex w-full items-center gap-3"
      role="timer"
      aria-label={`Tiempo restante: ${formattedTime}`}
      aria-live="polite"
    >
      {/* Ícono de reloj */}
      <Clock
        size={20}
        aria-hidden="true"
        className={`shrink-0 ${urgencyConfig.textClass} ${urgencyConfig.pulse ? 'animate-pulse' : ''}`}
      />

      {/* Barra de progreso */}
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progreso del tiempo"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${urgencyConfig.barClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Texto del tiempo */}
      <span
        className={`min-w-14 shrink-0 text-right text-sm font-semibold tabular-nums ${urgencyConfig.textClass} ${
          urgencyConfig.pulse ? 'animate-pulse' : ''
        }`}
      >
        {formattedTime}
      </span>
    </div>
  )
}
