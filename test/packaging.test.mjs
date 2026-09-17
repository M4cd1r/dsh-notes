// test/packaging.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

test('release workflows exist and trigger correctly', () => {
  const ci = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const rel = readFileSync(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8');
  assert.match(ci, /pull_request/);
  assert.match(ci, /npm run verify/);
  assert.match(rel, /v\*/);
  assert.match(rel, /npm publish/);
  assert.match(rel, /GITHUB_TOKEN|gh release/);
});

test('docs exist in both languages plus skill', () => {
  const root = new URL('..', import.meta.url);
  assert.ok(existsSync(new URL('README.md', root)));
  assert.ok(existsSync(new URL('README.zh-CN.md', root)));
  assert.ok(existsSync(new URL('SKILL.md', root)));
  const en = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  assert.match(en, /notes\.create/);
  assert.match(en, /frontmatter/);
  assert.match(en, /10000/);
});
