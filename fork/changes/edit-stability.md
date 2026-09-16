# edit-stability

Typing stays, the document holds, blocks stay where they stand — across the panes, the host's echoes,
reloads and undo. Upstream holds one editor and trusts its focus to tell an echo; the panes and the
host's own writes break that.

The host's text, in — `src/webview/lib/host-sync.ts`:

- an echo of the panes' own write — the host's reply, its formatting kept — is not taken over the text
  they hold. Upstream takes it in an editor not focused: every pane but the one typed in, a window left
  a moment — the typing since gone, the older text written back
- a change from outside, a newer revision — taken by the pane that hears it, every other pane given it
  whole; the same text heard again by another pane — nothing
- an editor made afresh — read-only toggled — opens on the text last held, not the one first heard

The editor's text, out:

- from whichever pane typed, on the revision heard; upstream's panes sent through the first alone
- not from an editor holding nothing of the file yet — its empty text would go over the file
- not a text that will not serialize — upstream sends an empty one

The panes:

- a pane gone apart from the one it takes a change from — the blocks' ids, or the blocks about the
  change — is given the whole document again; left apart, it takes every later change at the wrong
  place, and sends it on
- the history forgotten where the document is replaced — its operations would land at the wrong place
- an undo or a redo that will not apply — the document put back as it stood, the history dropped;
  upstream leaves it half applied, and the next press tries it again

The host:

- the linked text document is taken only where it is unsaved text of a text editor, as external;
  saved, the file is read through external-reload's checks. Upstream posts its copy — at open, and
  three times after — and the copy trails the host's own writes: an older text over the typing
- a webview ready — the text as it stands then, not a message queued at open
- a panel closed, the extension host going — the pending write made; upstream drops it

Files:

- `src/webview/lib/host-sync.ts` — ours: the text in, the edits out, the plugin
- `src/webview/lib/panes.ts` — panes': the holding, the check for a pane gone apart, the history
  forgotten, the guard
- `src/webview/components/editor/plugins/panes-kit.tsx` — panes': the plugins
- `src/webview/App.tsx` — the host's text to `host-sync.ts`; the plate's `onValueChange` gone
- `src/extension/MadenMarkdownEditorProvider.ts` — the linked text document, ready, a close, the
  writes pending
- `src/extension/extension.ts` — `deactivate`
- `tests/unit/edit-stability.test.ts` — ours
