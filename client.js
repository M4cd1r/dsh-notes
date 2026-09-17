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
      factory: () => {
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
        module.exports = { apply: () => {}, inject: ['slots'] };
        return module.exports;
      },
    });
  } catch { /* ignore */ }
})();
