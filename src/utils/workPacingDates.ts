/**
 * @module utils/workPacingDates
 *
 * Funciones de fechas límite para el panel de plazos e intentos (HU-06).
 *
 * Los plazos se guardan como "YYYY-MM-DD" y se interpretan en la hora local
 * del navegador, sin horas, para evitar que un cambio de zona horaria
 * desplace el día.
 */

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86_400_000;

const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/** Estado de un plazo respecto de hoy. */
export type DeadlineStatus = 'none' | 'upcoming' | 'today' | 'overdue';

/** Interpreta "YYYY-MM-DD" como una fecha local a medianoche. */
export function parseDeadline(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Indica si el texto es una fecha real en formato YYYY-MM-DD. */
export function isValidDateString(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/** Días desde hoy hasta el plazo: positivo si falta, 0 si es hoy, negativo si pasó. */
export function daysUntil(deadline: string, now: Date = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((parseDeadline(deadline).getTime() - today.getTime()) / MS_PER_DAY);
}

/** Fecha legible en español (e.g. "15 oct 2026"). */
export function formatDeadline(deadline: string): string {
  return dateFormatter.format(parseDeadline(deadline));
}

/** Estado del plazo y cuántos días faltan o pasaron (siempre positivo). */
export function getDeadlineStatus(
  deadline: string | null,
  now: Date = new Date(),
): { status: DeadlineStatus; days: number } {
  if (!deadline) return { status: 'none', days: 0 };

  const days = daysUntil(deadline, now);
  if (days < 0) return { status: 'overdue', days: -days };
  if (days === 0) return { status: 'today', days: 0 };
  return { status: 'upcoming', days };
}

/** "1 día" o "N días". */
export function formatDays(days: number): string {
  return days === 1 ? '1 día' : `${days} días`;
}
