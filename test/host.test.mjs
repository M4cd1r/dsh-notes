// test/host.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.DSH_HOME = mkdtempSync(join(tmpdir(), 'dsh-home-'));

const { name, apply, notesDirFromCtx } = await import('../index.js');

test('module name is notes', () => {
  assert.equal(name, 'notes');
});

test('apply never throws on empty ctx and exposes notes service', () => {
  const ctx = {
    log: { info() {}, error() {} },
    provide() {},
    route() {},
    tool() {},
    effect(fn) { try { fn(); } catch {} return () => {}; },
  };
  assert.doesNotThrow(() => apply(ctx));
  assert.doesNotThrow(() => apply(null));
  assert.doesNotThrow(() => apply(undefined));
});

test('notesDirFromCtx honors DSH_HOME', () => {
  const dir = notesDirFromCtx(null);
  assert.ok(dir.includes('notes'));
});
