import { useState } from 'react'
import { ArrowLeft, BookOpen, MousePointerClick } from 'lucide-react'

import Button from '../../components/Button'
import AIPreviewBox from './components/AIPreviewBox'
import FeedbackEditor from './components/FeedbackEditor'
import ReflectionFilterBar from './components/ReflectionFilterBar'
import ReflectionList from './components/ReflectionList'
import ReflectionStatsBar from './components/ReflectionStatsBar'
import ReflectionStoryPanel from './components/ReflectionStoryPanel'
import ReviewNotice from './components/ReviewNotice'
import ValidateFeedbackModal from './components/ValidateFeedbackModal'
import { useReflectionReview } from './hooks/useReflectionReview'
import { useReflections } from './hooks/useReflections'

/* ------------------------------------------------
   ReflectionsView — HU-02 / RF-02

   Panel del profesor guía para revisar la retroalimentación
   que la IA propone sobre las reflexiones de los estudiantes.
   Aquí el profesor:
     - ve la lista de reflexiones, con su estado y filtros
     - abre una y lee el relato junto a la propuesta de la IA
       ("El Impulso") ANTES de actuar sobre ella
     - edita los impulsos, guarda los cambios y los valida

   Esta vista no tiene lógica propia: la lista y los filtros viven
   en useReflections, y la revisión de una reflexión en
   useReflectionReview. Aquí solo se conectan con los componentes.

   Se muestra dentro de TeacherLayout (regla R6) y se llega con un
   solo clic desde el menú lateral ("Reflexiones").

   Distribución: desde `xl` la lista va a la izquierda y el detalle
   a la derecha. En pantallas más angostas se muestra una cosa a la
   vez: al abrir una reflexión aparece su detalle con un botón para
   volver a la lista.
   ------------------------------------------------ */
export default function ReflectionsView() {
  // Lista, filtros y reflexión abierta.
  const list = useReflections()

  // Edición, guardado y validación de la reflexión abierta.
  const review = useReflectionReview(list.selectedReflection, list.updateReflection)

  // Controla si la ventana de confirmación de "Validar" está abierta.
  const [isValidateOpen, setIsValidateOpen] = useState(false)

  const selected = list.selectedReflection

  /** Abre una reflexión y sube al inicio de la página (útil en móvil). */
  function handleSelect(reflectionId: string) {
    list.selectReflection(reflectionId)
    window.scrollTo({ top: 0 })
  }

  /** Confirma la validación y, cuando termina, cierra la ventana. */
  async function handleConfirmValidate() {
    await review.validate()
    setIsValidateOpen(false)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* ===== Encabezado ===== */}
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold text-texto">Reflexiones</h1>
        <p className="max-w-3xl text-base leading-relaxed text-texto/70">
          Revisa las orientaciones que la IA propone a cada estudiante. Puedes editarlas y
          validarlas antes de entregarlas.
        </p>
        <p className="inline-flex max-w-3xl items-start gap-2 rounded-lg bg-primary/5 px-3 py-2 text-sm leading-relaxed text-primary">
          <BookOpen size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          Las reflexiones de esta pantalla son ejemplos de referencia. Tus ediciones y
          validaciones se guardan solo en este navegador.
        </p>
      </header>

      {/* ===== Resumen por estado ===== */}
      <ReflectionStatsBar stats={list.stats} isLoading={list.isLoading} />

      {/* ===== Lista y detalle ===== */}
      <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)] xl:items-start">
        {/* Lista: en pantallas angostas se oculta mientras hay una reflexión abierta. */}
        <section
          aria-label="Lista de reflexiones"
          className={`space-y-4 ${selected ? 'hidden xl:block' : ''}`}
        >
          <ReflectionFilterBar
            filters={list.filters}
            workshopOptions={list.workshopOptions}
            onQueryChange={(query) => list.updateFilter('query', query)}
            onWorkshopChange={(workshopId) => list.updateFilter('workshopId', workshopId)}
            onStatusChange={(status) => list.updateFilter('status', status)}
            onClear={list.clearFilters}
            hasActiveFilters={list.hasActiveFilters}
            resultCount={list.filteredReflections.length}
            totalCount={list.reflections.length}
            isLoading={list.isLoading}
          />
          <ReflectionList
            reflections={list.filteredReflections}
            isLoading={list.isLoading}
            error={list.error}
            onRetry={list.retry}
            selectedId={selected?.id ?? null}
            onSelect={handleSelect}
            hasActiveFilters={list.hasActiveFilters}
            onClearFilters={list.clearFilters}
          />
        </section>

        {/* Detalle: en pantallas angostas solo aparece cuando hay una reflexión abierta. */}
        <section
          aria-label="Detalle de la reflexión"
          className={selected ? '' : 'hidden xl:block'}
        >
          {selected ? (
            <div className="space-y-4">
              <div className="xl:hidden">
                <Button
                  variant="ghost"
                  icon={<ArrowLeft size={18} />}
                  onClick={list.clearSelection}
                >
                  Volver a la lista
                </Button>
              </div>

              <ReflectionStoryPanel reflection={selected} />
              <AIPreviewBox feedback={selected.aiFeedback} />
              <FeedbackEditor
                review={review}
                status={selected.review.status}
                onRequestValidate={() => setIsValidateOpen(true)}
              />
              {/* El aviso va junto a los botones para que se vea al guardar o validar. */}
              <ReviewNotice notice={review.notice} onDismiss={review.dismissNotice} />
            </div>
          ) : (
            <div className="space-y-3 rounded-xl border border-dashed border-border bg-surface p-8 text-center">
              <MousePointerClick size={28} className="mx-auto text-texto/50" aria-hidden="true" />
              <p className="text-base text-texto/70">
                Elige una reflexión de la lista para ver su relato y la propuesta de la IA.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* ===== Confirmación de validación ===== */}
      {selected && (
        <ValidateFeedbackModal
          isOpen={isValidateOpen}
          reflection={selected}
          isValidating={review.isValidating}
          onClose={() => setIsValidateOpen(false)}
          onConfirm={() => void handleConfirmValidate()}
        />
      )}
    </div>
  )
}
