// test/repair.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const home = mkdtempSync(join(tmpdir(), 'dsh-home-repair-'));
process.env.DSH_HOME = home;

const { apply } = await import('../index.js');
const { scanNotesDir } = await import('../src/store.mjs');

const ID = '123e4567-e89b-12d3-a456-426614174000';
const fixed = () => ({
  id: ID,
  title: 'Repaired note',
  workspace: 'w1',
  sessionId: null,
  category: 'note',
  tags: ['note'],
  source: 'manual',
  createdAt: 1700000000000,
  updatedAt: 1700000001000,
  body: 'fixed body',
});

function captureService() {
  let service = null;
  const ctx = {
    log: { info() {}, error() {} },
    provide(n, svc) { if (n === 'notes') service = svc; },
    route() {},
    tool() {},
    effect() { return () => {}; },
  };
  apply(ctx);
  assert.ok(service, 'notes service captured');
  return service;
}

test('repair fixes a broken file end-to-end', () => {
  const dir = join(home, 'notes');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'broken.md'), '---\nnot: valid\n---\nbody');

  const before = scanNotesDir(dir);
  assert.equal(before.notes.length, 0);
  assert.equal(before.invalid.length, 1);
  assert.equal(before.invalid[0].file, 'broken.md');
  assert.ok(typeof before.invalid[0].content === 'string');

  const service = captureService();
  assert.ok(service.state().invalid.some((e) => e.file === 'broken.md'));

  const note = service.repair('broken.md', fixed());
  assert.equal(note.title, 'Repaired note');

  const after = scanNotesDir(dir);
  assert.equal(after.invalid.length, 0);
  assert.equal(after.notes.length, 1);
  assert.equal(after.notes[0].id, ID);

  const state = service.state();
  assert.ok(!state.invalid.some((e) => e.file === 'broken.md'));
  assert.ok(state.notes.some((n) => n.id === ID));
  assert.equal(service.get(ID).title, 'Repaired note');
});

test('repair with over-limit body throws too-long', () => {
  const service = captureService();
  assert.throws(() => service.repair('broken.md', { ...fixed(), body: 'x'.repeat(10001) }), /too-long/);
});

test('repair with bad filename throws bad-filename', () => {
  const service = captureService();
  assert.throws(() => service.repair('../evil.md', fixed()), /bad-filename/);
  assert.throws(() => service.repair('sub/dir.md', fixed()), /bad-filename/);
  assert.throws(() => service.repair('note.txt', fixed()), /bad-filename/);
});
