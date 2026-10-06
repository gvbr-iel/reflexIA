/**
 * @module views/innovations/hooks/useInnovations
 *
 * Lógica de la biblioteca de innovaciones (HU-07 / RF-07): búsqueda por
 * texto, filtro por categoría y caso abierto en detalle. La vista solo
 * muestra lo que este hook entrega.
 */

import { useMemo, useState } from 'react'
import { innovationCases } from '../data/innovations'
import type { InnovationCase } from '../models/innovation'

/** Opción del filtro que muestra todas las categorías. */
const ALL_CATEGORIES = 'Todas'

/**
 * Prepara un texto para comparar sin importar tildes ni mayúsculas:
 * "Evaluación" → "evaluacion". `normalize('NFD')` separa la letra de su tilde
 * y el `replace` borra las tildes que quedaron sueltas.
 */
function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
}

/** Hook con el estado de la biblioteca: búsqueda, categoría y caso abierto. */
export function useInnovations() {
  // Texto escrito en el buscador.
  const [query, setQuery] = useState('')
  // Categoría elegida ("Todas" por defecto).
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES)
  // Caso abierto en la ventana de detalle (null = ventana cerrada).
  const [selectedCase, setSelectedCase] = useState<InnovationCase | null>(null)

  // Lista de categorías sin repetir ("new Set" elimina duplicados), con "Todas" primero.
  // Se calcula una sola vez porque los casos no cambian.
  const categories = useMemo(
    () => [ALL_CATEGORIES, ...new Set(innovationCases.map((item) => item.category))],
    [],
  )

  // Casos que cumplen la categoría Y contienen el texto buscado.
  const filteredCases = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query.trim())

    return innovationCases.filter((item) => {
      const matchesCategory =
        selectedCategory === ALL_CATEGORIES || item.category === selectedCategory
      // Se busca en título, categoría, resumen, contexto y etiquetas a la vez.
      const searchableContent = [
        item.title,
        item.category,
        item.summary,
        item.context,
        ...item.tags,
      ]
        .join(' ')
      const normalizedContent = normalizeSearchText(searchableContent)
      const matchesQuery = !normalizedQuery || normalizedContent.includes(normalizedQuery)

      return matchesCategory && matchesQuery
    })
  }, [query, selectedCategory])

  /** Vacía la búsqueda y vuelve a "Todas". */
  function clearFilters() {
    setQuery('')
    setSelectedCategory(ALL_CATEGORIES)
  }

  return {
    categories,
    filteredCases,
    query,
    selectedCategory,
    selectedCase,
    setQuery,
    setSelectedCategory,
    setSelectedCase,
    clearFilters,
  }
}
