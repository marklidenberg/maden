# keep-tabs

Reopening a tab as maden, where its group already holds maden on that file, keeps both tabs.
Upstream loses one: vscode holds one tab per file per editor in a group, so it moves the maden tab
into the reopened one's slot and closes the reopened one.

A merge is told from a close by that move — a close alone moves nothing. The closed tab comes back
as maden at `#tab-n`, a uri of its own, pinned as it was. The provider reads the file under the
fragment, so the tabs share its document.

A `#tab-n` tab reopened as text keeps its fragment — a text model of its own on the same file.

Files:

- `src/extension/MadenMarkdownEditorProvider.ts` — registered through `keepTabsProvider`
- `src/extension/extension.ts` — the watcher
- `src/extension/services/keep-tabs.ts` — ours: the watcher, the provider wrapper
- `src/extension/services/tab-merge.ts` — ours: a merge told from a close
- `tests/unit/keep-tabs.test.ts` — ours
