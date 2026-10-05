import { CircleAlert, Inbox, SearchX } from 'lucide-react'

import Button from '../../../components/Button'
import type { Reflection } from '../../../models/reflection'
import ReflectionListItem from './ReflectionListItem'

/* ------------------------------------------------
   ReflectionList — HU-02 / RF-02

   Lista de reflexiones por revisar. Cubre los estados
   de la regla 9 de AI_GUIDELINES: carga (skeleton),
   error con reintento, vacío (sin reflexiones o sin
   resultados para los filtros) y lista con datos.

   No tiene lógica propia: todo llega por props desde
   los hooks de la vista.
   ------------------------------------------------ */

interface ReflectionListProps {
  /** Reflexiones que se muestran (ya filtradas). */
  reflections: Reflection[]
  isLoading: boolean
  /** Mensaje si la carga falló (null si todo va bien). */
  error: string | null
  onRetry: () => void
  /** Id de la reflexión abierta en el detalle (null si ninguna). */
  selectedId: string | null
  onSelect: (reflectionId: string) => void
  /** true si hay filtros activos; cambia el mensaje del estado vacío. */
  hasActiveFilters: boolean
  onClearFilters: () => void
}

export default function ReflectionList({
  reflections,
  isLoading,
  error,
  onRetry,
  selectedId,
  onSelect,
  hasActiveFilters,
  onClearFilters,
}: ReflectionListProps) {
  /* ---- Estado de carga ---- */
  if (isLoading) {
    return (
      <div className="space-y-3" role="status" aria-busy="true" aria-label="Cargando las reflexiones">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-24 animate-pulse rounded-xl border border-border bg-border/40" />
        ))}
      </div>
    )
  }

  /* ---- Estado de error ---- */
  if (error) {
    return (
      <div role="alert" className="space-y-3 rounded-xl border border-border bg-surface p-5">
        <p className="flex items-start gap-2 text-base text-texto">
          <CircleAlert size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          {error}
        </p>
        <Button variant="outline" onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    )
  }

  /* ---- Estado vacío ---- */
  if (reflections.length === 0) {
    return (
      <div className="space-y-3 rounded-xl border border-border bg-surface p-5 text-center">
        {hasActiveFilters ? (
          <>
            <SearchX size={28} className="mx-auto text-texto/50" aria-hidden="true" />
            <p className="text-base text-texto">
              Ninguna reflexión coincide con los filtros elegidos.
            </p>
            <Button variant="outline" onClick={onClearFilters}>
              Limpiar filtros
            </Button>
          </>
        ) : (
          <>
            <Inbox size={28} className="mx-auto text-texto/50" aria-hidden="true" />
            <p className="text-base text-texto">
              Aún no hay reflexiones enviadas para revisar.
            </p>
          </>
        )}
      </div>
    )
  }

  /* ---- Lista con datos ---- */
  return (
    <ul className="space-y-3" aria-label="Reflexiones por revisar">
      {reflections.map((reflection) => (
        <ReflectionListItem
          key={reflection.id}
          reflection={reflection}
          isSelected={reflection.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </ul>
  )
}
