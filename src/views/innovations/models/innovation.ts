/**
 * @module views/innovations/models/innovation
 *
 * Tipo de un caso de la biblioteca de innovaciones (HU-07 / RF-07).
 * Los casos son ejemplos ilustrativos, no experiencias reales.
 */

/** Un caso de "actuación mejorada" que se puede consultar y adaptar. */
export interface InnovationCase {
  /** Identificador único (se usa como "key" de React). */
  id: string
  /** Nombre del caso. */
  title: string
  /** Categoría para filtrar (e.g. "Evaluación formativa"). */
  category: string
  /** Resumen corto que se ve en la tarjeta. */
  summary: string
  /** En qué tipo de curso o situación sirve. */
  context: string
  /** Problema pedagógico que aborda. */
  challenge: string
  /** La actuación mejorada que se propone. */
  action: string
  /** Pasos para adaptarla, en orden. */
  implementation: string[]
  /** Qué se espera lograr con ella. */
  expectedImpact: string
  /** Palabras clave para la búsqueda. */
  tags: string[]
}
