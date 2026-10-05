/**
 * @module views/critical-incidents/dev/theoryApprovalSimulator
 *
 * Utilidad SOLO PARA DESARROLLO: simula que el estudiante aprobó (o no)
 * el marco teórico de HU-04, para poder probar HU-03 mientras la vista
 * del cuestionario no esté integrada.
 *
 * Acoplamiento conocido: escribe en la misma clave de localStorage que
 * usa `theoryQuizService` (STORAGE_KEYS.APPROVAL). Si ese servicio
 * cambia de clave o pasa a un backend real, este archivo deja de tener
 * efecto y se elimina junto con `DevTheoryToggle`. El resto del feature
 * no depende de él.
 */

import type { TheoryApprovalStatus } from '../../../models/theoryQuiz';
import { getUserStorageKey } from '../../../utils/userStorage';

/** Misma clave que `theoryQuizService` (STORAGE_KEYS.APPROVAL). */
const THEORY_APPROVAL_KEY = 'reflexia_theory_approval';

/**
 * Marca el marco teórico como aprobado o como no aprobado.
 * "No aprobado" elimina la clave, que es el estado inicial real.
 */
export function setSimulatedTheoryApproval(approved: boolean): void {
  const storageKey = getUserStorageKey(THEORY_APPROVAL_KEY);
  if (!storageKey) return;

  if (!approved) {
    localStorage.removeItem(storageKey);
    return;
  }

  const status: TheoryApprovalStatus = {
    isApproved: true,
    result: {
      passed: true,
      bestScore: 10,
      totalQuestions: 10,
      bestScorePercentage: 100,
      attemptsUsed: 1,
      maxAttempts: 3,
      hasAttemptsRemaining: true,
    },
    approvedAt: new Date().toISOString(),
  };

  localStorage.setItem(storageKey, JSON.stringify(status));
}
