/**
 * @module services/teacherDashboardService
 *
 * Capa de servicio del panel principal del profesor guía (`/docente`).
 *
 * Responsabilidad:
 * - Entregar el avance de los estudiantes en el marco teórico y los talleres.
 *
 * Estado actual: **mock local con datos ficticios**.
 * Los avances de los estudiantes viven en el localStorage de cada uno, así
 * que el profesor todavía no puede leerlos. Cuando exista el backend, se
 * reemplaza el cuerpo de `fetchDashboard` por una llamada Axios/Fetch sin
 * cambiar la firma pública.
 *
 * Regla R4 (AI_GUIDELINES §9): las vistas y componentes NO llaman
 * a la API directamente; lo hacen a través de este servicio (vía hook).
 *
 * Privacidad (AI_GUIDELINES §8): los estudiantes son ficticios, con alias
 * y sin nombres reales ni RUT.
 */

import { DEFAULT_WORKSHOP_CONFIG } from '../models/criticalIncident';
import { THEORY_ACTIVITY_ID } from '../models/workPacing';
import { DEFAULT_QUIZ_CONFIG } from '../models/theoryQuiz';
import type {
  PerformanceStatus,
  StudentActivityProgress,
  StudentProgress,
  TeacherDashboardData,
} from '../models/teacherDashboard';
import { getPerformanceStatus } from '../utils/performanceStatus';

/** Latencia simulada para que se vean los estados de carga. */
const MOCK_LATENCY_MS = 600;

/** Espera `ms` milisegundos; simula el tiempo de respuesta de un servidor. */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────
// Datos ficticios
// ─────────────────────────────────────────────

/**
 * Plazos de los talleres 1 a 4, en días desde hoy (negativo = ya pasó).
 * Son relativos a hoy para que la demo siempre muestre plazos vencidos,
 * próximos y lejanos, sin importar la fecha en que se abra.
 */
const WORKSHOP_DEADLINE_OFFSETS = [-10, -3, 4, 11];

/** Resultado del marco teórico de un estudiante ficticio. */
type TheoryOutcome = 'approved' | 'failed' | 'pending';

/** Resultado de un taller: nota (null si no entregó) e intentos usados. */
type WorkshopOutcome = [grade: number | null, attemptsUsed: number];

/** Datos de partida de un estudiante ficticio. */
interface StudentSeed {
  theory: TheoryOutcome;
  /** Intentos usados en el marco teórico. */
  theoryAttempts: number;
  /** Los 4 talleres, en orden. */
  workshops: [WorkshopOutcome, WorkshopOutcome, WorkshopOutcome, WorkshopOutcome];
}

const NONE: WorkshopOutcome = [null, 0];

/** 8 estudiantes con distintas situaciones: completo, al día, atrasado, reprobado. */
const STUDENT_SEEDS: StudentSeed[] = [
  // 01: al día, entregó los talleres que ya vencieron y el 3 está en curso.
  { theory: 'approved', theoryAttempts: 1, workshops: [[6.2, 1], [5.5, 2], [4.5, 1], NONE] },
  // 02: terminó todo con buenas notas.
  { theory: 'approved', theoryAttempts: 1, workshops: [[6.5, 1], [6.0, 1], [5.8, 2], [6.8, 1]] },
  // 03: reprobó el taller 1 y no entregó el 2 (plazo vencido).
  { theory: 'approved', theoryAttempts: 2, workshops: [[3.5, 3], NONE, NONE, NONE] },
  // 04: no aprobó el marco teórico y no avanzó (plazos vencidos).
  { theory: 'failed', theoryAttempts: 3, workshops: [NONE, NONE, NONE, NONE] },
  // 05: entregó el taller 1 con lo justo y no entregó el 2 (plazo vencido).
  { theory: 'approved', theoryAttempts: 1, workshops: [[4.2, 2], NONE, NONE, NONE] },
  // 06: terminó todo, con notas aprobadas.
  { theory: 'approved', theoryAttempts: 2, workshops: [[5.0, 2], [4.0, 3], [4.4, 2], [5.1, 1]] },
  // 07: aprobó el marco teórico, pero no entregó ningún taller (plazos vencidos).
  { theory: 'approved', theoryAttempts: 1, workshops: [NONE, NONE, NONE, NONE] },
  // 08: al día, con el taller 3 aún por entregar.
  { theory: 'approved', theoryAttempts: 1, workshops: [[6.1, 1], [5.9, 1], NONE, NONE] },
];

// ─────────────────────────────────────────────
// Construcción de los datos
// ─────────────────────────────────────────────

/** Fecha "YYYY-MM-DD" de hoy más (o menos) la cantidad de días indicada. */
function dateFromToday(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Estado del marco teórico, que no tiene nota: solo aprobado o no. */
function getTheoryStatus(theory: TheoryOutcome): PerformanceStatus {
  if (theory === 'approved') return 'approved';
  if (theory === 'failed') return 'failed';
  return 'not-submitted';
}

/** Arma las 5 actividades de un estudiante (marco teórico y talleres 1 a 4). */
function buildActivities(seed: StudentSeed): StudentActivityProgress[] {
  const theory: StudentActivityProgress = {
    activityId: THEORY_ACTIVITY_ID,
    title: 'Marco teórico',
    status: getTheoryStatus(seed.theory),
    grade: null,
    attemptsUsed: seed.theoryAttempts,
    maxAttempts: DEFAULT_QUIZ_CONFIG.maxAttempts,
    // El marco teórico no tiene plazo por defecto.
    deadline: null,
  };

  const workshops = seed.workshops.map(([grade, attemptsUsed], index): StudentActivityProgress => ({
    activityId: `workshop-${index + 1}`,
    title: `Taller ${index + 1}`,
    status: getPerformanceStatus(grade),
    grade,
    attemptsUsed,
    maxAttempts: DEFAULT_WORKSHOP_CONFIG.maxAttemptsPerWorkshop,
    deadline: dateFromToday(WORKSHOP_DEADLINE_OFFSETS[index]),
  }));

  return [theory, ...workshops];
}

/** Convierte los datos de partida en la lista de estudiantes. */
function buildStudents(): StudentProgress[] {
  return STUDENT_SEEDS.map((seed, index) => {
    const number = String(index + 1).padStart(2, '0');
    return {
      id: `student-${number}`,
      alias: `Estudiante ${number}`,
      email: `estudiante${number}@ucen.cl`,
      activities: buildActivities(seed),
    };
  });
}

// ─────────────────────────────────────────────
// Servicio público
// ─────────────────────────────────────────────

/**
 * Servicio del panel docente.
 *
 * Firma estable: cuando el backend esté listo, se reemplaza el cuerpo
 * de cada método sin cambiar la interfaz pública.
 */
export const teacherDashboardService = {

  /**
   * Devuelve el avance de todos los estudiantes del profesor guía.
   *
   * Producción: GET /api/teacher/dashboard
   */
  async fetchDashboard(): Promise<TeacherDashboardData> {
    // TODO: Reemplazar por llamada Axios al backend
    // return axios.get<TeacherDashboardData>('/api/teacher/dashboard');
    await wait(MOCK_LATENCY_MS);

    return { students: buildStudents(), generatedAt: new Date().toISOString() };
  },
};
