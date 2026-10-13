/**
 * @module services/studentEvaluationService
 *
 * Lee y guarda en Cloud Firestore la nota y el resultado de los talleres.
 *
 * Las evaluaciones viven en la colección `evaluations`, con un documento por
 * estudiante (el id es su correo en minúsculas). Ver
 * `models/studentEvaluation.ts`.
 *
 * Lo usan:
 * - la revisión de reflexiones (`/docente/reflexiones`), que guarda la nota
 *   cuando el profesor valida una reflexión;
 * - el panel docente (`/docente`), que las lee para mostrar el seguimiento.
 *
 * Regla R4 (AI_GUIDELINES §9): las vistas y componentes NO llaman
 * a la API directamente; lo hacen a través de un servicio (vía hook).
 *
 * Los permisos los aplican las reglas de seguridad de Firestore: solo un
 * profesor guía activo puede escribir aquí.
 */

import { collection, doc, getDocs, setDoc } from 'firebase/firestore';

import {
  EVALUATIONS_COLLECTION,
  type WorkshopEvaluation,
} from '../models/studentEvaluation';
import { PROGRESS_WORKSHOP_IDS } from '../models/studentProgress';
import { GRADE_THRESHOLDS } from '../models/teacherDashboard';
import { firestoreDb } from './firebase';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

/** Evaluaciones de un estudiante, indexadas por el id del taller. */
export type WorkshopEvaluations = Map<string, WorkshopEvaluation>;

/** Datos para guardar la nota de un taller. */
export interface SaveWorkshopGradePayload {
  /** Correo institucional del estudiante. */
  email: string;
  /** Id del taller ("workshop-1" a "workshop-4"). */
  workshopId: string;
  /** Nota de 1.0 a 7.0. */
  grade: number;
}

// ─────────────────────────────────────────────
// Funciones auxiliares
// ─────────────────────────────────────────────

/** Devuelve la base de datos o lanza un error si Firebase no está configurado. */
function getDatabase() {
  if (!firestoreDb) {
    throw new Error('Firebase no está configurado. Revisa las variables VITE_FIREBASE_*.');
  }
  return firestoreDb;
}

/** Indica si un valor es un objeto (y no null ni un arreglo). */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Indica si el id corresponde a uno de los 4 talleres. */
function isWorkshopId(workshopId: string): boolean {
  return (PROGRESS_WORKSHOP_IDS as readonly string[]).includes(workshopId);
}

/**
 * Interpreta la evaluación de un taller tal como viene de Firestore.
 *
 * Los documentos se pueden cargar a mano, así que pueden venir incompletos:
 * un campo mal escrito queda en null en vez de dar error.
 */
function parseWorkshopEvaluation(value: unknown): WorkshopEvaluation | null {
  if (!isRecord(value)) return null;

  return {
    grade: typeof value.grade === 'number' && Number.isFinite(value.grade) ? value.grade : null,
    outcome: value.outcome === 'approved' || value.outcome === 'failed' ? value.outcome : null,
    evaluatedAt: typeof value.evaluatedAt === 'string' ? value.evaluatedAt : null,
  };
}

// ─────────────────────────────────────────────
// Servicio público
// ─────────────────────────────────────────────

/** Operaciones de las evaluaciones de talleres. */
export const studentEvaluationService = {
  /**
   * Devuelve las evaluaciones de todos los estudiantes, en un Map
   * (correo → evaluaciones por taller). Un estudiante sin documento, o un
   * taller sin evaluar, simplemente no aparece.
   */
  async fetchAll(): Promise<Map<string, WorkshopEvaluations>> {
    const snapshot = await getDocs(collection(getDatabase(), EVALUATIONS_COLLECTION));
    const byEmail = new Map<string, WorkshopEvaluations>();

    for (const item of snapshot.docs) {
      const workshops: unknown = item.data().workshops;
      if (!isRecord(workshops)) continue;

      const evaluations: WorkshopEvaluations = new Map();
      for (const workshopId of PROGRESS_WORKSHOP_IDS) {
        const evaluation = parseWorkshopEvaluation(workshops[workshopId]);
        if (evaluation) evaluations.set(workshopId, evaluation);
      }
      byEmail.set(item.id, evaluations);
    }

    return byEmail;
  },

  /**
   * Guarda la nota de un taller de un estudiante y devuelve la evaluación
   * que quedó registrada.
   *
   * El resultado se calcula a partir de la nota: desde 4.0 es aprobado y
   * bajo 4.0 es reprobado. Si el taller ya tenía nota, se reemplaza; las
   * notas de los otros talleres del estudiante no se tocan.
   *
   * @throws Error si el taller no existe o la nota no está entre 1.0 y 7.0.
   */
  async saveWorkshopGrade(payload: SaveWorkshopGradePayload): Promise<WorkshopEvaluation> {
    const email = payload.email.trim().toLowerCase();
    const { workshopId, grade } = payload;

    if (!isWorkshopId(workshopId)) {
      throw new Error(`El taller "${workshopId}" no existe.`);
    }
    if (!Number.isFinite(grade) || grade < GRADE_THRESHOLDS.min || grade > GRADE_THRESHOLDS.max) {
      throw new Error('La nota debe estar entre 1.0 y 7.0.');
    }

    const now = new Date().toISOString();
    const evaluation: WorkshopEvaluation = {
      grade,
      outcome: grade >= GRADE_THRESHOLDS.approved ? 'approved' : 'failed',
      evaluatedAt: now,
    };

    // `merge: true` une estos datos con el documento que ya exista: solo
    // cambia el taller indicado y la fecha de actualización.
    await setDoc(
      doc(getDatabase(), EVALUATIONS_COLLECTION, email),
      { email, updatedAt: now, workshops: { [workshopId]: evaluation } },
      { merge: true },
    );

    return evaluation;
  },
};
