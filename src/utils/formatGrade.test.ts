import { describe, expect, it } from 'vitest';
import { formatGrade } from './formatGrade';

describe('formatGrade: notas con un decimal y coma (T4)', () => {
  it.each([
    [6.25, '6,3'],
    [5, '5,0'],
    [4.0, '4,0'],
    [1, '1,0'],
    [7, '7,0'],
  ])('%d se escribe %s', (grade, text) => {
    expect(formatGrade(grade)).toBe(text);
  });
});
