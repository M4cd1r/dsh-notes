// index.js — dsh-notes host half (defensive: apply() never throws outward)
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import os from 'node:os';
import { appendFileSync, existsSync, mkdirSync, statSync, unlinkSync } from 'node:fs';
import { scanNotesDir, searchNotes, writeNoteAtomic, writeNoteFileAtomic } from './src/store.mjs';
import { createIndex, watchNotesDir } from './src/index-state.mjs';
import { defaultManualMeta, validateNoteObject } from './src/schema.mjs';

export const name = 'notes';
const VERSION = '0.1.0';

export function notesDirFromCtx() {
  try {
    const home = typeof process !== 'undefined' && process.env && process.env.DSH_HOME
      ? process.env.DSH_HOME
      : join(os.homedir(), '.dsh');
    return join(home, 'notes');
  } catch {
    return join(os.homedir(), '.dsh', 'notes');
  }
}

function safeLog(ctx, ...args) {
  try {
    if (ctx && ctx.log && typeof ctx.log.error === 'function' && args[0] instanceof Error) {
      ctx.log.error(...args);
    } else if (ctx && ctx.log && typeof ctx.log.info === 'function') {
      ctx.log.info(...args);
    }
  } catch { /* ignore */ }
}

function currentWorkspace(ctx) {
  try {
    if (ctx && typeof ctx.get === 'function') {
      const ws = ctx.get('workspace');
      if (ws && typeof ws.id === 'string' && ws.id !== '') return ws.id;
      if (typeof ws === 'string' && ws !== '') return ws;
    }
  } catch { /* ignore */ }
  return 'default';
}

function currentSessionId(ctx) {
  try {
    if (ctx && typeof ctx.get === 'function') {
      const s = ctx.get('sessionId');
      if (typeof s === 'string' && s !== '') return s;
    }
  } catch { /* ignore */ }
  return null;
}

