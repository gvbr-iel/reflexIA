import { useMemo, useState } from 'react'
import { innovationCases } from '../data/innovations'
import type { InnovationCase } from '../models/innovation'

const ALL_CATEGORIES = 'Todas'

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
}

export function useInnovations() {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES)
  const [selectedCase, setSelectedCase] = useState<InnovationCase | null>(null)

  const categories = useMemo(
    () => [ALL_CATEGORIES, ...new Set(innovationCases.map((item) => item.category))],
    [],
  )

  const filteredCases = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query.trim())

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
      const normalizedContent = normalizeSearchText(searchableContent)
      const matchesQuery = !normalizedQuery || normalizedContent.includes(normalizedQuery)

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
