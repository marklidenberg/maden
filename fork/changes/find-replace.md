# find-replace

Find and replace, as VS Code's widget — `cmd + f`, the one shortcut. Upstream has no find, and VS
Code's own is off for the webview.

- the widget — top right, under the bar: `>` shows the replace row; find with match case, whole
  word, regex; `1 of 54`; previous, next; find in selection; close. Replace with preserve case, one, all
- `cmd + f` — caught on the webview's window, capturing, before VS Code's listener; a selection within
  one block seeds the search
- matches — per lowest block, across marks and inlines; decorations, the file untouched
- `Enter` / `Shift+Enter` — next, previous; in replace — one, `cmd+Enter` — all
- `Escape` — closes; from the widget, onto the current match
- find in selection — the selection, or the caret's block; a range ref, so edits move it
- replace — raw text ops, past autoformat; regex `$1` `$<name>` `$&`; preserve case as VS Code's;
  replace all backwards, one undo

Files:

- `src/webview/lib/find-replace.ts` — ours: matching, replacement, plugin, transforms
- `src/webview/components/ui/find-replace.tsx` — ours: widget, leaf
- `src/webview/components/editor/plugins/find-replace-kit.tsx` — ours
- `src/webview/components/editor/editor-kit.tsx` — `FindReplaceKit`
- `tests/unit/find-replace.test.ts` — ours
