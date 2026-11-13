/**
 * Pruebas de la T3 del Lab 9 (CU-08): el servicio guarda la nota de cada
 * intento con el tope del bloque y rechaza los envíos que no corresponden.
 *
 * El almacenamiento por usuario se reemplaza por un Map en memoria y el
 * aviso al panel docente por una función vacía, así las pruebas no
 * necesitan navegador ni Firebase.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { QuizAttempt, SubmitAttemptPayload } from '../models/theoryQuiz';

const storage = new Map<string, unknown>();

vi.mock('../utils/userStorage', () => ({
  readUserStorage: (key: string) => (storage.has(key) ? structuredClone(storage.get(key)) : null),
  writeUserStorage: (key: string, value: unknown) => {
    storage.set(key, structuredClone(value));
  },
}));

vi.mock('./studentProgressService', () => ({
  studentProgressService: { sync: vi.fn(async () => undefined) },
}));

const { theoryQuizService, TheoryQuizSubmitError } = await import('./theoryQuizService');

const ATTEMPTS_KEY = 'reflexia_theory_attempts';
const APPROVAL_KEY = 'reflexia_theory_approval';

/**
 * Arma un envío con `correct` respuestas correctas de 10. Pide las
 * preguntas al servicio y elige la opción correcta o una incorrecta.
 */
async function payloadWith(correct: number, extra: Partial<SubmitAttemptPayload> = {}) {
  const { questions } = await theoryQuizService.fetchQuestions();
  const answers = questions.map((question, index) => ({
    questionId: question.id,
    selectedOptionId:
      index < correct
        ? question.correctOptionId
        : question.options.find((option) => option.id !== question.correctOptionId)!.id,
  }));
  return { answers, attemptNumber: 1, durationSeconds: 60, ...extra };
}

/** Rinde `count` intentos seguidos con `correct` aciertos cada uno. */
async function submitMany(count: number, correct: number) {
  for (let i = 0; i < count; i++) {
    await theoryQuizService.submitAttempt(await payloadWith(correct));
  }
}

function savedAttempts(): QuizAttempt[] {
  return (storage.get(ATTEMPTS_KEY) as QuizAttempt[] | undefined) ?? [];
}

beforeEach(() => {
  storage.clear();
});

describe('submitAttempt guarda la nota del intento (T3)', () => {
  it('9 aciertos en el intento 1 guardan nota 6,3 con máximo 7,0 y aprueban', async () => {
    const { attempt, approval } = await theoryQuizService.submitAttempt(await payloadWith(9));

    expect(attempt).toMatchObject({ attemptNumber: 1, score: 9, grade: 6.3, maxGrade: 7.0 });
    expect(savedAttempts()[0]).toMatchObject({ grade: 6.3, maxGrade: 7.0 });
    expect(approval.isApproved).toBe(true);
    expect(approval.result).toMatchObject({ bestGrade: 6.3, isBlocked: false });
  });

  it('10 aciertos en el intento 4 quedan en 5,0 por el tope del bloque 2', async () => {
    await submitMany(3, 5);
    const { attempt } = await theoryQuizService.submitAttempt(await payloadWith(10));

    expect(attempt).toMatchObject({ attemptNumber: 4, grade: 5.0, maxGrade: 5.0 });
  });

  it('el número de intento sale del historial y no del payload', async () => {
    await submitMany(2, 5);
    const { attempt } = await theoryQuizService.submitAttempt(
      await payloadWith(5, { attemptNumber: 1 }),
    );

    expect(attempt.attemptNumber).toBe(3);
  });

  it('un intento que se acaba por tiempo se guarda como timed-out (D-01)', async () => {
    const { attempt } = await theoryQuizService.submitAttempt(
      await payloadWith(4, { timedOut: true }),
    );

    expect(attempt.status).toBe('timed-out');
    expect(savedAttempts()[0].status).toBe('timed-out');
  });
});

