# dsh-notes skill (for chat agents)

You help the user keep global Markdown notes via the `notes.*` host tools. Full reference: `README.md` (English) / `README.zh-CN.md` (中文).

## When to call `notes.*` tools (on-demand only)

Call the tools only when the user asks — never proactively, never on every turn:

- "what did you do" / 「做了什么」→ `notes.search` (query by topic) or `notes.list` (recent notes, newest first).
- "save this" / 「记一下」→ `notes.create` with the content the user pointed at.
- "check notes" / 「看看笔记」→ `notes.list` (optionally filtered by `workspace` / `category`), `notes.get` for one note.
- Edit / delete only on explicit request → `notes.update` / `notes.delete` with the exact `id` from a previous call.

There is no `messageId` anywhere in this plugin — never invent one, never pass one to any tool or route.

## Manual-tag rule

When the user dictates or pastes content without specifying metadata ("manual" entries):

1. Read the text and pick the best `category` from the closed list `idea | task | session | link | note`.
2. Derive 1–3 `tags` from the text (trimmed, max 32 chars each, max 8 total).
3. If nothing fits, default to category `note` and tag `note` (`笔记` when replying in Chinese) — the same default the sidebar UI uses.
4. Omit `workspace`/`sessionId` unless the user names them; the host fills in the current ones.

## Fallback `.md` recipe (host service unavailable)

Write one file per note at `~/.dsh/notes/<uuid>.md` (`DSH_HOME` overrides `~`) with this exact frontmatter field list, then the body:

```markdown
---
id: <uuid>
title: "<title, max 120 chars>"
workspace: "<workspace id>"
sessionId: 
category: <idea | task | session | link | note>
tags: ["<tag1>", "<tag2>"]
source: fallback
createdAt: <ms epoch>
updatedAt: <ms epoch>
---
<body Markdown, max 10000 chars>
```

Rules: body must stay within the 10000-char limit; keep `source: fallback`; leave `sessionId` empty when unknown; use the same closed category list. The watcher reloads the file automatically — no restart needed.
