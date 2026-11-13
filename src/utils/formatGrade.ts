/**
 * @module utils/formatGrade
 *
 * Formato de las notas como se escriben en Chile: un decimal y coma
 * decimal (6,3 y no 6.3). Lo usan las pantallas del cuestionario.
 */

/** Escribe una nota con un decimal y coma: 6.25 → "6,3"; 5 → "5,0". */
export function formatGrade(grade: number): string {
  // Se suma un épsilon para que 6,25 se redondee a 6,3, igual que roundGrade.
  const rounded = Math.round((grade + Number.EPSILON) * 10) / 10;
  return rounded.toFixed(1).replace('.', ',');
}
