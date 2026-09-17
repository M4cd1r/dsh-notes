;(function () {
  let load = null;
  try {
    if (typeof window !== 'undefined' && window && typeof window.__ModuleLoader__ === 'object') {
      load = window.__ModuleLoader__.load.bind(window.__ModuleLoader__);
    }
  } catch { load = null; }
  if (!load) return;
  try {
    load({
      id: 'dsh-notes',
      factory: (require) => {
        const module = { exports: {} };
        const NOTES_LOCALES = {
          zh: {
            'notes.title': '笔记与书签', 'notes.new': '新建笔记', 'notes.search': '搜索笔记…',
            'notes.filterWorkspace': '全部工作区', 'notes.filterCategory': '全部分类',
            'notes.preview': '预览', 'notes.edit': '编辑', 'notes.save': '保存', 'notes.cancel': '取消',
            'notes.delete': '删除', 'notes.deleteConfirm': '删除这条笔记?',
            'notes.charLimit': '{n} / 10000', 'notes.sessionOpen': '打开创建会话',
            'notes.sessionMissing': '创建会话不可用', 'notes.createdAt': '创建于',
            'notes.updatedTitle': '标题(必填,最多 120 字)',
            'notes.empty': '还没有笔记。用上方按钮创建第一条。', 'notes.emptySearch': '没有匹配的笔记。',
            'notes.invalidNote': '文件格式无效:{error}', 'notes.fixByResave': '重新保存修复',
            'notes.errorTooLong': '正文超过 10000 字,无法保存。', 'notes.errorLoadFailed': '加载失败,重试。',
            'notes.errorSaveFailed': '保存失败:{error}',
            'cat.idea': '想法', 'cat.task': '任务', 'cat.session': '会话', 'cat.link': '链接', 'cat.note': '笔记',
            'tag.noteDefault': '笔记',
          },
          en: {
            'notes.title': 'Notes & bookmarks', 'notes.new': 'New note', 'notes.search': 'Search notes…',
            'notes.filterWorkspace': 'All workspaces', 'notes.filterCategory': 'All categories',
            'notes.preview': 'Preview', 'notes.edit': 'Edit', 'notes.save': 'Save', 'notes.cancel': 'Cancel',
            'notes.delete': 'Delete', 'notes.deleteConfirm': 'Delete this note?',
            'notes.charLimit': '{n} / 10,000', 'notes.sessionOpen': 'Open creating session',
            'notes.sessionMissing': 'Creating session unavailable', 'notes.createdAt': 'Created',
            'notes.updatedTitle': 'Title (required, max 120 chars)',
            'notes.empty': 'No notes yet. Create the first one above.', 'notes.emptySearch': 'No matching notes.',
            'notes.invalidNote': 'Invalid file: {error}', 'notes.fixByResave': 'Fix by re-saving',
            'notes.errorTooLong': 'Body exceeds 10,000 chars — not saved.', 'notes.errorLoadFailed': 'Load failed — retry.',
            'notes.errorSaveFailed': 'Save failed: {error}',
            'cat.idea': 'Idea', 'cat.task': 'Task', 'cat.session': 'Session', 'cat.link': 'Link', 'cat.note': 'Note',
            'tag.noteDefault': 'note',
          },
        };
        function detectNotesLocale(override) {
          try {
            if (override === 'zh' || override === 'en') return override;
            const lang = (typeof navigator !== 'undefined' && navigator.language) || '';
            return String(lang).toLowerCase().startsWith('zh') ? 'zh' : 'en';
          } catch { return 'en'; }
        }
        function makeNotesT(lang) {
          return (key, params) => {
            let text = (NOTES_LOCALES[lang] && NOTES_LOCALES[lang][key]) ?? NOTES_LOCALES.en[key] ?? key;
            if (params) for (const [k, v] of Object.entries(params)) text = text.split('{' + k + '}').join(String(v));
            return text;
          };
        }
        let lang = 'en';
        try { lang = detectNotesLocale(typeof localStorage !== 'undefined' ? localStorage.getItem('dsh-notes.locale') : null); } catch { lang = 'en'; }
        void lang;
        const inject = ['slots', 'sessions'];
        const BASE = '/dsh-notes';

        function getService(ctx, n) {
          try { if (ctx && typeof ctx.get === 'function') { const v = ctx.get(n); if (v !== undefined) return v; } } catch {}
          try { const d = ctx ? ctx[n] : undefined; if (d !== undefined) return d; } catch {}
          return undefined;
        }

        function report(kind, message) {
          try {
            void fetch(BASE + '/report', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ level: 'error', kind: String(kind), message: String(message || kind).slice(0, 1000) }),
            }).catch(() => {});
          } catch { /* ignore */ }
        }

        function BookmarkIcon(props) {
          const React = props.React;
          return React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true' },
            React.createElement('path', { d: 'M6 3.5h4a1 1 0 0 1 1 1V13l-3-2-3 2V4.5a1 1 0 0 1 1-1z' }));
        }

        let pageState = { mounted: false, mode: null, prevDisplay: '', mainEl: null, hostEl: null, root: null, ctx: null };

        function mountNotesPanel(ctx, React, createRoot, NotesPage) {
          if (pageState.mounted) return;
          const candidates = ['[data-dsh-main]', 'main', '[role=main]'];
          let mainEl = null;
          for (const sel of candidates) {
            try { mainEl = document.querySelector(sel); if (mainEl) break; } catch {}
          }
          const hostEl = document.createElement('div');
          hostEl.setAttribute('data-dsh-notes', 'page');
          hostEl.setAttribute('data-dsh-plugin', 'notes');
          if (mainEl && mainEl.parentNode) {
            pageState = { mounted: true, mode: 'page', prevDisplay: mainEl.style.display, mainEl, hostEl, root: null, ctx };
            mainEl.style.display = 'none';
            mainEl.parentNode.insertBefore(hostEl, mainEl.nextSibling);
          } else {
            hostEl.setAttribute('data-dsh-notes-mode', 'modal-fallback');
            hostEl.style.cssText = 'position:fixed;inset:0;z-index:60;background:var(--dsh-bg,#fff)';
            document.body.appendChild(hostEl);
            pageState = { mounted: true, mode: 'modal', prevDisplay: '', mainEl: null, hostEl, root: null, ctx };
          }
          try {
            const root = createRoot(hostEl);
            pageState.root = root;
            root.render(React.createElement(NotesPage, { onClose: unmountNotesPanel }));
          } catch (e) { report('mount', e && e.message ? e.message : e); try { hostEl.textContent = 'Notes failed to mount'; } catch {} }
        }

        function unmountNotesPanel() {
          try { pageState.root && pageState.root.unmount(); } catch {}
          try { pageState.hostEl && pageState.hostEl.parentNode && pageState.hostEl.parentNode.removeChild(pageState.hostEl); } catch {}
          try { if (pageState.mode === 'page' && pageState.mainEl) pageState.mainEl.style.display = pageState.prevDisplay; } catch {}
          pageState = { mounted: false, mode: null, prevDisplay: '', mainEl: null, hostEl: null, root: null, ctx: null };
        }

        const NOTES_CATS = ['idea', 'task', 'session', 'link', 'note'];
        const NOTES_NEW_ID = '__new__';
        const NOTES_LIMIT = 10000;

        function escNotesHtml(s) {
          return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
        }

        function miniMd(src) {
          let out = escNotesHtml(src);
          out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
          out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
          out = out.replace(/\n/g, '<br>');
          return out;
        }

        function postNotesAction(payload) {
          return fetch(BASE + '/action', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
          }).then((r) => r.json());
        }

        function buildNotesPage(React, primitives) {
          void primitives;
          return function NotesPage(props) {
            const [notes, setNotes] = React.useState([]);
            const [invalid, setInvalid] = React.useState([]);
            const [loading, setLoading] = React.useState(true);
            const [error, setError] = React.useState('');
            const [q, setQ] = React.useState('');
            const [workspaceFilter, setWorkspaceFilter] = React.useState('');
            const [categoryFilter, setCategoryFilter] = React.useState('');
            const [selectedId, setSelectedId] = React.useState(null);
            const [mode, setMode] = React.useState('preview');
            const [draftTitle, setDraftTitle] = React.useState('');
            const [draftBody, setDraftBody] = React.useState('');
            const [locale, setLocale] = React.useState(lang);
            const t = makeNotesT(locale);

            function load() {
              setLoading(true);
              let p = null;
              try {
                p = fetch(BASE + '/state?workspace=' + encodeURIComponent(''));
              } catch (e) {
                setError(t('notes.errorLoadFailed'));
                setLoading(false);
                return Promise.resolve();
              }
              return p.then((r) => r.json()).then((data) => {
                if (data && data.ok === false) throw new Error((data && data.error) || 'load');
                setNotes(data && Array.isArray(data.notes) ? data.notes : []);
                setInvalid(data && Array.isArray(data.invalid) ? data.invalid : []);
                setError('');
              }).catch((e) => {
                setError(t('notes.errorLoadFailed'));
                report('notes-load', (e && e.message) || e);
              }).then(() => { setLoading(false); });
            }

            React.useEffect(() => { load(); }, []);

            const workspaces = React.useMemo(() => {
              const seen = {};
              notes.forEach((n) => { if (n && n.workspace) seen[n.workspace] = true; });
              return Object.keys(seen).sort();
            }, [notes]);

            const needle = q.trim().toLowerCase();
            const filtered = notes.filter((n) => {
              if (!n) return false;
              if (workspaceFilter && n.workspace !== workspaceFilter) return false;
              if (categoryFilter && n.category !== categoryFilter) return false;
              if (needle) {
                const hay = ((n.title || '') + '\n' + (n.body || '') + '\n' + (Array.isArray(n.tags) ? n.tags.join(' ') : '')).toLowerCase();
                if (hay.indexOf(needle) === -1) return false;
              }
              return true;
            });

            const isNew = selectedId === NOTES_NEW_ID;
            const selected = isNew
              ? { id: NOTES_NEW_ID, title: draftTitle, body: draftBody, workspace: workspaceFilter || '', category: 'note', tags: [t('tag.noteDefault')], sessionId: null, createdAt: Date.now(), updatedAt: Date.now() }
              : (notes.find((n) => n && n.id === selectedId) || null);

            function fmtDate(ts) {
              try { return new Date(ts).toLocaleString(locale); } catch { return ''; }
            }
            function fmtDay(ts) {
              try { return new Date(ts).toLocaleDateString(locale); } catch { return ''; }
            }

            function pick(id) {
              const n = notes.find((x) => x && x.id === id) || null;
              setSelectedId(id);
              setDraftTitle(n ? (n.title || '') : '');
              setDraftBody(n && n.body ? n.body : '');
              setMode('preview');
            }

            function startNew() {
              setSelectedId(NOTES_NEW_ID);
              setDraftTitle('');
              setDraftBody('');
              setMode('edit');
            }

            function toggleLocale() {
              const next = locale === 'zh' ? 'en' : 'zh';
              setLocale(next);
              try { if (typeof localStorage !== 'undefined') localStorage.setItem('dsh-notes.locale', next); } catch {}
            }

            function afterMutation(data) {
              if (data && data.ok === false) throw new Error((data && data.error) || 'save');
              setError('');
              return load();
            }
            function failSave(e) {
              setError(t('notes.errorSaveFailed', { error: String((e && e.message) || e) }));
            }

            function save() {
              const len = [...draftBody].length;
              if (len > NOTES_LIMIT) { setError(t('notes.errorTooLong')); return; }
              const payload = isNew
                ? { action: 'create', args: { title: draftTitle, body: draftBody, workspace: workspaceFilter || undefined, category: 'note', tags: [t('tag.noteDefault')] } }
                : { action: 'update', args: { id: selectedId, title: draftTitle, body: draftBody } };
              postNotesAction(payload).then((data) => {
                if (isNew && data && data.note && data.note.id) setSelectedId(data.note.id);
                afterMutation(data);
              }).catch(failSave);
            }

            function removeNote() {
              if (isNew || !selected) return;
              let ok = false;
              try { ok = confirm(t('notes.deleteConfirm')); } catch { ok = false; }
              if (!ok) return;
              postNotesAction({ action: 'delete', args: { id: selectedId } }).then((data) => {
                setSelectedId(null);
                setMode('preview');
                afterMutation(data);
              }).catch(failSave);
            }

            function fixInvalid(entry) {
              const id = String((entry && entry.file) || '').replace(/\.md$/, '');
              const found = notes.find((n) => n && n.id === id);
              const args = found
                ? { id: found.id, title: found.title, body: found.body }
                : { id, title: id, body: '' };
              postNotesAction({ action: 'update', args }).then(afterMutation).catch(failSave);
            }

            function openSession(sid) {
              try {
                const sessions = getService(pageState.ctx, 'sessions');
                if (sessions && typeof sessions.open === 'function') { sessions.open(sid); return; }
              } catch {}
              try {
                if (typeof location !== 'undefined' && location) location.hash = '#/sessions/' + encodeURIComponent(sid);
              } catch {}
            }

            const count = [...draftBody].length;
            const saveDisabled = count > NOTES_LIMIT || draftTitle.trim() === '';

            const header = React.createElement('div', { 'data-dsh-notes': 'header' },
              React.createElement('h2', null, t('notes.title')),
              React.createElement('input', {
                value: q, onChange: (e) => setQ(e.target.value),
                placeholder: t('notes.search'), 'aria-label': t('notes.search'),
              }),
              React.createElement('select', {
                value: workspaceFilter, onChange: (e) => setWorkspaceFilter(e.target.value),
                'aria-label': t('notes.filterWorkspace'),
              },
                React.createElement('option', { value: '' }, t('notes.filterWorkspace')),
                workspaces.map((w) => React.createElement('option', { key: w, value: w }, w))),
              React.createElement('select', {
                value: categoryFilter, onChange: (e) => setCategoryFilter(e.target.value),
                'aria-label': t('notes.filterCategory'),
              },
                React.createElement('option', { value: '' }, t('notes.filterCategory')),
                NOTES_CATS.map((c) => React.createElement('option', { key: c, value: c }, t('cat.' + c)))),
              React.createElement('button', { type: 'button', onClick: toggleLocale }, locale === 'zh' ? 'EN' : '中文'),
              React.createElement('button', { type: 'button', onClick: startNew }, t('notes.new')),
              props && props.onClose
                ? React.createElement('button', { type: 'button', onClick: props.onClose, 'aria-label': 'close' }, '×')
                : null);

            let listBody = null;
            if (loading) listBody = React.createElement('div', null, '…');
            else if (notes.length === 0) listBody = React.createElement('div', null, t('notes.empty'));
            else if (filtered.length === 0) listBody = React.createElement('div', null, t('notes.emptySearch'));
            else listBody = filtered.map((n) => React.createElement('button', {
              key: n.id, type: 'button', onClick: () => pick(n.id),
              'data-dsh-notes': 'row', 'data-selected': n.id === selectedId ? 'true' : 'false',
            },
              React.createElement('div', null, n.title || ''),
              React.createElement('span', null, n.workspace || ''),
              React.createElement('span', null, t('cat.' + (n.category || 'note'))),
              React.createElement('span', null, Array.isArray(n.tags) ? n.tags.join(', ') : ''),
              React.createElement('span', null, fmtDay(n.updatedAt))));

            const invalidSection = (invalid && invalid.length)
              ? React.createElement('div', { 'data-dsh-notes': 'invalid' },
                invalid.map((entry, i) => React.createElement('div', { key: (entry && entry.file) || String(i) },
                  React.createElement('span', null, t('notes.invalidNote', { error: (entry && entry.error) || '' })),
                  React.createElement('button', { type: 'button', onClick: () => fixInvalid(entry) }, t('notes.fixByResave')))))
              : null;

            let detail = null;
            if (!selected) {
              detail = React.createElement('div', { 'data-dsh-notes': 'detail-empty' }, loading ? '…' : t('notes.empty'));
            } else {
              const toggle = React.createElement('div', null,
                React.createElement('button', { type: 'button', onClick: () => setMode('preview'), disabled: mode === 'preview' }, t('notes.preview')),
                React.createElement('button', { type: 'button', onClick: () => setMode('edit'), disabled: mode === 'edit' }, t('notes.edit')));
              let pane = null;
              if (mode === 'edit') {
                pane = React.createElement('div', null,
                  React.createElement('input', {
                    value: draftTitle, maxLength: 120, onChange: (e) => setDraftTitle(e.target.value),
                    placeholder: t('notes.updatedTitle'), 'aria-label': t('notes.updatedTitle'),
                  }),
                  React.createElement('textarea', {
                    value: draftBody, onChange: (e) => setDraftBody(e.target.value),
                    'aria-label': t('notes.edit'),
                  }),
                  React.createElement('div', null, t('notes.charLimit', { n: [...draftBody].length })),
                  React.createElement('button', { type: 'button', onClick: save, disabled: saveDisabled }, t('notes.save')),
                  React.createElement('button', {
                    type: 'button',
                    onClick: () => {
                      setDraftTitle(selected.title || '');
                      setDraftBody(selected.body || '');
                      setMode('preview');
                    },
                  }, t('notes.cancel')),
                  isNew ? null : React.createElement('button', { type: 'button', onClick: removeNote }, t('notes.delete')));
              } else {
                const html = miniMd(selected.body);
                pane = React.createElement('div', null,
                  React.createElement('h3', null, selected.title || ''),
                  React.createElement('div', { dangerouslySetInnerHTML: { __html: html } }));
              }
              const sid = selected.sessionId;
              const sessionCtl = sid
                ? React.createElement('button', { type: 'button', onClick: () => openSession(sid) }, t('notes.sessionOpen'))
                : React.createElement('span', { title: t('notes.sessionMissing') }, t('notes.sessionMissing'));
              const footer = React.createElement('div', null,
                React.createElement('span', null, selected.workspace || ''),
                sessionCtl,
                React.createElement('span', null, t('notes.createdAt') + ': ' + fmtDate(selected.createdAt)),
                React.createElement('span', null, fmtDate(selected.updatedAt)));
              detail = React.createElement('div', { 'data-dsh-notes': 'detail' }, toggle, pane, footer);
            }

            return React.createElement('div', { 'data-dsh-notes': 'page' },
              header,
              error ? React.createElement('div', { role: 'alert' }, error) : null,
              React.createElement('div', { style: { display: 'flex' } },
                React.createElement('div', { 'data-dsh-notes': 'list' }, listBody, invalidSection),
                detail));
          };
        }

        function apply(ctx) {
          const slots = getService(ctx, 'slots');
          if (!slots || typeof slots.inject !== 'function' || typeof slots.register !== 'function') return;
          let React = null, createRoot = null, primitives = null;
          try { React = require('react'); } catch { return; }
          try { createRoot = require('react-dom/client').createRoot; } catch { return; }
          try { primitives = require('@deepseek-ai/dsh-client-ui-primitives'); } catch { primitives = null; }
          // NotesPage component lands in Task 8; stub placeholder here:
          let NotesPage = null;
          try { NotesPage = (typeof buildNotesPage === 'function') ? buildNotesPage(React, primitives) : () => React.createElement('div', null, 'Notes (Task 8)'); }
          catch (e) { report('notes-page-build', e && e.message ? e.message : e); NotesPage = () => React.createElement('div', null, 'Notes (Task 8)'); }
          class Boundary extends React.Component {
            constructor(props) { super(props); this.state = { crashed: false }; }
            static getDerivedStateFromError() { return { crashed: true }; }
            componentDidCatch(error) { report('render-crash', error && error.message ? error.message : error); }
            render() { return this.state.crashed ? null : this.props.children; }
          }
          const guard = (Component) => function Guarded(props) {
            return React.createElement(Boundary, null, React.createElement(Component, props));
          };
          let ShippedTooltip = null;
          try { ShippedTooltip = primitives && primitives.Tooltip ? primitives.Tooltip : null; } catch { ShippedTooltip = null; }
          function Tooltip(props) {
            if (ShippedTooltip) return React.createElement(ShippedTooltip, props);
            const child = props ? props.children : null;
            const tip = props && typeof props.label === 'string' ? props.label : '';
            if (!React.isValidElement(child) || tip === '') return child === undefined ? null : child;
            return React.cloneElement(child, { title: child.props && child.props.title ? child.props.title : tip });
          }
          function SidebarEntry() {
            const label = 'Notes & bookmarks';
            return React.createElement(Tooltip, { label, side: 'right', delayMs: 400 },
              React.createElement('button', {
                type: 'button',
                'data-dsh-notes': 'entry',
                title: label,
                'aria-label': label,
                onClick: () => { try { mountNotesPanel(ctx, React, createRoot, NotesPage); } catch (error) { report('entry-open', error && error.message ? error.message : error); } },
              },
                React.createElement(BookmarkIcon, { React }),
              ));
          }
          try {
            ctx.effect(() => slots.inject('sidebar.footer.action', () => slots.register(
              { name: 'sidebar.footer.action', id: 'notes', order: 21, label: 'Notes & bookmarks' },
              guard(SidebarEntry),
            )), 'dsh-notes: sidebar entry');
          } catch (e) { report('sidebar-register', e && e.message ? e.message : e); }
        }

        module.exports = { apply, inject };
        return module.exports;
      },
    });
  } catch { /* ignore */ }
})();
