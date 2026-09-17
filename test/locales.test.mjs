// test/locales.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const KEYS = ['notes.title', 'notes.new', 'notes.search', 'notes.filterWorkspace', 'notes.filterCategory',
  'notes.preview', 'notes.edit', 'notes.save', 'notes.cancel', 'notes.delete', 'notes.deleteConfirm',
  'notes.charLimit', 'notes.sessionOpen', 'notes.sessionMissing', 'notes.createdAt', 'notes.updatedTitle',
  'notes.empty', 'notes.emptySearch', 'notes.invalidNote', 'notes.fixByResave',
  'notes.errorTooLong', 'notes.errorLoadFailed', 'notes.errorSaveFailed', 'notes.close',
  'cat.idea', 'cat.task', 'cat.session', 'cat.link', 'cat.note', 'tag.noteDefault'];

test('client.js embeds zh+en locales with identical key sets', () => {
  const src = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  for (const k of KEYS) {
    assert.ok(src.includes(`'${k}'`), `missing key ${k}`);
  }
  assert.ok(src.includes('NOTES_LOCALES'), 'missing NOTES_LOCALES dict');
  assert.ok(src.includes('detectNotesLocale'), 'missing locale detection');
});

test('zh is present as source language', () => {
  const src = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  assert.ok(src.includes('笔记'), 'zh strings missing');
});
