# external-reload

A file changed from outside — a tool, git, another editor, a sibling panel — reaches the editor, the
caret in it or not. No old copy of the file is written over it.

Upstream drops a host update while the editor is `activeElement`, to keep echoes of its own typing
out — and the editor stays `activeElement` while another window has focus. The update is gone for
good; the next keystroke writes the stale text over the change.

The host tells an echo apart instead. On a watcher or text document signal it reads the file —
skipped while a host write is in flight or began during the read, skipped where it equals the text
held. What is left is external: held, the pending webview write dropped, every panel told
`external: true`. A dirty text document — unsaved text of a text editor — is taken as is.

A host write does not go over a change not taken yet. The host keeps the text last seen in the file —
read there, or written — and writes in turn; a write finding the file moved from it is not written,
the file's text taken as external instead. The signal of that change may have been skipped for a host
write in flight — and a write of the text already there brings none after it.

A webview write carries the revision of the text it was built on — the count of changes from outside
taken, a revert among them. One older than the host's is dropped, the panel told the text again.

The webview lets `external` past its focus guard, and a new revision too; it keeps the caret where its
text still stands.

The panes hold the one document: the first takes the text from the host, and gives it to every other
pane whole. A text in place of the text is not a change to forward — its operations, sent on, land on
a pane that took the document as it opened, and leave the old text standing under the new. A pane so
left goes on taking every later change at the wrong place: the file changes outside, and the pane
shows what it showed.

Files:

- `src/extension/MadenMarkdownEditorProvider.ts` — the watcher, the text document, the sibling
  broadcast, a write count, a writer, the revision
- `src/shared/messages.ts` — `external`, `revision`
- `src/webview/hooks/use-webview-document-state.ts` — carries them
- `src/webview/App.tsx` — the guard, the caret, the revision, the text to every pane
- `src/webview/lib/panes.ts` — `takeDocument`: the text taken by every pane, its operations not
  forwarded
- `src/extension/services/external-reload.ts` — ours
- `src/webview/lib/keep-selection.ts` — ours
- `tests/unit/external-reload.test.ts` — ours
