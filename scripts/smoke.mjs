// scripts/smoke.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const client = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
const host = readFileSync(new URL('../index.js', import.meta.url), 'utf8');

assert.match(client, /slots\.inject\('sidebar\.footer\.action'/);
assert.match(client, /data-dsh-notes/);
assert.match(client, /NOTES_LOCALES/);
assert.match(client, /buildNotesPage/);
assert.match(client, /10000/);
assert.match(client, /const inject = \['slots', 'sessions'\]/);
assert.doesNotMatch(client, /dangerouslySetInnerHTML:\s*\{[^}]*body[^}]*\}/);

const zhCount = (client.match(/'notes\./g) || []).length;
assert.ok(zhCount >= 28, `expected >=28 locale key refs, got ${zhCount}`);

assert.match(host, /dsh-notes\/state/);
assert.match(host, /dsh-notes\/action/);
assert.match(host, /notes\.create/);
assert.match(host, /writeNoteAtomic/);
assert.match(host, /watchNotesDir/);
assert.doesNotMatch(host, /messageId/);

console.log('smoke OK: footer entry + full-page shell + locales + host routes/tools, no messageId');
