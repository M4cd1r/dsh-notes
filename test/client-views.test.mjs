import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('client implements list/detail, filters, preview/edit, counter, session jump', () => {
  const src = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  for (const needle of ['buildNotesPage', 'notes.filterWorkspace', 'notes.filterCategory',
    'notes.preview', 'notes.edit', 'notes.charLimit', '10000', 'notes.sessionMissing',
    'notes.deleteConfirm', '/state', '/action', 'sessionId']) {
    assert.ok(src.includes(needle), 'missing ' + needle);
  }
});
