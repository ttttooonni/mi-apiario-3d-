import { describe, expect, it } from 'vitest';
import { queenColorForYear, queenDotClass } from './queenColor';

describe('queenColorForYear', () => {
  it.each([
    [2026, 'Blanco'], [2027, 'Amarillo'], [2028, 'Rojo'], [2029, 'Verde'], [2030, 'Azul'],
    [2025, 'Azul'], [2024, 'Verde'], [2023, 'Rojo'], [2022, 'Amarillo'], [2021, 'Blanco'],
  ])('calcula el color internacional para %i', (year, color) => {
    expect(queenColorForYear(year)).toBe(color);
  });
  it('rechaza años no válidos', () => {
    expect(queenColorForYear(-1)).toBe('Sin marcar');
    expect(queenColorForYear(2026.5)).toBe('Sin marcar');
  });
  it('distingue visualmente una reina sin marcar', () => {
    expect(queenDotClass(2026, false)).toContain('queen-sin-marcar');
    expect(queenDotClass(2026)).toContain('queen-blanco');
  });
});
