# session

A file reopened — a restart too — comes back as it was left: its panes in order, the pins, the
focused pane, each pane's zooms, folds and caret. Upstream starts a file afresh.

Kept per file in `localStorage`, as spotlight's recents, a moment after the last move. Ids are new
each load, so a block is kept by its index and its text — found there, else at the nearest block of
that text, else dropped. A caret outside the zoom goes to its root's end.

Files:

- `src/webview/lib/session.ts` — ours: the stored session, a view out and back, the plugin telling a move
- `src/webview/lib/panes.ts` — panes': a pane's editor by id
- `src/webview/components/ui/panes.tsx` — panes': the panes off the session, the views put back, saved
- `src/webview/components/editor/plugins/panes-kit.tsx` — panes': the plugin
- `src/webview/App.tsx` — the file's path to the panes
- `tests/unit/session.test.ts` — ours
