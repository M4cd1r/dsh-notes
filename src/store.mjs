// src/store.mjs
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { validateNoteObject } from './schema.mjs';

const SEP = '---\n';

function escInline(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ');
}

function parseInline(s) {
  const t = String(s || '').trim();
  if (t.startsWith('"') && t.endsWith('"') && t.length >= 2) {
    return t.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  return t;
}

function parseTagsLine(s) {
  const t = String(s || '').trim();
  const inner = t.startsWith('[') && t.endsWith(']') ? t.slice(1, -1) : t;
  if (inner.trim() === '') return [];
  return inner.split(',').map((p) => parseInline(p)).filter((p) => p !== '');
}

function getField(lines, key) {
  const prefix = key + ':';
  for (const line of lines) {
    if (line.startsWith(prefix)) return line.slice(prefix.length).trim();
  }
  return undefined;
}

export function parseNoteFile(text) {
  if (typeof text !== 'string' || !text.startsWith(SEP)) return { ok: false, error: 'bad-frontmatter' };
  const end = text.indexOf('\n---\n', SEP.length - 1);
  if (end === -1) return { ok: false, error: 'bad-frontmatter' };
  const head = text.slice(SEP.length, end).split('\n');
  const body = text.slice(end + '\n---\n'.length);
  const sessionRaw = getField(head, 'sessionId');
  const num = (v) => (v === undefined || v === '' ? NaN : Number(v));
  const candidate = {
    id: getField(head, 'id'),
    title: parseInline(getField(head, 'title') ?? ''),
    workspace: parseInline(getField(head, 'workspace') ?? ''),
    sessionId: sessionRaw === undefined || sessionRaw === '' ? null : parseInline(sessionRaw),
    category: (getField(head, 'category') ?? '').trim(),
    tags: parseTagsLine(getField(head, 'tags') ?? '[]'),
    source: (getField(head, 'source') ?? '').trim(),
    createdAt: num(getField(head, 'createdAt')),
    updatedAt: num(getField(head, 'updatedAt')),
    body,
  };
  const r = validateNoteObject(candidate);
  if (!r.ok) return { ok: false, error: 'bad-note:' + r.error };
  return { ok: true, value: r.value };
}

export function serializeNoteFile(note) {
  const r = validateNoteObject(note);
  if (!r.ok) throw new Error(r.error);
  const v = r.value;
  const lines = [
    '---',
    `id: ${v.id}`,
    `title: "${escInline(v.title)}"`,
    `workspace: "${escInline(v.workspace)}"`,
    `sessionId: ${v.sessionId ? escInline(v.sessionId) : ''}`,
    `category: ${v.category}`,
    `tags: [${v.tags.map((t) => `"${escInline(t)}"`).join(', ')}]`,
    `source: ${v.source}`,
    `createdAt: ${v.createdAt}`,
    `updatedAt: ${v.updatedAt}`,
    '---',
    v.body,
  ];
  return lines.join('\n');
}

export function writeNoteAtomic(dir, note) {
  mkdirSync(dir, { recursive: true });
  const text = serializeNoteFile(note);
  const target = join(dir, `${note.id}.md`);
  const tmp = target + `.tmp-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  writeFileSync(tmp, text, 'utf8');
  renameSync(tmp, target);
  return target;
}

export function scanNotesDir(dir) {
  const notes = [];
  const invalid = [];
  let entries = [];
  try {
    if (!existsSync(dir)) return { notes, invalid };
    entries = readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
  } catch {
    return { notes, invalid };
  }
  for (const file of entries) {
    try {
      const text = readFileSync(join(dir, file), 'utf8');
      const r = parseNoteFile(text);
      if (r.ok) notes.push(r.value);
      else invalid.push({ file, error: r.error });
    } catch (e) {
      invalid.push({ file, error: String((e && e.message) || e) });
    }
  }
  notes.sort((a, b) => b.updatedAt - a.updatedAt);
  return { notes, invalid };
}

export function searchNotes(notes, q) {
  const needle = String(q || '').trim().toLowerCase();
  if (needle === '') return [...notes];
  return notes.filter((n) => {
    const hay = `${n.title}\n${n.body}\n${n.tags.join(' ')}\n${n.workspace}`.toLowerCase();
    return hay.includes(needle);
  });
}
