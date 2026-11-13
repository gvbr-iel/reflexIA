/**
 * @component BlockedNotice
 *
 * Aviso de evaluación bloqueada (CU-08, DEC-15): el estudiante usó todos
 * sus intentos sin aprobar y solo el profesor guía puede habilitarlo.
 *
 * Usa el estilo informativo y no el rojo: el rojo queda reservado para
 * el desempeño (AI_GUIDELINES §4) y este aviso es una instrucción.
 * Lo comparten la intro y la pantalla de resultado (TheoryQuizView y ScoreCard).
 */

import { Lock } from 'lucide-react'

interface BlockedNoticeProps {
  /** Intentos máximos de la configuración (9). */
  maxAttempts: number
}

export default function BlockedNotice({ maxAttempts }: BlockedNoticeProps) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4 text-left text-sm leading-relaxed text-texto"
    >
      <Lock size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
      <p>
        Usaste los {maxAttempts} intentos sin aprobar y la evaluación quedó bloqueada.
        Reúnete con tu profesor guía para que te habilite un nuevo intento.
      </p>
    </div>
  )
}
