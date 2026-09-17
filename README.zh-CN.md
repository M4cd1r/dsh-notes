# dsh-notes

DSH 全局 Markdown 笔记（带工作区绑定）：侧栏「笔记与书签」面板、宿主工具 + 文件回退。

DSH global Markdown notes with workspace binding: sidebar Notes & bookmarks panel, host tools + file fallback. 英文文档见 [README.md](./README.md)。

## 安装

```bash
npm i dsh-notes
```

用单行 cordis 补丁注册侧栏入口（随包提供 `cordis.patch.yml`，经由 `package.json` → `dsh.bundle.patch` 接入）：

```yaml
- insert:
    - id: notes
      name: dsh-notes
```

要求 `dsh >= 0.1.5-rc.1`，Node `>= 22.19.0`。

## 用法

1. 点击侧栏底部的书签图标（`sidebar.footer.action`）。
2. 主视图被完整笔记页替换（`data-dsh-notes="page"`；若无主容器则降级为 modal）。
3. 在列表中选择笔记（支持搜索 + 工作区/分类过滤），用 **Preview|Edit**（预览|编辑）切换阅读与修改。标题必填；编辑器显示实时计数 `{n} / 10000`，超限禁止保存。
4. 笔记携带工作区绑定，并提供跳转到创建会话的按钮（`Open creating session`）。

## 限制

| 字段         | 限制                                                              |
| ------------ | ----------------------------------------------------------------- |
| `body`       | 最多 10000 字符（超限保存报错 `too-long`；计数器 `{n} / 10000`）   |
| `title`      | 必填、非空，最多 120 字符                                         |
| `tags`       | 最多 8 个标签，每个最多 32 字符（去空格、去重）                    |
| `category`   | 封闭列表：`idea`、`task`、`session`、`link`、`note`                |
| `source`     | 封闭列表：`manual`、`agent`、`fallback`                           |
| `workspace`  | 必填、非空，最多 160 字符                                         |

列表/搜索结果有上限（`list` 默认 100 / 最大 200，`search` 最多 100 条）。

## 工具

宿主注册六个 agent 工具，外加三条 HTTP 路由（`GET /dsh-notes/state`、`POST /dsh-notes/action`、`POST /dsh-notes/report`）。

| 工具              | 参数                                                                | 返回             |
| ----------------- | ------------------------------------------------------------------- | ---------------- |
| `notes.create`    | `{ title, body?, workspace?, sessionId?, category?, tags? }`        | 新建的 note 对象 |
| `notes.list`      | `{ workspace?, category?, limit? }`（默认 100，最大 200）            | note 数组        |
| `notes.get`       | `{ id }`                                                            | note 对象或 null |
| `notes.search`    | `{ q, workspace?, category? }`（最多 100 条命中）                   | note 数组        |
| `notes.update`    | `{ id, title?, body?, tags?, category? }`                           | 更新后的 note 对象 |
| `notes.delete`    | `{ id }`                                                            | `true`           |

HTTP API 与服务一一对应：`GET /dsh-notes/state?workspace=<id>` 返回 `{ ok, notes, invalid }`；`POST /dsh-notes/action` 接受 `{ action: "create" | "update" | "delete" | "repair", args }`（`repair` 接受 `{ file, note }`，用于重新保存损坏文件）；`POST /dsh-notes/report` 接受客户端错误上报 `{ level, kind, message }`（恒返回 `{ ok: true }`）。非法文件计入 `invalid`，重新保存即可修复，不会崩溃。

## 回退：带 frontmatter 的纯 Markdown 文件

每条笔记是 `~/.dsh/notes/<uuid>.md` 路径下的一个文件（`DSH_HOME` 可覆盖 `~`；store 按 `*.md` 扫描，以 `updatedAt` 倒序排列）。宿主服务不可用时，可直接新建或编辑文件，使用如下精确的 frontmatter 字段列表：

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

字段：`id`（uuid）、`title`、`workspace`、`sessionId`（无则留空）、`category`、`tags`、`source`、`createdAt` / `updatedAt`（毫秒时间戳），结束的 `---` 之后是 `body`。手动条目默认分类为 `note`、标签为 `note`（中文界面为 `笔记`）。目录监听会自动拾取外部修改；格式错误的文件进入 `invalid`，不会崩溃。

## 脚本

| 脚本               | 命令                                   |
| ------------------ | -------------------------------------- |
| `npm run check`    | 对全部源码执行 `node --check`          |
| `npm test`         | `node --test test/*.test.mjs`          |
| `npm run smoke`    | 侧栏/语言/路由守卫（`scripts/smoke.mjs`） |
| `npm run verify`   | `check` + `test` + `smoke`（CI 执行此项） |

发版自动化：推送 `v*` 标签即触发 `.github/workflows/release.yml`（`npm run verify`、`npm publish` 到 npm + GitHub Packages、`gh release create --generate-notes`）。

## i18n

界面与文档均提供英文 + 中文。客户端自动检测 `navigator.language`（`zh` 开头即中文），并提供 中文/EN 切换按钮，持久化于 `localStorage`（`dsh-notes.locale`）。`README.zh-CN.md` 是本文件的中文源镜像：章节、代码与表格一一对应，中文叙述、英文标识符保持原样。
