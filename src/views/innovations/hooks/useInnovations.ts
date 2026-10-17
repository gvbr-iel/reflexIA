import { useCallback, useEffect, useMemo, useState } from 'react';

import { innovationService } from '../services/innovationService';
import type { InnovationCase } from '../models/innovation';
import { WORKSHOP_TITLES } from '../models/innovation';
import { innovationExamples } from '../data/innovationExamples';

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es');
}

export function useInnovations() {
  const [innovations, setInnovations] = useState<InnovationCase[]>([]);
  const [query, setQuery] = useState('');
  const [selectedWorkshop, setSelectedWorkshop] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedCase, setSelectedCase] = useState<InnovationCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setInnovations(await innovationService.fetchPublished());
    } catch (cause) {
      console.error('No se pudo cargar la biblioteca de innovaciones:', cause);
      setError('No se pudieron cargar las innovaciones. Verifica tu conexión e inténtalo nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const tags = useMemo(
    () => [...new Set([
      ...innovations.flatMap((innovation) => innovation.tags),
      ...innovationExamples.flatMap((innovation) => innovation.tags),
    ])].sort((a, b) =>
      a.localeCompare(b, 'es'),
    ),
    [innovations],
  );

  const filteredCases = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query.trim());
    return innovations.filter((item) => {
      const matchesWorkshop = !selectedWorkshop || item.workshopId === selectedWorkshop;
      const matchesTag = !selectedTag || item.tags.includes(selectedTag);
      const searchableContent = normalizeSearchText([
        item.title,
        WORKSHOP_TITLES[item.workshopId],
        item.summary,
        item.productType,
        item.work,
        ...item.tags,
      ].join(' '));
      return matchesWorkshop && matchesTag &&
        (!normalizedQuery || searchableContent.includes(normalizedQuery));
    });
  }, [innovations, query, selectedTag, selectedWorkshop]);

  const filteredExamples = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query.trim());
    return innovationExamples.filter((item) => {
      const matchesWorkshop = !selectedWorkshop || item.workshopId === selectedWorkshop;
      const matchesTag = !selectedTag || item.tags.includes(selectedTag);
      const searchableContent = normalizeSearchText([
        item.title,
        WORKSHOP_TITLES[item.workshopId],
        item.summary,
        item.productType,
        item.work,
        ...item.tags,
      ].join(' '));
      return matchesWorkshop && matchesTag &&
        (!normalizedQuery || searchableContent.includes(normalizedQuery));
    });
  }, [query, selectedTag, selectedWorkshop]);

  const clearFilters = useCallback(() => {
    setQuery('');
    setSelectedWorkshop('');
    setSelectedTag('');
  }, []);

  return {
    innovations,
    filteredCases,
    filteredExamples,
    tags,
    query,
    selectedWorkshop,
    selectedTag,
    selectedCase,
    isLoading,
    error,
    setQuery,
    setSelectedWorkshop,
    setSelectedTag,
    setSelectedCase,
    retry: load,
    clearFilters,
  };
}
