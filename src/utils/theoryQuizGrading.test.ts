import { describe, expect, it } from 'vitest';
import {
  calculateGrade,
  calculateRawGrade,
  getGradeCap,
  getQuizStatus,
  isPassingScore,
  type GradedAttempt,
} from './theoryQuizGrading';

/** Crea un historial con los puntajes dados, numerando los intentos desde 1. */
function history(...scores: number[]): GradedAttempt[] {
  return scores.map((score, index) => ({ attemptNumber: index + 1, score, totalQuestions: 10 }));
}

describe('getGradeCap: tope de nota por bloque (DEC-15)', () => {
  it.each([
    [1, 7.0], [3, 7.0],
    [4, 5.0], [6, 5.0],
    [7, 4.0], [9, 4.0],
  ])('el intento %i tiene nota máxima %d', (attempt, cap) => {
    expect(getGradeCap(attempt)).toBe(cap);
  });

  it.each([0, 10, 2.5, -1])('rechaza el intento %d', (attempt) => {
    expect(() => getGradeCap(attempt)).toThrow(RangeError);
  });
});

describe('calculateRawGrade: escala 1,0 a 7,0 con exigencia del 60 %', () => {
  it.each([
    [0, 1.0], [3, 2.5], [6, 4.0], [8, 5.5], [9, 6.3], [10, 7.0],
  ])('%i de 10 aciertos dan %d', (score, grade) => {
    expect(calculateRawGrade(score, 10)).toBe(grade);
  });

  it.each([-1, 11, 7.5])('rechaza %d aciertos', (score) => {
    expect(() => calculateRawGrade(score, 10)).toThrow(RangeError);
  });
});

describe('calculateGrade: nota con tope', () => {
  it('P1: 9 aciertos en el intento 1 dan 6,3', () => {
    expect(calculateGrade(9, 1)).toBe(6.3);
  });

  it('P4: 10 aciertos en el intento 4 quedan en 5,0 por el tope del bloque 2', () => {
    expect(calculateGrade(10, 4)).toBe(5.0);
  });

  it('10 aciertos en el intento 7 quedan en 4,0', () => {
    expect(calculateGrade(10, 7)).toBe(4.0);
  });

  it('una nota bajo el tope no cambia: 6 aciertos en el intento 5 dan 4,0', () => {
    expect(calculateGrade(6, 5)).toBe(4.0);
  });

  it('P2: rechaza 11 aciertos y el intento 10', () => {
    expect(() => calculateGrade(11, 1)).toThrow(RangeError);
    expect(() => calculateGrade(8, 10)).toThrow(RangeError);
  });
});

describe('isPassingScore: aprobación con 8 de 10', () => {
  it('P3: 8 aprueba y 7 no', () => {
    expect(isPassingScore(8)).toBe(true);
    expect(isPassingScore(7)).toBe(false);
  });
});

describe('getQuizStatus: intentos restantes y bloqueo', () => {
  it('sin intentos: puede rendir el intento 1 con tope 7,0', () => {
    expect(getQuizStatus([])).toEqual({
      isApproved: false,
      attemptsUsed: 0,
      attemptsRemaining: 9,
      isBlocked: false,
      bestScore: null,
      bestGrade: null,
      nextAttemptNumber: 1,
      nextGradeCap: 7.0,
    });
  });

  it('P1: aprobar en el intento 1 cierra la evaluación', () => {
    const status = getQuizStatus(history(9));
    expect(status.isApproved).toBe(true);
    expect(status.isBlocked).toBe(false);
    expect(status.attemptsRemaining).toBe(0);
    expect(status.nextAttemptNumber).toBeNull();
    expect(status.bestGrade).toBe(6.3);
  });

  it('P3: reprobar con 7 en el intento 2 deja 7 intentos y el siguiente con tope 7,0', () => {
    const status = getQuizStatus(history(5, 7));
    expect(status.isApproved).toBe(false);
    expect(status.attemptsRemaining).toBe(7);
    expect(status.nextAttemptNumber).toBe(3);
    expect(status.nextGradeCap).toBe(7.0);
  });

  it('después del intento 3 el siguiente intento tiene tope 5,0', () => {
    expect(getQuizStatus(history(5, 5, 5)).nextGradeCap).toBe(5.0);
  });

  it('P5: 9 intentos sin aprobar bloquean la evaluación', () => {
    const status = getQuizStatus(history(7, 7, 7, 7, 7, 7, 7, 7, 7));
    expect(status.isBlocked).toBe(true);
    expect(status.isApproved).toBe(false);
    expect(status.attemptsRemaining).toBe(0);
    expect(status.nextAttemptNumber).toBeNull();
    expect(status.nextGradeCap).toBeNull();
  });

  it('aprobar en el intento 9 no bloquea', () => {
    const status = getQuizStatus(history(5, 5, 5, 5, 5, 5, 5, 5, 8));
    expect(status.isApproved).toBe(true);
    expect(status.isBlocked).toBe(false);
    expect(status.bestGrade).toBe(4.0);
  });

  it('la mejor nota considera el tope de cada intento', () => {
    // 7 aciertos en el intento 1 dan 4,8; 10 aciertos en el intento 4 dan 5,0.
    const status = getQuizStatus(history(7, 5, 5, 10));
    expect(status.bestGrade).toBe(5.0);
    expect(status.bestScore).toBe(10);
  });
});
