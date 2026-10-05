import { useMemo, useState } from 'react'
import { innovationCases } from '../data/innovations'
import type { InnovationCase } from '../models/innovation'

const ALL_CATEGORIES = 'Todas'

export function useInnovations() {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES)
  const [selectedCase, setSelectedCase] = useState<InnovationCase | null>(null)

  const categories = useMemo(
    () => [ALL_CATEGORIES, ...new Set(innovationCases.map((item) => item.category))],
    [],
  )

  const filteredCases = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es')

    return innovationCases.filter((item) => {
      const matchesCategory =
        selectedCategory === ALL_CATEGORIES || item.category === selectedCategory
      const searchableContent = [
        item.title,
        item.category,
        item.summary,
        item.context,
        ...item.tags,
      ]
        .join(' ')
        .toLocaleLowerCase('es')
      const matchesQuery = !normalizedQuery || searchableContent.includes(normalizedQuery)

      return matchesCategory && matchesQuery
    })
  }, [query, selectedCategory])

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
