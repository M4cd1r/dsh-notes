// src/index-state.mjs
import { watch } from 'node:fs';

export function createIndex() {
  const map = new Map();
  let bad = [];
  return {
    rebuild(scan) {
      map.clear();
      bad = Array.isArray(scan && scan.invalid) ? [...scan.invalid] : [];
      const notes = scan && Array.isArray(scan.notes) ? scan.notes : [];
      for (const note of notes) {
        if (note && typeof note.id === 'string') map.set(note.id, note);
      }
    },
    upsert(note) {
      if (note && typeof note.id === 'string') map.set(note.id, note);
    },
    remove(id) {
      map.delete(id);
    },
    list(filter = {}) {
      const out = [...map.values()];
      const { workspace, category } = filter;
      const filtered = out.filter((note) => {
        if (workspace && note.workspace !== workspace) return false;
        if (category && note.category !== category) return false;
        return true;
      });
      filtered.sort((a, b) => b.updatedAt - a.updatedAt);
      return filtered;
    },
    invalid() {
      return [...bad];
    },
    count() {
      return map.size;
    },
  };
}

export function watchNotesDir(dir, onChange) {
  let timer = null;
  let watcher = null;
  try {
    watcher = watch(dir, { persistent: false }, () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        try { onChange && onChange(); } catch { /* ignore */ }
      }, 150);
    });
  } catch {
    return () => {};
  }
  return () => {
    try { if (timer) clearTimeout(timer); } catch { /* ignore */ }
    try { watcher && watcher.close(); } catch { /* ignore */ }
  };
}
