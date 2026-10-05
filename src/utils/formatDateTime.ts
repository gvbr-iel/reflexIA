/**
 * @module utils/formatDateTime
 *
 * Formatea una marca temporal ISO 8601 para mostrarla en la interfaz
 * (por ejemplo, "5 oct 2026, 09:30"), en la hora local del navegador.
 * La usa la revisión de reflexiones del profesor guía (HU-02).
 */

const dateTimeFormatter = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** Devuelve la fecha y hora legibles, o un texto vacío si el valor no es una fecha válida. */
export function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime()) ? '' : dateTimeFormatter.format(date);
}
