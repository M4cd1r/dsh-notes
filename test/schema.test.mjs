// test/schema.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES, LIMITS, validateNoteObject, normalizeTags, defaultManualMeta } from '../src/schema.mjs';

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
  body: 'hello **md**',
});

test('accepts a valid note', () => {
  const r = validateNoteObject(base());
  assert.equal(r.ok, true);
});

test('rejects body over 10000 chars with too-long (no silent truncation)', () => {
  const r = validateNoteObject({ ...base(), body: 'x'.repeat(10001) });
  assert.equal(r.ok, false);
  assert.equal(r.error, 'too-long');
});

test('accepts exactly 10000 chars', () => {
  const r = validateNoteObject({ ...base(), body: 'x'.repeat(10000) });
  assert.equal(r.ok, true);
});

test('rejects unknown category', () => {
  const r = validateNoteObject({ ...base(), category: 'custom' });
  assert.equal(r.ok, false);
  assert.equal(r.error, 'bad-category');
});

test('normalizeTags dedupes/trims/caps at 8', () => {
  assert.deepEqual(normalizeTags([' a ', 'a', '', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']), ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
});

test('manual defaults are localized note tag', () => {
  assert.deepEqual(defaultManualMeta('en'), { category: 'note', tags: ['note'] });
  assert.deepEqual(defaultManualMeta('zh'), { category: 'note', tags: ['笔记'] });
});

test('CATEGORIES is the closed list', () => {
  assert.deepEqual([...CATEGORIES].sort(), ['idea', 'link', 'note', 'session', 'task']);
  assert.equal(LIMITS.body, 10000);
});
