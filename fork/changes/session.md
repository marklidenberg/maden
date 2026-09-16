# session

A file reopened — a restart too — comes back as it was left: its panes in order, the pins, the
focused pane, each pane's zooms, folds and caret. Upstream starts a file afresh.

Kept per file in `localStorage`, as spotlight's recents, a moment after the last move. Ids are new
each load, so a block is kept by its index and its text, the document's outline stored beside: a
block paired with the document as it was left — its text edited since, a block of its shape new
beside it — else found by its text, else dropped. A caret outside the zoom goes to its root's end.

The focused pane alone takes the focus as the panes open — each one's would, the last keeping it. A
pane taking the whole document forwards nothing it did before: the ids it gave the empty value it
opened with had every other pane take the document whole again — many panes on a long file held
the webview for most of a minute, nothing saved meanwhile.

Files:

- `src/webview/lib/session.ts` — ours: the stored session, a view out and back, the plugin telling a move
- `src/webview/lib/keep-blocks.ts` — fold-state's: an outline, and its blocks paired
- `src/webview/lib/panes.ts` — panes': a pane's editor by id; a whole document's flush not forwarded
- `src/webview/components/ui/panes.tsx` — panes': the panes off the session, the views put back, saved
- `src/webview/components/editor/plugins/panes-kit.tsx` — panes': the plugin
- `src/webview/App.tsx` — the file's path to the panes; the focused pane's autofocus
- `tests/unit/session.test.ts` — ours
- `tests/unit/edit-stability.test.ts` — edit-stability's: a whole document's flush
