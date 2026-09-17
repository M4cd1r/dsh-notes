// test/index-state.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createIndex } from '../src/index-state.mjs';

const n = (id, extra = {}) => ({
  id, title: 't-' + id.slice(0, 4), workspace: 'w1', sessionId: null,
  category: 'note', tags: ['note'], source: 'manual',
  createdAt: 1000, updatedAt: 1000, body: 'b', ...extra,
});

test('upsert inserts and replaces by id (last-write-wins)', () => {
  const idx = createIndex();
  idx.upsert(n('123e4567-e89b-12d3-a456-426614174000', { title: 'first' }));
  idx.upsert(n('123e4567-e89b-12d3-a456-426614174000', { title: 'second', updatedAt: 2000 }));
  assert.equal(idx.count(), 1);
  assert.equal(idx.list()[0].title, 'second');
});

test('list filters by workspace and category', () => {
  const idx = createIndex();
  idx.upsert(n('123e4567-e89b-12d3-a456-426614174001', { workspace: 'w1', category: 'idea' }));
  idx.upsert(n('123e4567-e89b-12d3-a456-426614174002', { workspace: 'w2', category: 'idea' }));
  assert.equal(idx.list({ workspace: 'w1' }).length, 1);
  assert.equal(idx.list({ category: 'idea' }).length, 2);
  assert.equal(idx.list({ workspace: 'w2', category: 'task' }).length, 0);
});

test('remove deletes by id', () => {
  const idx = createIndex();
  idx.upsert(n('123e4567-e89b-12d3-a456-426614174003'));
  idx.remove('123e4567-e89b-12d3-a456-426614174003');
  assert.equal(idx.count(), 0);
});

test('rebuild replaces whole state from scan result', () => {
  const idx = createIndex();
  idx.upsert(n('123e4567-e89b-12d3-a456-426614174004'));
  idx.rebuild({ notes: [n('123e4567-e89b-12d3-a456-426614174005')], invalid: [{ file: 'x.md', error: 'bad' }] });
  assert.equal(idx.count(), 1);
  assert.equal(idx.list()[0].id, '123e4567-e89b-12d3-a456-426614174005');
  assert.deepEqual(idx.invalid(), [{ file: 'x.md', error: 'bad' }]);
});
