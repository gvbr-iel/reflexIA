/**
 * @module models/teacherDashboard
 *
 * Tipos y constantes del panel principal del profesor guía (`/docente`).
 *
 * El panel muestra el seguimiento semanal de los estudiantes: quién aprobó
 * el marco teórico, cómo van sus talleres y quién tiene plazos vencidos.
 *
 * Las actividades usan los mismos ids que `models/workPacing.ts`
 * ("theory-quiz" y "workshop-1" a "workshop-4"), así el panel y la
 * configuración de plazos hablan de las mismas actividades.
 *
 * Privacidad (AI_GUIDELINES §8): no hay nombres reales ni RUT. Cada
 * estudiante se identifica solo con un alias ("Estudiante 01") y su
 * correo institucional.
 */

// ─────────────────────────────────────────────
// Desempeño
// ─────────────────────────────────────────────

/**
 * Estado de desempeño de una actividad. Sigue los colores de la rueda
 * (AI_GUIDELINES §4):
 * - `not-submitted`: no entregado (gris)
 * - `failed`: reprobado, nota de 1.1 a 3.9 (rojo, solo como color semántico)
 * - `approved`: aprobado, nota de 4.0 a 4.9 (azul verdoso)
 * - `excellent`: sobresaliente, nota de 5.0 a 7.0 (verde esmeralda)
 */
export type PerformanceStatus = 'not-submitted' | 'failed' | 'approved' | 'excellent';

/** Notas que separan cada estado de desempeño (escala de 1.0 a 7.0). */
export const GRADE_THRESHOLDS = {
  /** Nota más baja posible: también es la de un taller no entregado. */
  min: 1.0,
  /** Desde esta nota se aprueba. */
  approved: 4.0,
  /** Desde esta nota es sobresaliente. */
  excellent: 5.0,
  /** Nota más alta posible. */
  max: 7.0,
} as const;

// ─────────────────────────────────────────────
// Estudiantes
// ─────────────────────────────────────────────

/** Avance de un estudiante en una actividad (marco teórico o taller). */
export interface StudentActivityProgress {
  /** Id de la actividad: "theory-quiz" o "workshop-1" a "workshop-4". */
  activityId: string;
  /** Título corto de la actividad (e.g. "Taller 1"). */
  title: string;
  status: PerformanceStatus;
  /**
   * Nota de 1.0 a 7.0. Es null si no se entregó, y también en el marco
   * teórico, que solo se marca como aprobado o no.
   */
  grade: number | null;
  /** Intentos de revisión que el estudiante ya usó. */
  attemptsUsed: number;
  /** Máximo de intentos permitidos para esta actividad. */
  maxAttempts: number;
  /** Fecha límite en formato YYYY-MM-DD (null si no tiene plazo). */
  deadline: string | null;
}

/** Fila del seguimiento: un estudiante con su avance en las 5 actividades. */
export interface StudentProgress {
  /** Identificador interno del estudiante. */
  id: string;
  /** Nombre ficticio para mostrar (e.g. "Estudiante 01"). Nunca un nombre real. */
  alias: string;
  /** Correo institucional (@ucen.cl). */
  email: string;
  /** Las 5 actividades en orden: marco teórico y talleres 1 a 4. */
  activities: StudentActivityProgress[];
}

// ─────────────────────────────────────────────
// Resumen y filtros
// ─────────────────────────────────────────────

/** Números de las tarjetas de resumen que van arriba del panel. */
export interface TeacherDashboardSummary {
  /** Estudiantes en seguimiento. */
  totalStudents: number;
  /** Estudiantes que ya aprobaron el marco teórico. */
  theoryApprovedCount: number;
  /** Talleres entregados entre todos los estudiantes. */
  submittedWorkshopsCount: number;
  /** Estudiantes con al menos una actividad con plazo vencido sin entregar. */
  overdueStudentsCount: number;
}

/**
 * Filtro de la tabla por situación del estudiante:
 * - `all`: todos
 * - `overdue`: con algún plazo vencido sin entregar
 * - `in-progress`: al día, con actividades aún por entregar
 * - `completed`: entregó todas las actividades
 */
export type StudentFilter = 'all' | 'overdue' | 'in-progress' | 'completed';

/** Datos que entrega el servicio al panel. */
export interface TeacherDashboardData {
  students: StudentProgress[];
  /** Marca temporal ISO 8601 de cuándo se generaron los datos. */
  generatedAt: string;
}
