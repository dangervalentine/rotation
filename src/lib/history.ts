import { same } from "./model.ts";

/** Undo/redo stack for the outfit builder. Session-only; never saved. */
export interface History<T> {
  past: T[];
  present: T;
  future: T[];
}

export const HISTORY_CAP = 50;

export const initHistory = <T>(present: T): History<T> => ({ past: [], present, future: [] });

/** Record a new present. No-op when it equals the current one; clears redo. */
export function push<T>(h: History<T>, next: T, cap = HISTORY_CAP): History<T> {
  if (same(h.present, next)) return h;
  return { past: [...h.past, h.present].slice(-cap), present: next, future: [] };
}

export function undo<T>(h: History<T>): History<T> {
  if (!h.past.length) return h;
  return { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] };
}

export function redo<T>(h: History<T>): History<T> {
  if (!h.future.length) return h;
  return { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) };
}

export const resetHistory = initHistory;
export const canUndo = (h: History<unknown>) => h.past.length > 0;
export const canRedo = (h: History<unknown>) => h.future.length > 0;
