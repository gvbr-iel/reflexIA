/**
 * @module services/teacherDashboardService
 *
 * Capa de servicio del panel principal del profesor guía (`/docente`).
 *
 * Responsabilidad:
 * - Entregar el avance de los estudiantes en el marco teórico y los talleres.
 *
 * Los datos salen de Cloud Firestore y se cruzan por el correo del estudiante:
 * - `whitelist`: quiénes son los estudiantes con acceso activo.
 * - `progress`: su avance (marco teórico, intentos, borradores). Lo publica
 *   cada estudiante desde la app (ver `studentProgressService`).
 * - `profiles`: su nombre. Por ahora se carga a mano.
 * - `evaluations`: la nota y el resultado de cada taller. Por ahora se carga
 *   a mano, hasta que la pantalla de reflexiones los guarde.
 *
 * Un estudiante sin `progress`, `profiles` o `evaluations` igual aparece:
 * con sus actividades como "no entregado" y, sin perfil, sin nombre.
 *
 * Regla R4 (AI_GUIDELINES §9): las vistas y componentes NO llaman
 * a la API directamente; lo hacen a través de este servicio (vía hook).
 *
 * Los permisos los aplican las reglas de seguridad de Firestore.
 */

import { collection, getDocs } from 'firebase/firestore';

import { DEFAULT_QUIZ_CONFIG } from '../models/theoryQuiz';
import { EVALUATIONS_COLLECTION } from '../models/studentEvaluation';
import { PROGRESS_COLLECTION } from '../models/studentProgress';
import { THEORY_ACTIVITY_ID } from '../models/workPacing';
import {
  GRADE_THRESHOLDS,
  type PerformanceStatus,
  type StudentActivityProgress,
  type StudentProgress,
  type TeacherDashboardData,
} from '../models/teacherDashboard';
import type { WhitelistEntry } from '../models/whitelist';
import { getPerformanceStatus } from '../utils/performanceStatus';
import { criticalIncidentService } from './criticalIncidentService';
import { firestoreDb } from './firebase';
import { studentProfileService } from './studentProfileService';
import { whitelistService } from './whitelistService';

// ─────────────────────────────────────────────
// Lectura de Firestore
// ─────────────────────────────────────────────

/** Contenido de un documento de Firestore, todavía sin revisar su forma. */
type RawDocument = Record<string, unknown>;

