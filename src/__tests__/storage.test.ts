import { describe, expect, it } from 'vitest';
import { seedState } from '../demoData';
import { buildExport, loadState, parseImport, saveState, STORAGE_KEY, validateState, type DemoState, type StorageLike } from '../storage';

const memory = (initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } => {
  const data = { ...initial };
  return { data, getItem: k => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); } };
};
const clone = (s: DemoState): DemoState => JSON.parse(JSON.stringify(s));

describe('1. inicialización de datos ficticios', () => {
  it('la semilla es válida, coherente y solo usa IDs de demostración', () => {
    expect(validateState(seedState)).toEqual([]);
    expect(seedState.hives).toHaveLength(10);
    expect(seedState.hives.every(h => h.id.startsWith('DEMO-'))).toBe(true);
    const ids = new Set(seedState.hives.map(h => h.id));
    expect([...seedState.logs, ...seedState.tasks].every(r => ids.has(r.hiveId))).toBe(true);
  });
  it('sin datos guardados empieza con la semilla y permite guardar', () => {
    const r = loadState(memory(), seedState);
    expect(r.writable).toBe(true); expect(r.state.hives).toHaveLength(10); expect(r.raw).toBeNull();
  });
});

describe('2. persistencia tras recargar', () => {
  it('lo guardado se recupera igual en la siguiente carga', () => {
    const store = memory(); const state = clone(seedState);
    state.tasks.unshift({ id: 'TASK-X', hiveId: 'DEMO-003', title: 'Comprobar reservas', due: '2026-11-02', priority: 'Alta', done: false });
    expect(saveState(store, state)).toBe(true);
    const again = loadState(store, seedState);
    expect(again.state.tasks[0].title).toBe('Comprobar reservas');
    expect(again.state.tasks).toHaveLength(seedState.tasks.length + 1);
  });
  it('no vuelve a añadir colmenas de ejemplo a una copia ya revisada', () => {
    const store = memory(); const state = { ...clone(seedState), hives: clone(seedState).hives.slice(0, 2) };
    saveState(store, state);
    expect(loadState(store, seedState).state.hives).toHaveLength(2);
  });
  it('copias antiguas (sin seedRevision) conservan todo y reciben las colmenas nuevas una sola vez', () => {
    const old = clone(seedState); delete old.seedRevision; old.hives = old.hives.slice(0, 6); old.hives[0].note = 'MI NOTA';
    const store = memory({ [STORAGE_KEY]: JSON.stringify(old) });
    const r = loadState(store, seedState);
    expect(r.state.hives).toHaveLength(10); expect(r.state.hives[0].note).toBe('MI NOTA'); expect(r.state.logs).toEqual(old.logs);
  });
});

describe('6. importación y exportación JSON', () => {
  it('la exportación contiene todas las colecciones y vuelve a importarse igual', () => {
    const text = buildExport(seedState, new Date('2026-10-29T00:00:00Z'));
    const parsed = JSON.parse(text);
    expect(parsed.app).toBe('mi-apiario-3d-demo'); expect(parsed.data.hives).toHaveLength(10);
    const r = parseImport(text);
    expect(r.ok).toBe(true);
    if (r.ok) { expect(r.state.logs).toEqual(seedState.logs); expect(r.summary).toContain('10 colmenas'); }
  });
  it.each([
    ['texto no JSON', 'esto no es json'],
    ['falta una colección', JSON.stringify({ version: 1, hives: [], logs: [], tasks: [] })],
    ['versión desconocida', JSON.stringify({ ...seedState, version: 2 })],
    ['tarea sin fecha válida', JSON.stringify({ ...seedState, tasks: [{ id: 'T', hiveId: 'DEMO-001', title: 'x', due: 'mañana', priority: 'Alta', done: false }] })],
    ['cantidad negativa', JSON.stringify({ ...seedState, harvests: [{ id: 'L', date: '2026-01-01', product: 'Miel', quantity: -3, lot: 'X' }] })],
    ['colmenas duplicadas', JSON.stringify({ ...seedState, hives: [seedState.hives[0], seedState.hives[0]] })],
    ['copia de otra app', JSON.stringify({ app: 'mi-apiario', version: 1, data: seedState })],
  ])('rechaza %s', (_n, text) => { expect(parseImport(text).ok).toBe(false); });
});

describe('7. recuperación ante errores de almacenamiento', () => {
  it('sin localStorage la demo funciona en modo solo lectura', () => {
    const r = loadState(null, seedState);
    expect(r.writable).toBe(false); expect(r.message).toMatch(/no permite guardar/);
  });
  it('datos dañados no se sobrescriben y se conserva el texto original', () => {
    const store = memory({ [STORAGE_KEY]: '{roto' });
    const r = loadState(store, seedState);
    expect(r.writable).toBe(false); expect(r.raw).toBe('{roto'); expect(store.data[STORAGE_KEY]).toBe('{roto');
  });
  it('si el navegador se queda sin espacio, guardar informa del fallo', () => {
    const full: StorageLike = { getItem: () => null, setItem: () => { throw new DOMException('quota', 'QuotaExceededError'); } };
    expect(saveState(full, seedState)).toBe(false);
  });
  it('si la escritura no se puede releer igual, no se da por guardada', () => {
    const liar: StorageLike = { getItem: () => 'otra cosa', setItem: () => {} };
    expect(saveState(liar, seedState)).toBe(false);
  });
});
