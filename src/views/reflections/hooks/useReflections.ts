/**
 * @module views/reflections/hooks/useReflections
 *
 * Lógica de la lista de reflexiones del profesor guía (HU-02 / RF-02):
 * carga, filtros, resumen por estado y reflexión seleccionada.
 * La vista y los componentes solo muestran lo que este hook les entrega.
 *
 * La edición y validación de la reflexión seleccionada vive en
 * `useReflectionReview`. Cuando esa revisión cambia, la vista llama a
 * `updateReflection` para que la lista y su resumen se actualicen sin volver
 * a consultar el servicio.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  ALL_FILTER,
  DEFAULT_REFLECTION_FILTERS,
  type Reflection,
  type ReflectionFilters,
  type ReflectionStats,
} from '../../../models/reflection';
import { reflectionService } from '../../../services/reflectionService';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

/** Taller que aparece en las reflexiones, para el selector de filtro. */
export interface WorkshopFilterOption {
  id: string;
  number: number;
}

/** Todo lo que el hook le entrega a la vista. */
export interface UseReflectionsReturn {
  /** Todas las reflexiones, de la más reciente a la más antigua. */
  reflections: Reflection[];
  /** Las reflexiones que cumplen los filtros activos. */
  filteredReflections: Reflection[];
  /** Conteo por estado de revisión (sobre todas, sin filtros). */
  stats: ReflectionStats;
  /** Talleres presentes en las reflexiones, ordenados por número. */
  workshopOptions: WorkshopFilterOption[];

  /** true mientras se carga la lista por primera vez o al reintentar. */
  isLoading: boolean;
  /** Mensaje si la carga falló (null si todo va bien). */
  error: string | null;
  /** Vuelve a intentar la carga. */
  retry: () => Promise<void>;

  /** Filtros activos. */
  filters: ReflectionFilters;
  /** Cambia un filtro sin tocar los demás. */
  updateFilter: <K extends keyof ReflectionFilters>(key: K, value: ReflectionFilters[K]) => void;
  /** Vuelve a mostrar todas las reflexiones. */
  clearFilters: () => void;
  /** true si hay algún filtro distinto del valor inicial. */
  hasActiveFilters: boolean;

  /** Reflexión abierta en el detalle (null si no hay ninguna). */
  selectedReflection: Reflection | null;
  /** Abre el detalle de una reflexión. */
  selectReflection: (reflectionId: string) => void;
  /** Cierra el detalle. */
  clearSelection: () => void;

  /** Reemplaza una reflexión de la lista por su versión actualizada. */
  updateReflection: (updated: Reflection) => void;
}

// ─────────────────────────────────────────────
// Funciones auxiliares
// ─────────────────────────────────────────────

/** Pasa a minúsculas y quita tildes, para que la búsqueda no las distinga. */
function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLocaleLowerCase('es');
}

/** Texto en el que busca el filtro: el alias y los 4 campos del relato. */
function searchableText(reflection: Reflection): string {
  const { context, description, actors, relevance } = reflection.content;
  return normalizeSearchText(
    [reflection.studentAlias, context, description, actors, relevance].join(' '),
  );
}

/** Cuenta las reflexiones por estado de revisión. */
function countByStatus(reflections: Reflection[]): ReflectionStats {
  const stats: ReflectionStats = { total: reflections.length, pending: 0, edited: 0, validated: 0 };
  reflections.forEach((reflection) => {
    stats[reflection.review.status] += 1;
  });
  return stats;
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useReflections(): UseReflectionsReturn {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReflectionFilters>(DEFAULT_REFLECTION_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Identifica la consulta más reciente; las anteriores se ignoran.
  const latestRequestRef = useRef(0);

  /** Pide al servicio todas las reflexiones del profesor guía. */
  const load = useCallback(async () => {
    const requestId = ++latestRequestRef.current;

    try {
      setIsLoading(true);
      setError(null);

      const loaded = await reflectionService.list();
      if (requestId !== latestRequestRef.current) return;

      setReflections(loaded);
    } catch {
      if (requestId !== latestRequestRef.current) return;

      setError(
        'No se pudieron cargar las reflexiones. ' +
          'Verifica tu conexión e intenta nuevamente.',
      );
    } finally {
      if (requestId === latestRequestRef.current) setIsLoading(false);
    }
  }, []);

  // Carga las reflexiones una vez, al abrir la pantalla.
  useEffect(() => {
    load();
  }, [load]);

  // Cuántas reflexiones hay en cada estado de revisión (para las tarjetas de resumen).
  const stats = useMemo(() => countByStatus(reflections), [reflections]);

  // Talleres que aparecen en las reflexiones, sin repetir y ordenados (opciones del filtro).
  const workshopOptions = useMemo(() => {
    const byId = new Map<string, WorkshopFilterOption>();
    reflections.forEach((reflection) => {
      byId.set(reflection.workshopId, {
        id: reflection.workshopId,
        number: reflection.workshopNumber,
      });
    });
    return [...byId.values()].sort((a, b) => a.number - b.number);
  }, [reflections]);

  // Reflexiones que cumplen los tres filtros: taller, estado y texto buscado.
  const filteredReflections = useMemo(() => {
    const query = normalizeSearchText(filters.query.trim());

    return reflections.filter((reflection) => {
      const matchesWorkshop =
        filters.workshopId === ALL_FILTER || reflection.workshopId === filters.workshopId;
      const matchesStatus =
        filters.status === ALL_FILTER || reflection.review.status === filters.status;
      const matchesQuery = !query || searchableText(reflection).includes(query);

      return matchesWorkshop && matchesStatus && matchesQuery;
    });
  }, [reflections, filters]);

  const hasActiveFilters =
    filters.workshopId !== DEFAULT_REFLECTION_FILTERS.workshopId ||
    filters.status !== DEFAULT_REFLECTION_FILTERS.status ||
    filters.query !== DEFAULT_REFLECTION_FILTERS.query;

  /**
   * Cambia un solo filtro. Es genérica: `K` es el nombre del filtro y
   * TypeScript exige que `value` tenga el tipo correcto para ese filtro.
   */
  const updateFilter = useCallback(
    <K extends keyof ReflectionFilters>(key: K, value: ReflectionFilters[K]) => {
      setFilters((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const clearFilters = useCallback(() => setFilters(DEFAULT_REFLECTION_FILTERS), []);

  // Reflexión abierta en el panel de revisión (null si no hay ninguna).
  const selectedReflection = useMemo(
    () => reflections.find((reflection) => reflection.id === selectedId) ?? null,
    [reflections, selectedId],
  );

  const selectReflection = useCallback((reflectionId: string) => setSelectedId(reflectionId), []);
  const clearSelection = useCallback(() => setSelectedId(null), []);

  /** Reemplaza una reflexión en la lista después de guardarla o validarla. */
  const updateReflection = useCallback((updated: Reflection) => {
    setReflections((current) =>
      current.map((reflection) => (reflection.id === updated.id ? updated : reflection)),
    );
  }, []);

  return {
    reflections,
    filteredReflections,
    stats,
    workshopOptions,
    isLoading,
    error,
    retry: load,
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    selectedReflection,
    selectReflection,
    clearSelection,
    updateReflection,
  };
}
