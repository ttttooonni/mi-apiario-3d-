import { describe, expect, it } from 'vitest';
import { TUTORIAL_DONE, tutorialBack, tutorialOnEvent, tutorialTab } from '../tutorial';

describe('8. avance y retroceso del tutorial', () => {
  it('solo avanza con la acción prevista de cada paso', () => {
    let step = 0;
    expect(tutorialOnEvent(step, 'taskSaved')).toBe(0);
    step = tutorialOnEvent(step, 'hiveSelected'); expect(step).toBe(1);
    expect(tutorialOnEvent(step, 'hiveSelected')).toBe(1);
    step = tutorialOnEvent(step, 'frameInspected'); expect(step).toBe(2); expect(tutorialTab(step)).toBe('Revisiones');
    step = tutorialOnEvent(step, 'logSaved'); expect(step).toBe(3); expect(tutorialTab(step)).toBe('Tareas');
    step = tutorialOnEvent(step, 'taskSaved'); expect(step).toBe(TUTORIAL_DONE);
    expect(tutorialOnEvent(step, 'taskSaved')).toBe(TUTORIAL_DONE);
  });
  it('retrocede un paso y no hace nada si está cerrado', () => {
    expect(tutorialBack(3)).toBe(2); expect(tutorialBack(0)).toBe(0); expect(tutorialBack(-1)).toBe(-1);
    expect(tutorialOnEvent(-1, 'hiveSelected')).toBe(-1);
  });
});
