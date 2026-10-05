import { Search, X } from 'lucide-react'

import Button from '../../../components/Button'
import { ALL_FILTER, type ReflectionFilters } from '../../../models/reflection'
import type { WorkshopFilterOption } from '../hooks/useReflections'
import { fieldClassName, labelClassName } from './fieldStyles'

/* ------------------------------------------------
   ReflectionFilterBar — HU-02 / RF-02

   Búsqueda por alias o palabra del relato y filtros por
   taller y por estado de revisión. Está pensada para la
   columna de la lista (angosta desde `xl`): el buscador
   ocupa todo el ancho y los dos selectores van lado a lado.

   No tiene estado propio: todo llega por props desde el
   hook useReflections.
   ------------------------------------------------ */

interface ReflectionFilterBarProps {
  filters: ReflectionFilters
  /** Talleres que aparecen en las reflexiones. */
  workshopOptions: WorkshopFilterOption[]
  onQueryChange: (query: string) => void
  onWorkshopChange: (workshopId: string) => void
  onStatusChange: (status: ReflectionFilters['status']) => void
  onClear: () => void
  hasActiveFilters: boolean
  /** Cantidad de reflexiones con los filtros actuales. */
  resultCount: number
  totalCount: number
  isLoading: boolean
}

/** Opciones del filtro de estado, en plural para leerse como "Mostrar: Pendientes". */
const STATUS_OPTIONS: { value: ReflectionFilters['status']; label: string }[] = [
  { value: ALL_FILTER, label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'edited', label: 'Editadas' },
  { value: 'validated', label: 'Validadas' },
]

export default function ReflectionFilterBar({
  filters,
  workshopOptions,
  onQueryChange,
  onWorkshopChange,
  onStatusChange,
  onClear,
  hasActiveFilters,
  resultCount,
  totalCount,
  isLoading,
}: ReflectionFilterBarProps) {
  return (
    <div className="space-y-3">
      {/* Búsqueda */}
      <div>
        <label htmlFor="reflection-search" className={labelClassName}>
          Buscar reflexión
        </label>
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-texto/50"
            aria-hidden="true"
          />
          <input
            id="reflection-search"
            type="search"
            value={filters.query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Ej: Estudiante A o una palabra del relato"
            autoComplete="off"
            className={`${fieldClassName} h-11 pl-10`}
          />
        </div>
      </div>

      {/* Taller y estado: lado a lado también en móvil */}
      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0">
          <label htmlFor="reflection-workshop" className={labelClassName}>
            Taller
          </label>
          <select
            id="reflection-workshop"
            value={filters.workshopId}
            onChange={(e) => onWorkshopChange(e.target.value)}
            className={`${fieldClassName} h-11 cursor-pointer`}
          >
            <option value={ALL_FILTER}>Todos</option>
            {workshopOptions.map((workshop) => (
              <option key={workshop.id} value={workshop.id}>
                Taller {workshop.number}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label htmlFor="reflection-status" className={labelClassName}>
            Estado
          </label>
          <select
            id="reflection-status"
            value={filters.status}
            onChange={(e) => onStatusChange(e.target.value as ReflectionFilters['status'])}
            className={`${fieldClassName} h-11 cursor-pointer`}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cantidad de resultados y botón para limpiar */}
      <div className="flex min-h-9 flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-texto/70" aria-live="polite">
          {isLoading
            ? 'Cargando reflexiones…'
            : hasActiveFilters
            ? `${resultCount} de ${totalCount} reflexiones coinciden con los filtros`
            : `${totalCount} ${totalCount === 1 ? 'reflexión' : 'reflexiones'}`}
        </p>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" icon={<X size={16} />} onClick={onClear}>
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  )
}
