/** Guided tutorial as a pure state machine so every transition can be tested. */
export type TutorialEvent = 'hiveSelected' | 'frameInspected' | 'logSaved' | 'taskSaved';
export type TutorialTab = 'Resumen' | 'Revisiones' | 'Tareas';
export const TUTORIAL_STEPS = [
  { title: 'Explora el apiario 3D', expects: 'hiveSelected', tab: 'Resumen',
    text: 'Arrastra la escena para girar (con un dedo en el móvil). Usa ＋ y − o pellizca para acercar y alejar, ⌂ para ver todo el apiario y ▦ para mirar desde arriba. Después toca una colmena (o usa ‹ ›) para seguir.' },
  { title: 'Abre la colmena e inspecciona un cuadro', expects: 'frameInspected', tab: 'Resumen',
    text: 'La colmena seleccionada abre su tapa. Toca uno de los cuadros del interior. Si no ves bien la escena, pulsa «Inspeccionar un cuadro» en la ficha lateral.' },
  { title: 'Registra lo que has observado', expects: 'logSaved', tab: 'Revisiones',
    text: 'La observación de práctica ya está escrita en «Observaciones». Revísala, cámbiala si quieres y pulsa «Guardar registro de demostración». Avanzarás cuando se haya guardado.' },
  { title: 'Crea tu primera tarea', expects: 'taskSaved', tab: 'Tareas',
    text: 'Escribe una tarea ficticia (por ejemplo «Comprobar reservas»), elige colmena, fecha y prioridad y pulsa «＋ Crear tarea». Terminarás cuando la tarea quede guardada.' },
] as const satisfies readonly { title: string; expects: TutorialEvent; tab: TutorialTab; text: string }[];
export const TUTORIAL_DONE = TUTORIAL_STEPS.length;

/** step: -1 closed, 0..3 active, 4 finished. */
export function tutorialOnEvent(step: number, event: TutorialEvent): number {
  if (step < 0 || step >= TUTORIAL_DONE) return step;
  return TUTORIAL_STEPS[step].expects === event ? step + 1 : step;
}
export const tutorialBack = (step: number) => (step > 0 && step <= TUTORIAL_DONE ? step - 1 : step);
export const tutorialTab = (step: number): TutorialTab | null => (step >= 0 && step < TUTORIAL_DONE ? TUTORIAL_STEPS[step].tab : null);
