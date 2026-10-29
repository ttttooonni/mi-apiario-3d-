// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEY, TUTORIAL_KEY, type DemoState } from '../storage';

// WebGL is not available in jsdom: replace the scene with buttons that call the same callbacks.
vi.mock('../world/ApiaryScene', () => ({
  default: ({ onSelect, onFrameInspect, selectedId }: { onSelect: (id: string) => void; onFrameInspect: (id: string, f: number) => void; selectedId: string }) => (
    <div data-testid="scene">
      <button type="button" onClick={() => onSelect('DEMO-003')}>escena: colmena 3</button>
      <button type="button" onClick={() => onFrameInspect(selectedId, 4)}>escena: cuadro 4</button>
    </div>
  ),
}));

import App from '../App';

const stored = (): DemoState => JSON.parse(localStorage.getItem(STORAGE_KEY)!);
const typeIn = (label: RegExp | string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const tick = () => act(() => { vi.advanceTimersByTime(1000); });

beforeEach(() => { localStorage.clear(); localStorage.setItem(TUTORIAL_KEY, '1'); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-29T10:00:00Z')); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

const tab = (name: string) => fireEvent.click(within(screen.getByRole('navigation', { name: 'Secciones del cuaderno' })).getByRole('button', { name }));

describe('cuaderno (flujos reales en el DOM)', () => {
  it('1-2. guarda la semilla en la primera visita y la conserva al recargar', async () => {
    render(<App />);
    await screen.findByTestId('scene');
    expect(stored().hives).toHaveLength(10);
    cleanup(); render(<App />);
    expect(screen.getAllByText(/Colmena 01/).length).toBeGreaterThan(0);
  });

  it('3/5. crea una observación asociada a la colmena elegida, la edita, y no duplica por doble pulsación', async () => {
    render(<App />); tab('Revisiones');
    fireEvent.change(screen.getByLabelText('Colmena'), { target: { value: 'DEMO-007' } });
    typeIn('Observaciones', 'Cría compacta en 5 cuadros');
    const save = screen.getByRole('button', { name: 'Guardar registro de demostración' });
    fireEvent.click(save); fireEvent.click(save);
    const created = stored().logs.filter(l => l.detail === 'Cría compacta en 5 cuadros');
    expect(created).toHaveLength(1);
    expect(created[0].hiveId).toBe('DEMO-007');
    expect(stored().hives.find(h => h.id === 'DEMO-007')!.lastReview).toBe('2026-10-29');
    expect(stored().logs).toHaveLength(4);
    fireEvent.click(screen.getAllByRole('button', { name: 'Editar' })[0]);
    typeIn('Observaciones', 'Cría compacta en 6 cuadros');
    await act(async () => { vi.setSystemTime(new Date('2026-10-29T10:00:05Z')); });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios del registro' }));
    const logs = stored().logs;
    expect(logs).toHaveLength(4);
    expect(logs.find(l => l.id === created[0].id)!.detail).toBe('Cría compacta en 6 cuadros');
    expect(screen.getByRole('status').textContent).toMatch(/guardado/);
  });

  it('4. crea una tarea conservando las anteriores, y la tarea sobrevive a recargar', () => {
    render(<App />); tab('Tareas');
    typeIn('Tarea', 'Comprobar reservas'); typeIn('Fecha prevista', '2026-11-05'); typeIn('Prioridad', 'Alta');
    fireEvent.click(screen.getByRole('button', { name: '＋ Crear tarea' }));
    const tasks = stored().tasks;
    expect(tasks).toHaveLength(4);
    expect(tasks[0]).toMatchObject({ title: 'Comprobar reservas', due: '2026-11-05', priority: 'Alta', done: false });
    tab('Resumen'); tab('Tareas');
    cleanup(); render(<App />); tab('Tareas');
    expect(screen.getByText('Comprobar reservas')).toBeTruthy();
  });

  it('9. borrar pide confirmación; si se cancela no se borra nada', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<App />); tab('Tareas');
    fireEvent.click(screen.getAllByRole('button', { name: /^Eliminar tarea/ })[0]);
    expect(confirm).toHaveBeenCalled(); expect(stored().tasks).toHaveLength(3);
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getAllByRole('button', { name: /^Eliminar tarea/ })[0]);
    expect(stored().tasks).toHaveLength(2);
  });

  it('6/9. una importación inválida no toca los datos; una válida pide confirmación', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:x'); URL.revokeObjectURL = vi.fn();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<App />);
    const before = localStorage.getItem(STORAGE_KEY);
    const input = screen.getByLabelText('Archivo de copia JSON') as HTMLInputElement;
    const file = (text: string) => { const f = new File([text], 'c.json', { type: 'application/json' }); Object.defineProperty(f, 'text', { value: () => Promise.resolve(text) }); return f; };
    await act(async () => { fireEvent.change(input, { target: { files: [file('{"version":1,"hives":[]}')] } }); });
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/no se han tocado/));
    expect(localStorage.getItem(STORAGE_KEY)).toBe(before);
    const valid = { ...stored(), hives: stored().hives.slice(0, 1), logs: [], tasks: [], harvests: [] };
    await act(async () => { fireEvent.change(input, { target: { files: [file(JSON.stringify({ app: 'mi-apiario-3d-demo', version: 1, data: valid }))] } }); });
    expect(confirm).toHaveBeenCalled(); expect(localStorage.getItem(STORAGE_KEY)).toBe(before);
    confirm.mockReturnValue(true);
    await act(async () => { fireEvent.change(input, { target: { files: [file(JSON.stringify({ app: 'mi-apiario-3d-demo', version: 1, data: valid }))] } }); });
    expect(stored().hives).toHaveLength(1);
    expect(URL.createObjectURL).toHaveBeenCalled(); // copia previa descargada
  });

  it('7. datos guardados dañados: aviso visible y el texto original no se sobrescribe', () => {
    localStorage.setItem(STORAGE_KEY, '{dañado');
    render(<App />); tab('Tareas');
    typeIn('Tarea', 'X'); fireEvent.click(screen.getByRole('button', { name: '＋ Crear tarea' }));
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{dañado');
    expect(screen.getAllByRole('alert').map(a => a.textContent).join(' ')).toMatch(/NO guardado|formato esperado/);
  });

  it('7. sin espacio: no afirma haber guardado', () => {
    render(<App />);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('quota', 'QuotaExceededError'); });
    tab('Tareas'); typeIn('Tarea', 'Y'); fireEvent.click(screen.getByRole('button', { name: '＋ Crear tarea' }));
    expect(screen.getAllByRole('alert').map(a => a.textContent).join(' ')).toMatch(/NO guardado/);
  });

  it('8. tutorial completo de principio a fin, con retroceso sin perder datos', async () => {
    localStorage.removeItem(TUTORIAL_KEY);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Empezar con datos de ejemplo/ }));
    expect(localStorage.getItem(TUTORIAL_KEY)).toBe('1');
    expect(screen.getByText('PASO 1 DE 4')).toBeTruthy();
    fireEvent.click(await screen.findByText('escena: colmena 3'));
    expect(screen.getByText('PASO 2 DE 4')).toBeTruthy();
    fireEvent.click(screen.getByText('escena: cuadro 4'));
    expect(screen.getByText('PASO 3 DE 4')).toBeTruthy();
    const textarea = screen.getByLabelText('Observaciones') as HTMLTextAreaElement;
    expect(textarea.value).toMatch(/cuadro 4/);
    expect(stored().logs).toHaveLength(3); // aún no se ha guardado nada
    fireEvent.click(screen.getByRole('button', { name: '← Anterior' }));
    expect(screen.getByText('PASO 2 DE 4')).toBeTruthy();
    fireEvent.click(screen.getByText('escena: cuadro 4'));
    typeIn('Observaciones', 'Mi observación del tutorial');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar registro de demostración' }));
    expect(screen.getByText('PASO 4 DE 4')).toBeTruthy();
    expect(stored().logs[0]).toMatchObject({ hiveId: 'DEMO-003', detail: 'Mi observación del tutorial' });
    await act(async () => { vi.setSystemTime(new Date('2026-10-29T10:00:05Z')); });
    typeIn('Tarea', 'Tarea del tutorial');
    fireEvent.click(screen.getByRole('button', { name: '＋ Crear tarea' }));
    expect(screen.getByText('¡Tutorial completado!')).toBeTruthy();
    expect(stored().tasks[0].title).toBe('Tarea del tutorial');
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    fireEvent.click(screen.getByRole('button', { name: '🎓 Tutorial' }));
    expect(screen.getByText('PASO 1 DE 4')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Salir del tutorial' }));
    expect(screen.queryByText(/PASO/)).toBeNull();
  });
});
void tick;
