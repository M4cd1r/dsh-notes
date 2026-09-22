import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

test('package.json declares dsh-notes bundle correctly', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.name, '@m4cd1r/dsh-notes');
  assert.equal(pkg.type, 'module');
  assert.equal(pkg.main, 'index.js');
  assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml');
  assert.equal(pkg.dsh.client.platform, 'web');
  assert.match(pkg.engines.node, /22/);
  assert.ok(pkg.files.includes('client.js'));
  assert.ok(pkg.files.includes('cordis.patch.yml'));
});

test('cordis.patch.yml inserts one notes row', () => {
  const yml = readFileSync(new URL('../cordis.patch.yml', import.meta.url), 'utf8');
  assert.match(yml, /id:\s*notes/);
  assert.match(yml, /name:\s*dsh-notes/);
});

test('entry files exist', () => {
  const root = new URL('..', import.meta.url);
  assert.ok(existsSync(new URL('index.js', root)));
  assert.ok(existsSync(new URL('client.js', root)));
});
