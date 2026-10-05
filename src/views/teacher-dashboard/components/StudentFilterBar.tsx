import Button from '../../../components/Button'
import type { StudentFilter } from '../../../models/teacherDashboard'

/* ------------------------------------------------
   StudentFilterBar — panel docente

   Botones para filtrar la tabla por la situación de los
   estudiantes. Cada botón muestra cuántos hay en esa
   situación. El botón elegido se marca con color y con
   aria-pressed, para que no dependa solo del color.
   ------------------------------------------------ */

interface StudentFilterBarProps {
  /** Filtro elegido ahora. */
  filter: StudentFilter
  /** Cuántos estudiantes hay en cada filtro. */
  counts: Record<StudentFilter, number>
  onChange: (filter: StudentFilter) => void
  /** true mientras se cargan los datos: se desactivan los botones. */
  isLoading: boolean
}

/** Filtros en el orden en que se muestran. */
const FILTERS: { value: StudentFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'overdue', label: 'Con plazo vencido' },
  { value: 'in-progress', label: 'En curso' },
  { value: 'completed', label: 'Completados' },
]

export default function StudentFilterBar({
  filter,
  counts,
  onChange,
  isLoading,
}: StudentFilterBarProps) {
  return (
    // Los botones pasan a la línea de abajo si no caben (por ejemplo, en 360 px).
    <div role="group" aria-label="Filtrar estudiantes por situación" className="flex flex-wrap gap-2">
      {FILTERS.map(({ value, label }) => (
        <Button
          key={value}
          size="sm"
          variant={filter === value ? 'primary' : 'outline'}
          aria-pressed={filter === value}
          disabled={isLoading}
          onClick={() => onChange(value)}
        >
          {label} ({counts[value]})
        </Button>
      ))}
    </div>
  )
}
