/**
 * @module services/studentProgressService
 *
 * Publica en Cloud Firestore el resumen de avance del estudiante, para que
 * el profesor guía lo vea en el panel docente (`/docente`).
 *
 * El resumen vive en la colección `progress`, con un documento por estudiante
 * (el id es su correo en minúsculas). Ver `models/studentProgress.ts`.
 *
 * Cómo funciona: los borradores, intentos y la aprobación siguen guardándose
 * en el almacenamiento local del estudiante. Este servicio lee ese estado
 * local, arma el resumen y lo sube. Así los servicios de talleres y marco
 * teórico solo tienen que avisar "algo cambió" llamando a `sync()`.
 *
 * Reglas de este servicio:
 * - Solo sube números y estados, nunca el texto de los relatos.
 * - Si no hay sesión, si Firebase no está configurado o si falla la red, no
 *   lanza error: el estudiante no debe notar nada. El resumen se vuelve a
 *   intentar en el próximo cambio.
 * - No vuelve a escribir si el resumen no cambió (así el autoguardado de
 *   borradores no genera una escritura en cada guardado).
 *
 * Los permisos los aplican las reglas de seguridad de Firestore.
 */

import { doc, setDoc } from 'firebase/firestore';

import type { TheoryApprovalStatus } from '../models/theoryQuiz';
import {
  PROGRESS_COLLECTION,
  PROGRESS_WORKSHOP_IDS,
  type ProgressWorkshopId,
  type StudentProgressSummary,
  type WorkshopProgressSummary,
} from '../models/studentProgress';
import { readUserStorage } from '../utils/userStorage';
import { firebaseAuth, firestoreDb } from './firebase';

// ─────────────────────────────────────────────
// Claves del almacenamiento local
// ─────────────────────────────────────────────
// Son las mismas claves que usan `theoryQuizService` y
// `criticalIncidentService`. Si cambian allá, hay que cambiarlas aquí.
// Se repiten (en vez de importarlas) para que estos servicios puedan llamar
// a este sin que se importen entre sí en círculo.

const STORAGE_KEYS = {
  THEORY_ATTEMPTS: 'reflexia_theory_attempts',
  THEORY_APPROVAL: 'reflexia_theory_approval',
  INCIDENT_DRAFTS: 'reflexia_incident_drafts',
  INCIDENT_ATTEMPTS: 'reflexia_incident_attempts',
} as const;

// ─────────────────────────────────────────────
// Estado interno
// ─────────────────────────────────────────────

/**
 * Último resumen subido por cada correo (sin la fecha), en formato texto.
 * Sirve para no escribir dos veces lo mismo durante la sesión.
 */
const lastPublished = new Map<string, string>();

// ─────────────────────────────────────────────
// Funciones auxiliares
// ─────────────────────────────────────────────

/** Lee el estado local del estudiante y arma el resumen, sin la fecha. */
function buildSummary(): Omit<StudentProgressSummary, 'email' | 'updatedAt'> {
  const approval = readUserStorage<TheoryApprovalStatus>(STORAGE_KEYS.THEORY_APPROVAL);
  const theoryAttempts = readUserStorage<unknown[]>(STORAGE_KEYS.THEORY_ATTEMPTS) ?? [];
  const drafts =
    readUserStorage<Record<string, unknown>>(STORAGE_KEYS.INCIDENT_DRAFTS) ?? {};
  const attempts =
    readUserStorage<Record<string, unknown[]>>(STORAGE_KEYS.INCIDENT_ATTEMPTS) ?? {};

  const workshops = {} as Record<ProgressWorkshopId, WorkshopProgressSummary>;
  for (const id of PROGRESS_WORKSHOP_IDS) {
    workshops[id] = {
      attemptsUsed: attempts[id]?.length ?? 0,
      hasDraft: Boolean(drafts[id]),
    };
  }

  return {
    theory: {
      isApproved: approval?.isApproved ?? false,
      attemptsUsed: approval?.result?.attemptsUsed ?? theoryAttempts.length,
      bestScorePercentage: approval?.result?.bestScorePercentage ?? null,
      approvedAt: approval?.approvedAt ?? null,
    },
    workshops,
  };
}

// ─────────────────────────────────────────────
// Servicio público
// ─────────────────────────────────────────────

/** Operaciones del resumen de avance. Los hooks y servicios llaman a este objeto. */
export const studentProgressService = {
  /**
   * Sube el resumen de avance del estudiante con sesión abierta.
   *
   * Nunca lanza error: si algo falla, solo avisa en la consola. Quien la
   * llama no necesita esperarla (`void studentProgressService.sync()`).
   */
  async sync(): Promise<void> {
    try {
      const email = firebaseAuth?.currentUser?.email?.toLowerCase();
      if (!firestoreDb || !email) return;

      const summary = buildSummary();
      const fingerprint = JSON.stringify(summary);
      if (lastPublished.get(email) === fingerprint) return;

      const document: StudentProgressSummary = {
        email,
        ...summary,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(firestoreDb, PROGRESS_COLLECTION, email), document);

      // Solo se anota como subido si la escritura salió bien.
      lastPublished.set(email, fingerprint);
    } catch (error) {
      console.warn('No se pudo publicar el avance del estudiante:', error);
    }
  },
};
