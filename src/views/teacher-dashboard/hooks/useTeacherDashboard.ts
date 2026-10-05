/**
 * @module views/teacher-dashboard/hooks/useTeacherDashboard
 *
 * Aquí vive toda la lógica del panel principal del profesor guía.
 * La vista y los componentes solo muestran lo que este hook les entrega.
 *
 * El hook:
 *  - carga el avance de los estudiantes desde el servicio,
 *  - calcula los números de las tarjetas de resumen,
 *  - clasifica a cada estudiante según su situación y aplica el filtro.
 *
 * Situación de un estudiante (se evalúa en este orden):
 *  - `overdue`: tiene alguna actividad con plazo vencido que no entregó.
 *  - `completed`: todas sus actividades están aprobadas.
 *  - `in-progress`: el resto (va al día, con actividades por entregar).
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';

import type {
  StudentActivityProgress,
  StudentFilter,
  StudentProgress,
  TeacherDashboardSummary,
} from '../../../models/teacherDashboard';
import { teacherDashboardService } from '../../../services/teacherDashboardService';
import { getDeadlineStatus } from '../../../utils/workPacingDates';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

/** Situación de un estudiante (todos los filtros menos "all"). */
export type StudentSituation = Exclude<StudentFilter, 'all'>;

/** Todo lo que el hook le entrega a la vista. */
export interface UseTeacherDashboardReturn {
  /** Estudiantes que cumplen el filtro elegido. */
  students: StudentProgress[];
  /** Números de las tarjetas de resumen (de todos los estudiantes). */
  summary: TeacherDashboardSummary;
  /** Cuántos estudiantes hay en cada filtro, para mostrarlo en los botones. */
  filterCounts: Record<StudentFilter, number>;
  /** Filtro elegido ahora. */
  filter: StudentFilter;
  setFilter: (filter: StudentFilter) => void;
  /** Situación de un estudiante (para mostrar su etiqueta en la tabla). */
  getSituation: (student: StudentProgress) => StudentSituation;
  /** Fecha de la última carga en formato ISO (null si aún no carga). */
  generatedAt: string | null;

  /** true mientras se cargan los datos por primera vez o al reintentar. */
  isLoading: boolean;
  /** Mensaje si la carga falló (null si todo va bien). */
  error: string | null;
  /** Vuelve a intentar la carga. */
  retry: () => Promise<void>;
  /** true si ya cargó bien pero no hay estudiantes en seguimiento. */
  isEmpty: boolean;
}

// ─────────────────────────────────────────────
// Funciones auxiliares
// ─────────────────────────────────────────────

/** Resumen en cero: se usa mientras carga o cuando no hay estudiantes. */
const EMPTY_SUMMARY: TeacherDashboardSummary = {
  totalStudents: 0,
  theoryApprovedCount: 0,
  submittedWorkshopsCount: 0,
  overdueStudentsCount: 0,
};

/** true si el plazo de la actividad ya pasó y el estudiante no la entregó. */
function isActivityOverdue(activity: StudentActivityProgress, now: Date): boolean {
  if (activity.status !== 'not-submitted') return false;
  return getDeadlineStatus(activity.deadline, now).status === 'overdue';
}

/** Clasifica al estudiante: atrasado, completado o en curso. */
function getStudentSituation(student: StudentProgress, now: Date): StudentSituation {
  if (student.activities.some((activity) => isActivityOverdue(activity, now))) return 'overdue';

  const allApproved = student.activities.every(
    (activity) => activity.status === 'approved' || activity.status === 'excellent',
  );
  return allApproved ? 'completed' : 'in-progress';
}

/** Calcula los números de las tarjetas de resumen. */
function computeSummary(students: StudentProgress[], now: Date): TeacherDashboardSummary {
  let theoryApprovedCount = 0;
  let submittedWorkshopsCount = 0;
  let overdueStudentsCount = 0;

  for (const student of students) {
    for (const activity of student.activities) {
      // Los talleres tienen un id que empieza con "workshop-"; el otro es el marco teórico.
      const isWorkshop = activity.activityId.startsWith('workshop-');

      if (!isWorkshop && activity.status === 'approved') theoryApprovedCount++;
      if (isWorkshop && activity.status !== 'not-submitted') submittedWorkshopsCount++;
    }
    if (getStudentSituation(student, now) === 'overdue') overdueStudentsCount++;
  }

  return {
    totalStudents: students.length,
    theoryApprovedCount,
    submittedWorkshopsCount,
    overdueStudentsCount,
  };
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useTeacherDashboard(): UseTeacherDashboardReturn {
  const [allStudents, setAllStudents] = useState<StudentProgress[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [filter, setFilter] = useState<StudentFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cuenta las cargas que se han pedido. Si llega una respuesta de una carga
  // vieja, la ignoramos (así una respuesta lenta no pisa a una más nueva).
  const latestRequestRef = useRef(0);

  // ── Carga ──────────────────────────────────

  /** Pide al servicio el avance de los estudiantes. */
  const load = useCallback(async () => {
    // Anota que esta es la carga más reciente.
    const requestId = ++latestRequestRef.current;

    try {
      setIsLoading(true);
      setError(null);

      const data = await teacherDashboardService.fetchDashboard();

      // Si mientras esperábamos se pidió otra carga, esta ya no sirve.
      if (requestId !== latestRequestRef.current) return;

      setAllStudents(data.students);
      setGeneratedAt(data.generatedAt);
    } catch {
      if (requestId !== latestRequestRef.current) return;
      setError(
        'No se pudo cargar el avance de los estudiantes. ' +
        'Verifica tu conexión e intenta nuevamente.',
      );
    } finally {
      // Solo la carga más reciente apaga el indicador de "cargando".
      if (requestId === latestRequestRef.current) setIsLoading(false);
    }
  }, []);

  // Carga los datos una vez, cuando se abre el panel.
  useEffect(() => {
    load();
  }, [load]);

  // ── Datos calculados ───────────────────────

  // Se recalculan solo cuando cambian los estudiantes o el filtro.
  const { summary, filterCounts, students } = useMemo(() => {
    const now = new Date();

    // Situación de cada estudiante, calculada una sola vez.
    const situations = new Map<string, StudentSituation>(
      allStudents.map((student) => [student.id, getStudentSituation(student, now)]),
    );

    const countBy = (situation: StudentSituation) =>
      allStudents.filter((student) => situations.get(student.id) === situation).length;

    return {
      summary: allStudents.length > 0 ? computeSummary(allStudents, now) : EMPTY_SUMMARY,
      filterCounts: {
        all: allStudents.length,
        overdue: countBy('overdue'),
        'in-progress': countBy('in-progress'),
        completed: countBy('completed'),
      } satisfies Record<StudentFilter, number>,
      students:
        filter === 'all'
          ? allStudents
          : allStudents.filter((student) => situations.get(student.id) === filter),
    };
  }, [allStudents, filter]);

  /** Situación de un estudiante, para que la tabla muestre su etiqueta. */
  const getSituation = useCallback(
    (student: StudentProgress) => getStudentSituation(student, new Date()),
    [],
  );

  return {
    students,
    summary,
    filterCounts,
    filter,
    setFilter,
    getSituation,
    generatedAt,
    isLoading,
    error,
    retry: load,
    isEmpty: !isLoading && error === null && allStudents.length === 0,
  };
}
