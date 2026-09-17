// src/schema.mjs
export const CATEGORIES = ['idea', 'task', 'session', 'link', 'note'];
export const SOURCES = ['manual', 'agent', 'fallback'];
export const LIMITS = { body: 10000, title: 120, tags: 8, tagLen: 32 };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  const out = [];
  const seen = new Set();
  for (const raw of tags) {
    if (typeof raw !== 'string') continue;
    const t = raw.trim();
    if (t === '' || t.length > LIMITS.tagLen || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= LIMITS.tags) break;
  }
  return out;
}

export function defaultManualMeta(locale) {
  return { category: 'note', tags: [locale === 'zh' ? '笔记' : 'note'] };
}

export function validateNoteObject(note) {
  if (!note || typeof note !== 'object') return { ok: false, error: 'bad-note' };
  if (typeof note.id !== 'string' || !UUID_RE.test(note.id)) return { ok: false, error: 'bad-id' };
  if (typeof note.title !== 'string' || note.title.trim() === '' || [...note.title].length > LIMITS.title) {
    return { ok: false, error: 'bad-title' };
  }
  if (typeof note.workspace !== 'string' || note.workspace.trim() === '' || note.workspace.length > 160) {
    return { ok: false, error: 'bad-workspace' };
  }
  if (note.sessionId !== null && note.sessionId !== undefined && typeof note.sessionId !== 'string') {
    return { ok: false, error: 'bad-session' };
  }
  if (!CATEGORIES.includes(note.category)) return { ok: false, error: 'bad-category' };
  if (!SOURCES.includes(note.source)) return { ok: false, error: 'bad-source' };
  if (!Array.isArray(note.tags)) return { ok: false, error: 'bad-tags' };
  const tags = normalizeTags(note.tags);
  if (typeof note.body !== 'string') return { ok: false, error: 'bad-body' };
  if ([...note.body].length > LIMITS.body) return { ok: false, error: 'too-long' };
  if (typeof note.createdAt !== 'number' || typeof note.updatedAt !== 'number') return { ok: false, error: 'bad-time' };
  if (note.updatedAt < note.createdAt) return { ok: false, error: 'bad-time' };
  return { ok: true, value: { ...note, title: note.title.trim(), workspace: note.workspace.trim(), tags } };
}
