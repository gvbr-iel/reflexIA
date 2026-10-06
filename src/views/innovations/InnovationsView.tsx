import { BookOpen, Search, Sparkles } from 'lucide-react'
import Button from '../../components/Button'
import InnovationCard from './components/InnovationCard'
import InnovationDetailModal from './components/InnovationDetailModal'
import { useInnovations } from './hooks/useInnovations'

/* ------------------------------------------------
   InnovationsView — HU-07 / RF-07

   Biblioteca de "actuaciones mejoradas": casos de
   ejemplo que se pueden buscar, filtrar por categoría
   y abrir en detalle. La comparten estudiantes
   (/estudiante/innovaciones) y profesores guía
   (/docente/innovaciones): la misma vista se monta en
   los dos layouts.

   La lógica vive en el hook useInnovations; aquí solo
   se dibuja.
   ------------------------------------------------ */
export default function InnovationsView() {
  // Se "desarma" el objeto que devuelve el hook para usar cada dato por su nombre.
  const {
    categories,
    filteredCases,
    query,
    selectedCategory,
    selectedCase,
    setQuery,
    setSelectedCategory,
    setSelectedCase,
    clearFilters,
  } = useInnovations()

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
          Explora estrategias ilustrativas, revisa cómo podrían adaptarse a tu contexto y
          encuentra ideas para orientar tu práctica.
        </p>
        <p className="mt-4 inline-flex items-start gap-2 rounded-lg bg-primary/5 px-3 py-2 text-sm leading-relaxed text-primary">
          <BookOpen size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          Los casos de esta biblioteca son ejemplos de referencia, no experiencias reales
          verificadas.
        </p>
      </header>

      <section aria-labelledby="library-heading">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="library-heading" className="font-heading text-xl font-semibold text-texto">
              Explorar casos
            </h2>
            <p className="mt-1 text-base text-texto/65">
              {filteredCases.length}{' '}
              {filteredCases.length === 1 ? 'caso disponible' : 'casos disponibles'}
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-surface p-4 md:p-5">
          <div className="relative max-w-xl">
            <label
              htmlFor="innovation-search"
              className="mb-2 block text-base font-medium text-texto"
            >
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
              placeholder="Ej.: colaboración, evaluación, inclusión"
              className="w-full rounded-lg border border-border bg-bg py-2.5 pl-10 pr-3 text-base text-texto placeholder:text-texto/45 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <p id="innovation-categories-label" className="mb-2 text-base font-medium text-texto">
              Filtrar por categoría
            </p>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-labelledby="innovation-categories-label"
            >
              {categories.map((category) => {
                const isSelected = selectedCategory === category

                return (
                  <Button
                    key={category}
                    type="button"
                    size="sm"
                    variant={isSelected ? 'secondary' : 'outline'}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Hay resultados: grilla de tarjetas. Sin resultados: estado vacío con
            un botón para limpiar los filtros. */}
        {filteredCases.length > 0 ? (
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
              No encontramos casos con esos criterios
            </h3>
            <p className="mt-2 text-base text-texto/70">
              Prueba con otra palabra o elimina el filtro de categoría.
            </p>
            <Button type="button" variant="outline" className="mt-5" onClick={clearFilters}>
              Limpiar búsqueda y filtros
            </Button>
          </div>
        )}
      </section>

      {/* Ventana de detalle: solo se ve cuando hay un caso elegido. */}
      <InnovationDetailModal
        innovation={selectedCase}
        onClose={() => setSelectedCase(null)}
      />
    </div>
  )
}
