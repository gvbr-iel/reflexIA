import { BookOpen, Search, Sparkles } from 'lucide-react';

import Button from '../../components/Button';
import { useAuth } from '../../hooks/useAuth';
import { WORKSHOP_IDS } from '../../models/workshopStructure';
import InnovationCard from './components/InnovationCard';
import InnovationDetailModal from './components/InnovationDetailModal';
import InnovationReviewPanel from './components/InnovationReviewPanel';
import { useInnovations } from './hooks/useInnovations';
import { WORKSHOP_TITLES } from './models/innovation';

const selectClassName =
  'w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-base text-texto focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

export default function InnovationsView() {
  const { role } = useAuth();
  const {
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
    retry,
    clearFilters,
  } = useInnovations();

  const hasFilters = Boolean(query.trim() || selectedWorkshop || selectedTag);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="rounded-2xl border border-border bg-surface p-6 md:p-8">
        <div className="flex items-center gap-2 text-sm font-semibold text-accent-ia">
          <Sparkles size={18} aria-hidden="true" />
          <span>Biblioteca pedagógica</span>
        </div>
        <h1 className="mt-3 font-heading text-2xl font-bold text-texto md:text-3xl">
          Actuaciones mejoradas e innovaciones
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-texto/70">
          Explora trabajos auténticos realizados en los talleres, clasificados por etapa y estilo
          de innovación. Las publicaciones reales cuentan con nota oficial igual o superior a 6,0
          y fueron revisadas y anonimizadas por un docente. Al final encontrarás ejemplos
          demostrativos claramente diferenciados.
        </p>
        <p className="mt-4 inline-flex items-start gap-2 rounded-lg bg-primary/5 px-3 py-2 text-sm leading-relaxed text-primary">
          <BookOpen size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          La biblioteca no muestra nombres ni datos de identificación de quienes elaboraron los trabajos.
        </p>
      </header>

      {role === 'teacher' && <InnovationReviewPanel />}

      <section aria-labelledby="library-heading">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="library-heading" className="font-heading text-xl font-semibold text-texto">
              Trabajos publicados
            </h2>
            <p className="mt-1 text-base text-texto/65">
              {isLoading
                ? 'Cargando trabajos…'
                : `${filteredCases.length} ${filteredCases.length === 1 ? 'trabajo disponible' : 'trabajos disponibles'}`}
            </p>
          </div>
          {error && (
            <Button type="button" variant="outline" onClick={() => void retry()}>
              Reintentar
            </Button>
          )}
        </div>

        <div className="grid gap-4 rounded-xl border border-border bg-surface p-4 md:grid-cols-3 md:p-5">
          <div className="relative md:col-span-3">
            <label htmlFor="innovation-search" className="mb-2 block text-base font-medium text-texto">
              Buscar por tema o palabra clave
            </label>
            <Search
              size={18}
              className="pointer-events-none absolute bottom-3 left-3 text-texto/45"
              aria-hidden="true"
            />
            <input
              id="innovation-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ej.: participación, inclusión, evaluación formativa"
              className="w-full rounded-lg border border-border bg-bg py-2.5 pl-10 pr-3 text-base text-texto placeholder:text-texto/45 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label htmlFor="innovation-workshop" className="mb-2 block text-base font-medium text-texto">
              Filtrar por taller
            </label>
            <select
              id="innovation-workshop"
              value={selectedWorkshop}
              onChange={(event) => setSelectedWorkshop(event.target.value)}
              className={selectClassName}
            >
              <option value="">Todos los talleres</option>
              {WORKSHOP_IDS.map((workshopId) => (
                <option key={workshopId} value={workshopId}>
                  {WORKSHOP_TITLES[workshopId]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="innovation-tag" className="mb-2 block text-base font-medium text-texto">
              Filtrar por estilo
            </label>
            <select
              id="innovation-tag"
              value={selectedTag}
              onChange={(event) => setSelectedTag(event.target.value)}
              className={selectClassName}
            >
              <option value="">Todas las etiquetas</option>
              {tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
            </select>
          </div>
          {hasFilters && (
            <div className="flex items-end">
              <Button type="button" variant="outline" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>

        {error ? (
          <p role="alert" className="mt-5 rounded-xl border border-border bg-surface p-5 text-texto">
            {error}
          </p>
        ) : isLoading ? (
          <div role="status" aria-label="Cargando trabajos" className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-64 animate-pulse rounded-xl border border-border bg-surface" />
            ))}
          </div>
        ) : filteredCases.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredCases.map((innovation) => (
              <InnovationCard
                key={innovation.id}
                innovation={innovation}
                onOpen={setSelectedCase}
              />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-border bg-surface px-5 py-10 text-center">
            <h3 className="font-heading text-lg font-semibold text-texto">
              {innovations.length === 0
                ? 'Aún no hay innovaciones publicadas'
                : 'No hay trabajos con esos filtros'}
            </h3>
            <p className="mt-2 text-base text-texto/70">
              {innovations.length === 0
                ? 'Cuando un trabajo de taller obtenga una nota de 6,0 o más y un docente lo revise y anonimice, aparecerá aquí.'
                : 'Prueba con otra búsqueda o elimina los filtros seleccionados.'}
            </p>
            {hasFilters && (
              <Button type="button" variant="outline" className="mt-5" onClick={clearFilters}>
                Limpiar búsqueda y filtros
              </Button>
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="examples-heading" className="space-y-5">
        <header className="rounded-xl border border-border bg-primary/5 p-5">
          <h2 id="examples-heading" className="font-heading text-xl font-semibold text-texto">
            Ejemplos pedagógicos demostrativos
          </h2>
          <p className="mt-2 text-base leading-relaxed text-texto/75">
            Estos cuatro ejemplos son contenidos ficticios creados para ilustrar los productos de
            Identificar, Analizar, Teorizar y Transformar. No son trabajos de estudiantes, no tienen
            nota y no forman parte de las publicaciones reales.
          </p>
        </header>
        {filteredExamples.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredExamples.map((innovation) => (
              <InnovationCard
                key={innovation.id}
                innovation={innovation}
                onOpen={setSelectedCase}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-border bg-surface p-5 text-base text-texto/70">
            Ningún ejemplo coincide con los filtros actuales.
          </p>
        )}
      </section>

      <InnovationDetailModal
        innovation={selectedCase}
        onClose={() => setSelectedCase(null)}
      />
    </div>
  );
}
