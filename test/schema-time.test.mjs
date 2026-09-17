// test/schema-time.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateNoteObject } from '../src/schema.mjs';

const base = () => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Hello',
  workspace: 'dsh-local',
  sessionId: null,
  category: 'idea',
  tags: ['ai'],
  source: 'manual',
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
  body: 'hello',
});

test('rejects NaN/Infinity/fractional/string timestamps with bad-time', () => {
  for (const v of [NaN, Infinity, -Infinity, 1.5, 1700000000000.25, '1700000000000']) {
    const c = validateNoteObject({ ...base(), createdAt: v });
    assert.equal(c.ok, false, `createdAt=${String(v)} should fail`);
    assert.equal(c.error, 'bad-time');
    const u = validateNoteObject({ ...base(), updatedAt: v });
    assert.equal(u.ok, false, `updatedAt=${String(v)} should fail`);
    assert.equal(u.error, 'bad-time');
  }
});

test('accepts finite integer timestamps', () => {
  assert.equal(validateNoteObject(base()).ok, true);
  assert.equal(validateNoteObject({ ...base(), createdAt: 0, updatedAt: 1 }).ok, true);
});
