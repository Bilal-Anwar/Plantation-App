import { supabase } from '../lib/supabase';
import type { Worker, Pineapple, Nourishment, Payment, AppSettings, AdminUser } from '../types';

export interface FarmData {
  workers: Worker[]; pineapples: Pineapple[]; nourishments: Nourishment[];
  payments: Payment[]; settings: Partial<AppSettings>;
}
export type SyncState = 'loading' | 'saved' | 'pending' | 'saving' | 'error';
let data: FarmData = { workers: [], pineapples: [], nourishments: [], payments: [], settings: {} };
let revision = 0;
let generation = 0;
let currentUser: AdminUser | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let saving: Promise<void> | null = null;
let state: SyncState = 'loading';
let errorMessage = '';
let dirty = false;
const listeners = new Set<() => void>();
const notify = () => queueMicrotask(() => listeners.forEach(fn => fn()));
export const subscribeSync = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export const getSyncStatus = () => ({ state, error: errorMessage });
export const getFarmData = () => data;
export const getCloudUser = () => currentUser;
const changeKeys = (value: any, convert: (s: string) => string): any => Array.isArray(value)
  ? value.map(row => changeKeys(row, convert)) : value && typeof value === 'object'
    ? Object.fromEntries(Object.entries(value).map(([k,v]) => [convert(k), changeKeys(v,convert)])) : value;
const camel = (s: string) => s.replace(/_([a-z])/g, (_,c) => c.toUpperCase());
const snake = (s: string) => s.replace(/[A-Z]/g, c => '_' + c.toLowerCase());

export async function loadFarm(user: AdminUser): Promise<void> {
  if (!supabase) throw new Error('Supabase configuration missing.');
  const epoch = generation;
  const result = await supabase.rpc('read_farm');
  if (epoch !== generation) return;
  if (result.error) throw new Error(result.error.message);
  const raw = result.data;
  if (!raw || !Array.isArray(raw.workers)) throw new Error('Invalid database response.');
  data = {
    workers: changeKeys(raw.workers, camel), pineapples: changeKeys(raw.pineapples, camel),
    nourishments: changeKeys(raw.nourishments, camel), payments: changeKeys(raw.payments, camel),
    settings: raw.settings || {},
  };
  revision = raw.revision;
  currentUser = user;
  state = 'saved'; dirty = false; errorMessage = ''; notify();
}
export function resetFarm(): void {
  generation++;
  if (timer) clearTimeout(timer);
  currentUser = null; state = 'loading'; dirty = false; saving = null;
  data = { workers: [], pineapples: [], nourishments: [], payments: [], settings: {} };
  notify();
}
export function updateFarm<K extends keyof FarmData>(key: K, value: FarmData[K]): void {
  if (!currentUser || currentUser.role !== 'super_admin') throw new Error('Only the farm owner can edit records.');
  if (state === 'error') throw new Error('Cloud save failed. Reload before editing.');
  data = { ...data, [key]: value }; dirty = true; state = 'pending'; notify();
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { void flushFarm().catch(() => {}); }, 250);
}
export async function flushFarm(): Promise<void> {
  if (saving) { await saving; if (dirty) return flushFarm(); return; }
  if (!dirty) return;
  if (state === 'error') throw new Error(errorMessage);
  if (!supabase) throw new Error('Supabase configuration missing.');
  const epoch = generation;
  const snapshot = structuredClone(data);
  dirty = false; state = 'saving'; notify();
  saving = (async () => {
    const payload = {
      workers: changeKeys(snapshot.workers,snake), pineapples: changeKeys(snapshot.pineapples,snake),
      nourishments: changeKeys(snapshot.nourishments,snake), payments: changeKeys(snapshot.payments,snake),
      settings: snapshot.settings,
    };
    const { data: nextRevision, error } = await supabase.rpc('save_farm', { payload, expected_revision: revision });
    if (epoch !== generation) return;
    if (error) throw new Error(error.message);
    revision = nextRevision;
    state = dirty ? 'pending' : 'saved'; notify();
  })().catch((err: Error) => {
    if (epoch === generation) { state = 'error'; dirty = true; errorMessage = err.message; notify(); }
    throw err;
  }).finally(() => { if (epoch === generation) saving = null; });
  await saving;
  if (dirty) await flushFarm();
}