describe('submitAttempt rechaza los envíos no permitidos (T3)', () => {
  it('rechaza un envío después de aprobar y no guarda nada', async () => {
    await theoryQuizService.submitAttempt(await payloadWith(8));

    await expect(theoryQuizService.submitAttempt(await payloadWith(10))).rejects.toMatchObject({
      reason: 'already-approved',
    });
    expect(savedAttempts()).toHaveLength(1);
  });

  it('el intento 9 sin aprobar bloquea la evaluación', async () => {
    await submitMany(9, 7);
    const approval = await theoryQuizService.getApprovalStatus();

    expect(approval.isApproved).toBe(false);
    expect(approval.result).toMatchObject({
      attemptsUsed: 9,
      isBlocked: true,
      hasAttemptsRemaining: false,
    });
  });

  it('rechaza un décimo envío con un mensaje claro y el historial sigue en 9', async () => {
    await submitMany(9, 7);
    const rejected = theoryQuizService.submitAttempt(await payloadWith(10));

    await expect(rejected).rejects.toBeInstanceOf(TheoryQuizSubmitError);
    await expect(rejected).rejects.toMatchObject({ reason: 'blocked' });
    await expect(rejected).rejects.toThrow(/profesor guía/);
    expect(savedAttempts()).toHaveLength(9);
  });

  it('aprobar en el intento 9 no bloquea', async () => {
    await submitMany(8, 5);
    const { approval } = await theoryQuizService.submitAttempt(await payloadWith(8));

    expect(approval.isApproved).toBe(true);
    expect(approval.result?.isBlocked).toBe(false);
  });
});

describe('historial guardado antes del Lab 9 (riesgo R4, defecto D-03)', () => {
  it('completa la nota de los intentos que no la tienen', async () => {
    storage.set(ATTEMPTS_KEY, [
      { attemptNumber: 1, score: 6, totalQuestions: 10, status: 'completed', questions: [], answers: [] },
    ]);

    const [attempt] = await theoryQuizService.getAttemptHistory();
    expect(attempt).toMatchObject({ grade: 4.0, maxGrade: 7.0 });
  });

  it('corrige un número de intento fuera de rango en vez de fallar', async () => {
    storage.set(ATTEMPTS_KEY, [
      { attemptNumber: 12, score: 5, totalQuestions: 10, status: 'completed', questions: [], answers: [] },
    ]);

    const [attempt] = await theoryQuizService.getAttemptHistory();
    expect(attempt.attemptNumber).toBe(1);
  });

  it('con 3 intentos de las reglas anteriores le quedan 6 y no queda bloqueado', async () => {
    storage.set(ATTEMPTS_KEY, [5, 5, 5].map((score, index) => ({
      attemptNumber: index + 1, score, totalQuestions: 10, status: 'completed', questions: [], answers: [],
    })));
    storage.set(APPROVAL_KEY, {
      isApproved: false,
      result: { attemptsUsed: 3, maxAttempts: 3, hasAttemptsRemaining: false },
      approvedAt: null,
    });

    const approval = await theoryQuizService.getApprovalStatus();
    expect(approval.result).toMatchObject({ attemptsUsed: 3, maxAttempts: 9, hasAttemptsRemaining: true, isBlocked: false });
  });

  it('quien aprobó con las reglas anteriores (7 de 10) sigue aprobado', async () => {
    storage.set(ATTEMPTS_KEY, [
      { attemptNumber: 1, score: 7, totalQuestions: 10, status: 'completed', questions: [], answers: [] },
    ]);
    storage.set(APPROVAL_KEY, { isApproved: true, result: null, approvedAt: '2026-10-01T12:00:00.000Z' });

    const approval = await theoryQuizService.getApprovalStatus();
    expect(approval.isApproved).toBe(true);
    expect(approval.approvedAt).toBe('2026-10-01T12:00:00.000Z');
  });
});
