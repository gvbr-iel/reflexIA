import { Search, X } from 'lucide-react'

import Button from '../../../components/Button'
import type { WhitelistFilters, StatusFilter, RoleFilter } from '../hooks/useWhitelist'
import { fieldClassName, labelClassName } from './fieldStyles'

/* ------------------------------------------------
   FilterBar — HU-01 / RF-01
   Búsqueda por correo y filtros por estado y perfil.
   ------------------------------------------------ */

interface FilterBarProps {
  /** Valores actuales de los tres filtros. */
  filters: WhitelistFilters
  /** Cada cambio se envía al hook, que es quien guarda los filtros. */
  onQueryChange: (query: string) => void
  onStatusChange: (status: StatusFilter) => void
  onRoleChange: (role: RoleFilter) => void
  /** Vuelve todos los filtros a "Todos". */
  onClear: () => void
  /** true si algún filtro está en uso (muestra "Limpiar filtros"). */
  hasActiveFilters: boolean
  /** Cantidad de resultados con los filtros actuales. */
  resultCount: number
  /** Cantidad total de correos, sin filtrar. */
  totalCount: number
  isLoading: boolean
}

export default function FilterBar({
  filters,
  onQueryChange,
  onStatusChange,
  onRoleChange,
  onClear,
  hasActiveFilters,
  resultCount,
  totalCount,
  isLoading,
}: FilterBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        {/* Búsqueda */}
        <div className="min-w-0 sm:flex-1 sm:basis-64">
          <label htmlFor="whitelist-search" className={labelClassName}>
            Buscar correo
          </label>
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-texto/50"
              aria-hidden="true"
            />
            <input
              id="whitelist-search"
              type="search"
              value={filters.query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Ej: estudiante@ucen.cl"
              autoComplete="off"
              className={`${fieldClassName} h-11 pl-10`}
            />
          </div>
        </div>

        {/* Estado y perfil: lado a lado también en móvil */}
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <div className="min-w-0 sm:w-40">
            <label htmlFor="whitelist-status" className={labelClassName}>
              Estado
            </label>
            <select
              id="whitelist-status"
              value={filters.status}
              onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
              className={`${fieldClassName} h-11 cursor-pointer`}
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="revoked">Revocados</option>
            </select>
          </div>

          <div className="min-w-0 sm:w-44">
            <label htmlFor="whitelist-role" className={labelClassName}>
              Perfil
            </label>
            <select
              id="whitelist-role"
              value={filters.role}
              onChange={(e) => onRoleChange(e.target.value as RoleFilter)}
              className={`${fieldClassName} h-11 cursor-pointer`}
            >
              <option value="all">Todos</option>
              <option value="student">Estudiantes</option>
              <option value="teacher">Profesores guía</option>
              <option value="admin">Administradores</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex min-h-9 flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-texto/70" aria-live="polite">
          {isLoading
            ? 'Cargando correos…'
            : hasActiveFilters
            ? `${resultCount} de ${totalCount} correos coinciden con los filtros`
            : `${totalCount} ${totalCount === 1 ? 'correo registrado' : 'correos registrados'}`}
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
