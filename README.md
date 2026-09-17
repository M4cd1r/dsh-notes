# dsh-notes

DSH global Markdown notes with workspace binding: sidebar Notes & bookmarks panel, host tools + file fallback.

DSH 全局 Markdown 笔记（带工作区绑定）：侧栏「笔记与书签」面板、宿主工具 + 文件回退。中文文档见 [README.zh-CN.md](./README.zh-CN.md)。

## Install

```bash
npm i dsh-notes
```

Register the sidebar entry with the one-row cordis patch (bundled as `cordis.patch.yml`, wired via `package.json` → `dsh.bundle.patch`):

```yaml
- insert:
    - id: notes
      name: dsh-notes
```

Requires `dsh >= 0.1.5-rc.1` and Node `>= 22.19.0`.

## Usage

1. Click the bookmark footer icon in the sidebar (`sidebar.footer.action`).
2. A full page replaces the main view (`data-dsh-notes="page"`; modal fallback if no main container exists).
3. Pick a note from the list (search + workspace/category filters), then toggle **Preview|Edit** to read or modify it. Title is required; the editor shows a live `{n} / 10000` counter and blocks saving over the limit.
4. Notes carry their workspace binding and a jump button to the session that created them (`Open creating session`).

## Limits

| Field      | Limit                                                        |
| ---------- | ------------------------------------------------------------ |
| `body`     | max 10000 chars (`too-long` error on save; counter `{n} / 10000`) |
| `title`    | required, non-empty, max 120 chars                           |
| `tags`     | max 8 tags, each max 32 chars (deduped, trimmed)             |
| `category` | closed list: `idea`, `task`, `session`, `link`, `note`       |
| `source`   | closed list: `manual`, `agent`, `fallback`                   |
| `workspace`| required, non-empty, max 160 chars                           |

List/search results are capped (`list` default 100 / max 200, `search` max 100).

## Tools

The host registers six agent tools plus three HTTP routes (`GET /dsh-notes/state`, `POST /dsh-notes/action`, `POST /dsh-notes/report`).

| Tool            | Args                                                                 | Returns              |
| --------------- | -------------------------------------------------------------------- | -------------------- |
| `notes.create`  | `{ title, body?, workspace?, sessionId?, category?, tags? }`         | created note object  |
| `notes.list`    | `{ workspace?, category?, limit? }` (default 100, max 200)           | note array           |
| `notes.get`     | `{ id }`                                                             | note object or null  |
| `notes.search`  | `{ q, workspace?, category? }` (max 100 hits)                        | note array           |
| `notes.update`  | `{ id, title?, body?, tags?, category? }`                            | updated note object  |
| `notes.delete`  | `{ id }`                                                             | `true`               |

HTTP API mirrors the service: `GET /dsh-notes/state?workspace=<id>` returns `{ ok, notes, invalid }`; `POST /dsh-notes/action` accepts `{ action: "create" | "update" | "delete" | "repair", args }` (`repair` takes `{ file, note }` and re-saves a broken file); `POST /dsh-notes/report` accepts client error reports `{ level, kind, message }` (always `{ ok: true }`). Invalid files are reported in `invalid` and can be repaired by re-saving.

## Fallback: plain Markdown files with frontmatter

Every note is a file at `~/.dsh/notes/<uuid>.md` (`DSH_HOME` overrides `~`; the store scans `*.md` sorted, newest-first by `updatedAt`). When the host service is unavailable, create or edit the file directly with this exact frontmatter field list:

```markdown
---
id: 123e4567-e89b-12d3-a456-426614174000
title: "My note title"
workspace: "my-workspace"
sessionId: 
category: note
tags: ["note"]
source: fallback
createdAt: 1758124800000
updatedAt: 1758124800000
---
Body Markdown here (max 10000 chars).
```

Fields: `id` (uuid), `title`, `workspace`, `sessionId` (empty when none), `category`, `tags`, `source`, `createdAt` / `updatedAt` (ms epoch), then the `body` after the closing `---`. Manual entries default to category `note` and tag `note` (`笔记` in Chinese UI). The dir watcher picks up external edits automatically; malformed files show up under `invalid` instead of crashing.

## Scripts

| Script         | Command                                    |
| -------------- | ------------------------------------------ |
| `npm run check`  | `node --check` all sources               |
| `npm test`       | `node --test test/*.test.mjs` |
| `npm run smoke`  | sidebar/locales/routes guard (`scripts/smoke.mjs`) |
| `npm run verify` | `check` + `test` + `smoke` (CI runs this) |

Releases are automatic: pushing a `v*` tag runs `.github/workflows/release.yml` (`npm run verify`, `npm publish` to npm, `gh release create --generate-notes`).

## i18n

UI and docs ship in English + Chinese. The client auto-detects `navigator.language` (`zh` → Chinese), with a 中文/EN toggle persisted in `localStorage` (`dsh-notes.locale`). `README.zh-CN.md` is the Chinese source mirror of this file: same sections, same code and tables, Chinese prose with English identifiers kept as-is.
