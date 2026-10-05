import { CalendarCheck, CalendarClock, CalendarOff, CalendarX } from 'lucide-react'

import { formatDays, getDeadlineStatus } from '../../../utils/workPacingDates'

/* ------------------------------------------------
   DeadlineBadge — HU-06 / RF-06

   Insignia pequeña que indica en qué estado está un
   plazo respecto de hoy:
     - Sin plazo
     - Vence en N días
     - Vence hoy
     - Vencido hace N días

   Cada estado se distingue por ícono y por texto, no
   solo por color. Tampoco usa rojo ni naranjo, que están
   reservados para el desempeño (AI_GUIDELINES §4).
   ------------------------------------------------ */

interface DeadlineBadgeProps {
  /** Fecha límite en formato AAAA-MM-DD (null si la actividad no tiene plazo). */
  deadline: string | null
}

export default function DeadlineBadge({ deadline }: DeadlineBadgeProps) {
  // Calcula el estado del plazo y cuántos días faltan (o pasaron).
  const { status, days } = getDeadlineStatus(deadline)

  // Forma común a todas las insignias (cada una agrega sus propios colores).
  const base = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium'

  switch (status) {
    // No hay fecha límite.
    case 'none':
      return (
        <span className={`${base} border border-border bg-bg text-texto/70`}>
          <CalendarOff size={14} aria-hidden="true" />
          Sin plazo
        </span>
      )

    // Todavía faltan días para el plazo.
    case 'upcoming':
      return (
        <span className={`${base} bg-primary/10 text-primary`}>
          <CalendarClock size={14} aria-hidden="true" />
          Vence en {formatDays(days)}
        </span>
      )

    // El plazo termina hoy: borde más grueso para que llame la atención.
    case 'today':
      return (
        <span className={`${base} border-2 border-primary/60 bg-primary/5 text-primary`}>
          <CalendarCheck size={14} aria-hidden="true" />
          Vence hoy
        </span>
      )

    // El plazo ya pasó.
    case 'overdue':
      return (
        <span className={`${base} border border-border bg-bg text-texto`}>
          <CalendarX size={14} aria-hidden="true" />
          Vencido hace {formatDays(days)}
        </span>
      )
  }
}
