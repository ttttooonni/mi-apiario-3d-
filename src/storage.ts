import { queenColorForYear } from './queenColor';

export type HiveStatus = 'Activa' | 'Revisar' | 'Atención';
export type Hive = {
  id: string; name: string; kind: 'Colmena' | 'Núcleo'; status: HiveStatus; note: string;
  queen: string; queenYear: number; population: string; reserves: string; brood: string;
  lastReview: string; production: number; apiary: string;
};
export type LogKind = 'Revisión' | 'Sanidad' | 'Alimentación' | 'Nota';
export type LogEntry = { id: string; hiveId: string; date: string; kind: LogKind; detail: string };
export type Task = { id: string; hiveId: string; title: string; due: string; priority: 'Normal' | 'Alta'; done: boolean };
export type Harvest = { id: string; date: string; product: string; quantity: number; lot: string };
/** `seedRevision` is optional so older v1 copies stay valid; it only records which demo hives were already offered. */
export type DemoState = { version: 1; seedRevision?: number; hives: Hive[]; logs: LogEntry[]; tasks: Task[]; harvests: Harvest[] };

export const STORAGE_KEY = 'mi-apiario-3d.demo.v1';
export const TUTORIAL_KEY = 'mi-apiario-3d.tutorial.started';
export const SEED_REVISION = 2;

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isDate = (v: unknown) => isStr(v) && (v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v));

/** Returns a list of problems; an empty list means the structure is safe to load. */
export function validateState(value: unknown): string[] {
  const errors: string[] = [];
  if (!isObj(value)) return ['La copia no es un objeto JSON.'];
  if (value.version !== 1) errors.push('Versión de datos no compatible (se esperaba 1).');
  for (const key of ['hives', 'logs', 'tasks', 'harvests'] as const) if (!Array.isArray(value[key])) errors.push(`Falta la colección «${key}».`);
  if (errors.length) return errors;
  const hives = value.hives as unknown[];
  const ids = new Set<string>();
  hives.forEach((h, i) => {
    if (!isObj(h) || !isStr(h.id) || !h.id || !isStr(h.name) || typeof h.queenYear !== 'number' || !['Activa', 'Revisar', 'Atención'].includes(h.status as string)) errors.push(`Colmena ${i + 1} incompleta.`);
    else if (ids.has(h.id)) errors.push(`Colmena duplicada: ${h.id}.`); else ids.add(h.id);
  });
  (value.logs as unknown[]).forEach((l, i) => {
    if (!isObj(l) || !isStr(l.id) || !isStr(l.hiveId) || !isDate(l.date) || !isStr(l.detail) || !['Revisión', 'Sanidad', 'Alimentación', 'Nota'].includes(l.kind as string)) errors.push(`Registro ${i + 1} incompleto.`);
  });
  (value.tasks as unknown[]).forEach((t, i) => {
    if (!isObj(t) || !isStr(t.id) || !isStr(t.hiveId) || !isStr(t.title) || !isDate(t.due) || typeof t.done !== 'boolean' || !['Normal', 'Alta'].includes(t.priority as string)) errors.push(`Tarea ${i + 1} incompleta.`);
  });
  (value.harvests as unknown[]).forEach((h, i) => {
    if (!isObj(h) || !isStr(h.id) || !isDate(h.date) || typeof h.quantity !== 'number' || !Number.isFinite(h.quantity) || h.quantity < 0 || !isStr(h.lot)) errors.push(`Lote ${i + 1} incompleto.`);
  });
  return errors;
}

/** Recalculates queen colours from the year and offers demo hives added in later seed revisions once, without removing anything. */
export function normalizeState(state: DemoState, seedHives: Hive[]): DemoState {
  const hives = state.hives.map(h => ({ ...h, kind: h.kind === 'Núcleo' ? 'Núcleo' as const : 'Colmena' as const, queen: h.queen === 'Sin marcar' ? 'Sin marcar' : queenColorForYear(h.queenYear) }));
  const needsSeeds = (state.seedRevision ?? 1) < SEED_REVISION;
  const added = needsSeeds ? seedHives.filter(seed => !hives.some(h => h.id === seed.id)) : [];
  return { ...state, seedRevision: SEED_REVISION, hives: [...hives, ...added] };
}

export type LoadResult = { state: DemoState; writable: boolean; message: string; raw: string | null };

export function loadState(storage: StorageLike | null, seed: DemoState): LoadResult {
  if (!storage) return { state: seed, writable: false, raw: null, message: 'Este navegador no permite guardar datos. Puedes explorar la demo, pero los cambios se perderán al cerrar.' };
  let raw: string | null;
  try { raw = storage.getItem(STORAGE_KEY); }
  catch { return { state: seed, writable: false, raw: null, message: 'No se ha podido leer el almacenamiento local. No se guardarán cambios para evitar sobrescribir datos existentes.' }; }
  if (!raw) return { state: seed, writable: true, raw: null, message: '' };
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { parsed = undefined; }
  if (parsed !== undefined && validateState(parsed).length === 0) {
    return { state: normalizeState(parsed as DemoState, seed.hives), writable: true, raw, message: '' };
  }
  return { state: seed, writable: false, raw, message: 'La copia local de demostración no tiene el formato esperado. Se conserva sin sobrescribir; puedes descargar el contenido original antes de importar otra copia.' };
}

/** Writes and reads back; only reports success if the stored text matches. */
export function saveState(storage: StorageLike | null, state: DemoState): boolean {
  if (!storage) return false;
  try {
    const text = JSON.stringify(state);
    storage.setItem(STORAGE_KEY, text);
    return storage.getItem(STORAGE_KEY) === text;
  } catch { return false; }
}

export const EXPORT_APP = 'mi-apiario-3d-demo';
export function buildExport(state: DemoState, now = new Date()) {
  return JSON.stringify({ app: EXPORT_APP, version: 1, exportedAt: now.toISOString(), data: state }, null, 2);
}

export type ImportResult = { ok: true; state: DemoState; summary: string } | { ok: false; errors: string[] };
/** Accepts an export file (with wrapper) or a bare state. Never touches storage. */
export function parseImport(text: string): ImportResult {
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { return { ok: false, errors: ['El archivo no es JSON válido.'] }; }
  if (isObj(parsed) && 'data' in parsed) {
    if (parsed.app !== undefined && parsed.app !== EXPORT_APP) return { ok: false, errors: ['El archivo no es una copia de Mi Apiario 3D (demo). No se importan datos de otras aplicaciones.'] };
    parsed = parsed.data;
  }
  const errors = validateState(parsed);
  if (errors.length) return { ok: false, errors };
  const state = parsed as DemoState;
  return { ok: true, state: { ...state, seedRevision: SEED_REVISION }, summary: `${state.hives.length} colmenas, ${state.logs.length} registros, ${state.tasks.length} tareas y ${state.harvests.length} lotes` };
}

export function safeStorage(): StorageLike | null {
  try { const s = window.localStorage; const probe = '__mi-apiario-3d-probe__'; s.setItem(probe, '1'); s.removeItem(probe); return s; }
  catch { try { return window.localStorage ?? null; } catch { return null; } }
}