/** Indica si un valor es un objeto (y no null ni un arreglo). */
function isRecord(value: unknown): value is RawDocument {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Lee toda una colección y la devuelve como un Map (id del documento → datos). */
async function readCollection(name: string): Promise<Map<string, RawDocument>> {
  if (!firestoreDb) {
    throw new Error('Firebase no está configurado. Revisa las variables VITE_FIREBASE_*.');
  }
  const snapshot = await getDocs(collection(firestoreDb, name));
  return new Map(snapshot.docs.map((item) => [item.id, item.data()]));
}

// ─────────────────────────────────────────────
// Interpretación de los documentos
// ─────────────────────────────────────────────
// Los documentos de `evaluations` se pueden cargar a mano, así que pueden
// venir incompletos. Estas funciones toman solo lo que está bien escrito e
// ignoran el resto, en vez de romper todo el panel. Los nombres de `profiles`
// los lee `studentProfileService`, con el mismo criterio.

/** Avance del marco teórico que publicó el estudiante. */
interface TheoryProgress {
  isApproved: boolean;
  attemptsUsed: number;
}

/** Nota y resultado de un taller que puso el profesor. */
interface WorkshopEvaluationData {
  grade: number | null;
  outcome: 'approved' | 'failed' | null;
}

/** Devuelve el valor si es un número, y si no, el valor de respaldo. */
function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** Marco teórico del documento `progress` (sin avance si no existe). */
function readTheoryProgress(progress: RawDocument | undefined): TheoryProgress {
  const theory = progress?.theory;
  if (!isRecord(theory)) return { isApproved: false, attemptsUsed: 0 };

  return {
    isApproved: theory.isApproved === true,
    attemptsUsed: readNumber(theory.attemptsUsed, 0),
  };
}

/** Intentos de revisión usados en un taller, según el documento `progress`. */
function readWorkshopAttempts(progress: RawDocument | undefined, workshopId: string): number {
  const workshops = progress?.workshops;
  if (!isRecord(workshops)) return 0;

  const workshop = workshops[workshopId];
  return isRecord(workshop) ? readNumber(workshop.attemptsUsed, 0) : 0;
}

/** Nota y resultado de un taller, según el documento `evaluations` (null si no hay). */
function readWorkshopEvaluation(
  evaluation: RawDocument | undefined,
  workshopId: string,
): WorkshopEvaluationData | null {
  const workshops = evaluation?.workshops;
  if (!isRecord(workshops)) return null;

  const workshop = workshops[workshopId];
  if (!isRecord(workshop)) return null;

  const grade =
    typeof workshop.grade === 'number' && Number.isFinite(workshop.grade) ? workshop.grade : null;
  const outcome =
    workshop.outcome === 'approved' || workshop.outcome === 'failed' ? workshop.outcome : null;

  return { grade, outcome };
}

// ─────────────────────────────────────────────
// Construcción de los datos
// ─────────────────────────────────────────────

/**
 * Estado de desempeño de un taller.
 *
 * El resultado que marca el profesor manda: reprobado es reprobado y
 * aprobado es aprobado (o sobresaliente si la nota llega a 5.0). Si solo hay
 * nota, se usa la tabla de notas. Sin evaluación, el taller no se entregó.
 */
function getWorkshopStatus(evaluation: WorkshopEvaluationData | null): PerformanceStatus {
  if (!evaluation) return 'not-submitted';
  if (evaluation.outcome === 'failed') return 'failed';
  if (evaluation.outcome === 'approved') {
    const isExcellent = evaluation.grade !== null && evaluation.grade >= GRADE_THRESHOLDS.excellent;
    return isExcellent ? 'excellent' : 'approved';
  }
  return getPerformanceStatus(evaluation.grade);
}

/** Estado del marco teórico, que no tiene nota: solo aprobado, reprobado o sin entregar. */
function getTheoryStatus(theory: TheoryProgress): PerformanceStatus {
  if (theory.isApproved) return 'approved';
  // Sin intentos disponibles y sin aprobar: reprobó el marco teórico.
  if (theory.attemptsUsed >= DEFAULT_QUIZ_CONFIG.maxAttempts) return 'failed';
  return 'not-submitted';
}

/** Plazo e intentos máximos de un taller, tal como los ven hoy los estudiantes. */
interface WorkshopLimits {
  id: string;
  title: string;
  deadline: string | null;
  maxAttempts: number;
}

/** Arma las 5 actividades de un estudiante (marco teórico y talleres 1 a 4). */
function buildActivities(
  workshops: WorkshopLimits[],
  progress: RawDocument | undefined,
  evaluation: RawDocument | undefined,
): StudentActivityProgress[] {
  const theory = readTheoryProgress(progress);

  const theoryActivity: StudentActivityProgress = {
    activityId: THEORY_ACTIVITY_ID,
    title: 'Marco teórico',
    status: getTheoryStatus(theory),
    grade: null,
    attemptsUsed: theory.attemptsUsed,
    maxAttempts: DEFAULT_QUIZ_CONFIG.maxAttempts,
    // El marco teórico no tiene plazo por defecto.
    deadline: null,
  };

  const workshopActivities = workshops.map((workshop): StudentActivityProgress => {
    const workshopEvaluation = readWorkshopEvaluation(evaluation, workshop.id);
    return {
      activityId: workshop.id,
      title: workshop.title,
      status: getWorkshopStatus(workshopEvaluation),
      grade: workshopEvaluation?.grade ?? null,
      attemptsUsed: readWorkshopAttempts(progress, workshop.id),
      maxAttempts: workshop.maxAttempts,
      deadline: workshop.deadline,
    };
  });

  return [theoryActivity, ...workshopActivities];
}

/** Nombre con el que se ordena la lista: el nombre, o el correo si no tiene. */
function sortKey(student: StudentProgress): string {
  return student.name ?? student.email;
}

/** Une los datos de cada estudiante de la whitelist con su avance, nombre y notas. */
function buildStudents(
  entries: WhitelistEntry[],
  workshops: WorkshopLimits[],
  progressByEmail: Map<string, RawDocument>,
  nameByEmail: Map<string, string>,
  evaluationByEmail: Map<string, RawDocument>,
): StudentProgress[] {
  return entries
    .map((entry): StudentProgress => ({
      id: entry.email,
      name: nameByEmail.get(entry.email) ?? null,
      email: entry.email,
      activities: buildActivities(
        workshops,
        progressByEmail.get(entry.email),
        evaluationByEmail.get(entry.email),
      ),
    }))
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b), 'es'));
}

// ─────────────────────────────────────────────
// Servicio público
// ─────────────────────────────────────────────

/** Servicio del panel docente. Los hooks llaman a este objeto; las vistas no (regla R4). */
export const teacherDashboardService = {

  /**
   * Devuelve el avance de todos los estudiantes con acceso activo.
   *
   * Los plazos y los intentos máximos de los talleres son los que hoy ven los
   * estudiantes. Todavía no se lee la configuración que guarda el profesor en
   * `/docente/plazos` (queda pendiente junto con HU-06).
   */
  async fetchDashboard(): Promise<TeacherDashboardData> {
    const [students, progressByEmail, nameByEmail, evaluationByEmail, workshopDefaults] =
      await Promise.all([
        whitelistService.fetchActiveStudents(),
        readCollection(PROGRESS_COLLECTION),
        studentProfileService.fetchNames(),
        readCollection(EVALUATIONS_COLLECTION),
        criticalIncidentService.fetchWorkshopPacingDefaults(),
      ]);

    const workshops: WorkshopLimits[] = workshopDefaults
      .slice()
      .sort((a, b) => a.number - b.number)
      .map(({ id, title, deadline, maxAttempts }) => ({ id, title, deadline, maxAttempts }));

    return {
      students: buildStudents(
        students,
        workshops,
        progressByEmail,
        nameByEmail,
        evaluationByEmail,
      ),
      generatedAt: new Date().toISOString(),
    };
  },
};
