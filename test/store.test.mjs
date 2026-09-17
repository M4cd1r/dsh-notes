// test/store.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseNoteFile, serializeNoteFile, scanNotesDir, writeNoteAtomic, searchNotes } from '../src/store.mjs';

const note = () => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'My note',
  workspace: 'dsh-local',
  sessionId: null,
  category: 'idea',
  tags: ['ai', 'mcp'],
  source: 'agent',
  createdAt: 1700000000000,
  updatedAt: 1700000001000,
  body: '# Hello\n\nSome **markdown** with --- inside\nand more.',
});

test('round-trip preserves body containing --- lines', () => {
  const text = serializeNoteFile(note());
  const back = parseNoteFile(text);
  assert.equal(back.ok, true);
  assert.equal(back.value.body, note().body);
  assert.equal(back.value.title, 'My note');
  assert.deepEqual(back.value.tags, ['ai', 'mcp']);
});

test('null sessionId serializes as empty and parses back to null', () => {
  const back = parseNoteFile(serializeNoteFile(note()));
  assert.equal(back.value.sessionId, null);
});

test('body over limit throws too-long instead of truncating', () => {
  assert.throws(() => serializeNoteFile({ ...note(), body: 'y'.repeat(10001) }), /too-long/);
});

test('scanNotesDir reads valid files and reports invalid ones', () => {
  const dir = mkdtempSync(join(tmpdir(), 'notes-'));
  writeFileSync(join(dir, 'a.md'), serializeNoteFile(note()));
  writeFileSync(join(dir, 'broken.md'), '---\nnot: valid\n---\nbody');
  const { notes, invalid } = scanNotesDir(dir);
  assert.equal(notes.length, 1);
  assert.equal(invalid.length, 1);
  assert.equal(invalid[0].file, 'broken.md');
});

test('scanNotesDir on missing dir returns empty without throwing', () => {
  const { notes, invalid } = scanNotesDir(join(tmpdir(), 'notes-missing-xyz-123'));
  assert.deepEqual(notes, []);
  assert.deepEqual(invalid, []);
});

test('writeNoteAtomic writes readable file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'notes-'));
  const p = writeNoteAtomic(dir, note());
  const { notes } = scanNotesDir(dir);
  assert.equal(notes.length, 1);
  assert.ok(p.endsWith('.md'));
});

test('searchNotes matches title/body/tags/workspace case-insensitively', () => {
  const notes = [{ ...note(), title: 'Offpeak Queue', body: 'nothing', tags: ['x'], workspace: 'a' }];
  assert.equal(searchNotes(notes, 'offpeak').length, 1);
  assert.equal(searchNotes(notes, 'OFFPEAK').length, 1);
  assert.equal(searchNotes(notes, 'zzz').length, 0);
  assert.equal(searchNotes(notes, '').length, 1);
});
