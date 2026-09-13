# external-reload

A file changed from outside — a tool, git, another editor, a sibling panel — reaches the editor, the
caret in it or not.

Upstream drops a host update while the editor is `activeElement`, to keep echoes of its own typing
out — and the editor stays `activeElement` while another window has focus. The update is gone for
good; the next keystroke writes the stale text over the change.

The host tells an echo apart instead. On a watcher or text document signal it reads the file —
skipped while a host write is in flight or began during the read, skipped where it equals the text
held. What is left is external: held, the pending webview write dropped, every panel told
`external: true`. A dirty text document — unsaved text of a text editor — is taken as is.

The webview lets `external` past its focus guard, and keeps the caret where its text still stands.

Files:

- `src/extension/MadenMarkdownEditorProvider.ts` — the watcher, the text document, the sibling
  broadcast, a write count
- `src/shared/messages.ts` — `external`
- `src/webview/hooks/use-webview-document-state.ts` — carries it
- `src/webview/App.tsx` — the guard, the caret
- `src/extension/services/external-reload.ts` — ours
- `src/webview/lib/keep-selection.ts` — ours
- `tests/unit/external-reload.test.ts` — ours
