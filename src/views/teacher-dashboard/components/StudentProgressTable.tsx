import { AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { type ReactNode } from 'react'

import Table, { type Column } from '../../../components/Table'
import type { StudentActivityProgress, StudentProgress } from '../../../models/teacherDashboard'
import type { StudentSituation } from '../hooks/useTeacherDashboard'
import PerformanceBadge from './PerformanceBadge'

/* ------------------------------------------------
   StudentProgressTable — panel docente

   Seguimiento de los estudiantes: situación general y
   avance en el marco teórico y los talleres 1 a 4. Usa la
   tabla global (tarjetas en móvil).
   ------------------------------------------------ */

interface StudentProgressTableProps {
  students: StudentProgress[]
  /** Situación de cada estudiante (viene del hook). */
  getSituation: (student: StudentProgress) => StudentSituation
  isLoading: boolean
  emptyMessage: string
}

/** Fila de la tabla: un estudiante con sus 5 actividades ya separadas. */
type Row = {
  id: string
  student: StudentProgress
  situation: StudentSituation
  theory: StudentActivityProgress
  workshop1: StudentActivityProgress
  workshop2: StudentActivityProgress
  workshop3: StudentActivityProgress
  workshop4: StudentActivityProgress
}

/** Etiqueta e ícono de cada situación. */
const SITUATION_INFO: Record<StudentSituation, { label: string; icon: ReactNode; className: string }> = {
  overdue: {
    label: 'Plazo vencido',
    icon: <AlertCircle size={14} />,
    className: 'border border-texto/40 bg-bg text-texto',
  },
  'in-progress': {
    label: 'En curso',
    icon: <Clock size={14} />,
    className: 'bg-primary/10 text-primary',
  },
  completed: {
    label: 'Completado',
    icon: <CheckCircle2 size={14} />,
    className: 'bg-accent-ia/10 text-accent-ia',
  },
}

/**
 * Situación del estudiante. Va con ícono y texto, y sin rojo: el rojo
 * es solo para el desempeño reprobado (AI_GUIDELINES §4).
 */
function SituationBadge({ situation }: { situation: StudentSituation }) {
  const { label, icon, className } = SITUATION_INFO[situation]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  )
}

/** Celda de una actividad: estado, nota (si tiene) e intentos usados. */
function ActivityCell({ activity }: { activity: StudentActivityProgress }) {
  return (
    <span className="inline-flex flex-col items-end gap-0.5 md:items-start">
      <PerformanceBadge status={activity.status} />
      {activity.grade !== null && (
        <span className="text-xs text-texto/70">Nota {activity.grade.toFixed(1)}</span>
      )}
      <span className="text-xs text-texto/60">
        Intentos {activity.attemptsUsed} de {activity.maxAttempts}
      </span>
    </span>
  )
}

/** Columna de una actividad: cambia solo su título y la actividad que muestra. */
function activityColumn(
  key: 'theory' | 'workshop1' | 'workshop2' | 'workshop3' | 'workshop4',
  label: string,
): Column<Row> {
  return {
    key,
    label,
    render: (_, row) => <ActivityCell activity={row[key]} />,
  }
}

const columns: Column<Row>[] = [
  {
    key: 'student',
    label: 'Estudiante',
    render: (_, row) => (
      <span className="flex flex-col items-end md:items-start">
        <span className="font-medium text-texto">{row.student.alias}</span>
        <span className="break-all text-xs text-texto/60">{row.student.email}</span>
      </span>
    ),
  },
  {
    key: 'situation',
    label: 'Situación',
    render: (_, row) => <SituationBadge situation={row.situation} />,
  },
  activityColumn('theory', 'Marco teórico'),
  activityColumn('workshop1', 'Taller 1'),
  activityColumn('workshop2', 'Taller 2'),
  activityColumn('workshop3', 'Taller 3'),
  activityColumn('workshop4', 'Taller 4'),
]

export default function StudentProgressTable({
  students,
  getSituation,
  isLoading,
  emptyMessage,
}: StudentProgressTableProps) {
  // Cada estudiante trae sus 5 actividades en orden: marco teórico y talleres 1 a 4.
  const rows: Row[] = students.map((student) => {
    const [theory, workshop1, workshop2, workshop3, workshop4] = student.activities
    return {
      id: student.id,
      student,
      situation: getSituation(student),
      theory,
      workshop1,
      workshop2,
      workshop3,
      workshop4,
    }
  })

  return <Table columns={columns} data={rows} isLoading={isLoading} emptyMessage={emptyMessage} rowKey="id" />
}