export function apply(ctx) {
  try {
    const dir = notesDirFromCtx(ctx);
    try { mkdirSync(dir, { recursive: true }); } catch { /* ignore */ }
    const index = createIndex();
    const rebuild = () => {
      try { index.rebuild(scanNotesDir(dir)); } catch (e) { safeLog(ctx, e); }
    };
    rebuild();

    const service = {
      version: VERSION,
      state(filter = {}) {
        return { notes: index.list(filter), invalid: index.invalid() };
      },
      list(filter = {}) {
        const limit = typeof filter.limit === 'number' && filter.limit > 0 ? Math.min(filter.limit, 200) : 100;
        return index.list(filter).slice(0, limit);
      },
      get(id) {
        return index.list().find((n) => n.id === id) || null;
      },
      search(q, filter = {}) {
        return searchNotes(index.list(filter), q).slice(0, 100);
      },
      create(input, origin) {
        input = input ?? {};
        origin = origin ?? {};
        const now = Date.now();
        const locale = origin.locale === 'zh' ? 'zh' : 'en';
        const auto = input.category || input.tags ? {} : defaultManualMeta(locale);
        const candidate = {
          id: randomUUID(),
          title: String(input.title || '').trim(),
          workspace: String(input.workspace || origin.workspace || currentWorkspace(ctx)),
          sessionId: input.sessionId !== undefined ? input.sessionId : (origin.sessionId !== undefined ? origin.sessionId : currentSessionId(ctx)),
          category: input.category || auto.category || 'note',
          tags: Array.isArray(input.tags) ? input.tags : (auto.tags || ['note']),
          source: origin.source || 'agent',
          createdAt: now,
          updatedAt: now,
          body: String(input.body || ''),
        };
        const checked = validateNoteObject(candidate);
        if (!checked.ok) throw new Error(checked.error);
        writeNoteAtomic(dir, checked.value);
        index.upsert(checked.value);
        return checked.value;
      },
      update(id, patch) {
        patch = patch ?? {};
        const prev = service.get(id);
        if (!prev) throw new Error('not-found');
        const next = {
          ...prev,
          title: patch.title !== undefined ? String(patch.title) : prev.title,
          body: patch.body !== undefined ? String(patch.body) : prev.body,
          tags: patch.tags !== undefined ? patch.tags : prev.tags,
          category: patch.category !== undefined ? patch.category : prev.category,
          updatedAt: Date.now(),
        };
        const checked = validateNoteObject(next);
        if (!checked.ok) throw new Error(checked.error);
        writeNoteAtomic(dir, checked.value);
        index.upsert(checked.value);
        return checked.value;
      },
      remove(id) {
        const prev = service.get(id);
        if (!prev) throw new Error('not-found');
        try { unlinkSync(join(dir, `${id}.md`)); } catch (e) { if (!e || e.code !== 'ENOENT') throw e; }
        index.remove(id);
        return true;
      },
      repair(file, note) {
        const checked = validateNoteObject(note);
        if (!checked.ok) throw new Error(checked.error);
        writeNoteFileAtomic(dir, file, checked.value);
        try { index.rebuild(scanNotesDir(dir)); } catch (e) { safeLog(ctx, e); index.upsert(checked.value); }
        return checked.value;
      },
    };

    try {
      if (ctx && typeof ctx.provide === 'function') ctx.provide('notes', service);
      else if (ctx && typeof ctx === 'object') ctx.notes = service;
    } catch (e) { safeLog(ctx, e); }

    const sendJson = (res, code, body) => {
      try {
        res.statusCode = code;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(body));
      } catch { /* ignore */ }
    };

    try {
      if (ctx && typeof ctx.route === 'function') {
        ctx.route('GET', '/dsh-notes/state', (req, res) => {
          try {
            const url = new URL(req.url || '/', 'http://local');
            const workspace = url.searchParams.get('workspace') || undefined;
            sendJson(res, 200, { ok: true, ...service.state({ workspace }) });
          } catch (e) { sendJson(res, 500, { ok: false, error: String((e && e.message) || e) }); }
        });
        ctx.route('POST', '/dsh-notes/action', async (req, res) => {
          let payload = {};
          try { payload = JSON.parse(await new Promise((resolve, reject) => {
            let raw = '';
            req.on('data', (c) => { raw += c; });
            req.on('end', () => resolve(raw || '{}'));
            req.on('error', reject);
          })); } catch { sendJson(res, 400, { ok: false, error: 'bad-json' }); return; }
          try {
            const { action, args = {} } = payload;
            if (action === 'create') sendJson(res, 200, { ok: true, note: service.create(args, { source: 'manual' }) });
            else if (action === 'update') sendJson(res, 200, { ok: true, note: service.update(args.id, args) });
            else if (action === 'delete') sendJson(res, 200, { ok: true, deleted: service.remove(args.id) });
            else if (action === 'repair') sendJson(res, 200, { ok: true, note: service.repair(args.file, args.note) });
            else sendJson(res, 400, { ok: false, error: 'bad-action' });
          } catch (e) {
            const msg = String((e && e.message) || e);
            const code = (msg === 'not-found' || msg === 'bad-filename') ? 404
              : (/^(bad-|too-long)/.test(msg) ? 400 : 500);
            sendJson(res, code, { ok: false, error: msg });
          }
        });
        ctx.route('POST', '/dsh-notes/report', (req, res) => {
          try {
            let raw = '';
            req.on('data', (c) => { raw = (raw + c).slice(0, 4000); });
            req.on('error', () => { try { sendJson(res, 200, { ok: true }); } catch { /* ignore */ } });
            req.on('end', () => {
              try {
                let skip = false;
                try { skip = statSync(join(dir, '.client-errors.log')).size > 1_000_000; } catch { skip = false; }
                if (!skip) {
                  const line = `[${new Date().toISOString()}] ${raw}\n`;
                  appendFileSync(join(dir, '.client-errors.log'), line);
                }
              } catch { /* ignore */ }
              sendJson(res, 200, { ok: true });
            });
          } catch { sendJson(res, 200, { ok: true }); }
        });
      }
    } catch (e) { safeLog(ctx, e); }

    try {
      if (ctx && typeof ctx.tool === 'function') {
        const tools = {
          'notes.create': (args) => service.create(args || {}),
          'notes.list': (args) => service.list(args || {}),
          'notes.get': (args) => service.get(args && args.id),
          'notes.search': (args) => service.search(args && args.q, args || {}),
          'notes.update': (args) => service.update(args && args.id, args || {}),
          'notes.delete': (args) => service.remove(args && args.id),
        };
        for (const [toolName, fn] of Object.entries(tools)) {
          try { ctx.tool(toolName, fn); } catch (e) { safeLog(ctx, e); }
        }
      }
    } catch (e) { safeLog(ctx, e); }

    try {
      if (ctx && typeof ctx.effect === 'function') {
        const unwatch = watchNotesDir(dir, rebuild);
        ctx.effect(() => () => { try { unwatch(); } catch { /* ignore */ } }, 'dsh-notes: watcher');
      } else {
        watchNotesDir(dir, rebuild);
      }
    } catch (e) { safeLog(ctx, e); }

    try {
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    } catch (e) { safeLog(ctx, e); }
  } catch (e) {
    try {
      const log = ctx && ctx.log ? ctx.log : console;
      if (log && typeof log.error === 'function') log.error('[dsh-notes] apply failed', e);
    } catch { /* never throw outward */ }
  }
}
