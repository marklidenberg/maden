# panes

The page splits into panes, one above the other, each a view of the one document — its own zoom,
breadcrumb, folds and caret, as tall as its text. A plus in the bar opens a pane under the focused
one, split off it: the same zoom, the same folds, the caret where it stood. Each pane carries a pin
in its top right corner, on the pane, as the bar's buttons; more than one, a close beside it and a
small grip at the pane's top left, dragged to reorder — a line shows where it lands. The focused
pane is ringed; a click or the caret focuses one. The last pane stays, closed or not. Upstream
shows the document once.

The pin keeps a pane's zoom: a spotlight's pick other than its root opens in a new pane under it,
zoomed in there, the caret its.

The singletons — the three dots, the magnifier, the bar's toggle, the plus, the bar, the find — act
on the focused pane alone: the spotlight opens and jumps there, `mod+f` finds there, the bar's
buttons are its; an unfocused pane's find closes. The host — its text in, the editor's out, exports
— talks to the first pane; the others take its every change.

A pane is an editor of its own; the document is one. Each pane's plugin runs first in the kit and
sends the flush's own operations on to every other pane, applied as they are — the ids kept, out of
the history, the caret held; one that will not take them is given the whole document again. The
history is one object, shared: an undo in any pane undoes the last change wherever it was typed.

Files:

- `src/webview/lib/panes.ts` — ours: the panes' state, the plus's event, the document across the panes
- `src/webview/components/ui/panes.tsx` — ours: the column, the corner buttons, the grip, the drag, the ring
- `src/webview/components/app/pane-add-button.tsx` — ours: the plus
- `src/webview/components/editor/plugins/panes-kit.tsx` — ours
- `src/webview/App.tsx` — the editor per pane; the host's sync the first pane's; focus, find, pin
- `src/webview/components/app/appearance-menu.tsx` — the plus, in the bar
- `src/webview/components/editor/editor-kit.tsx` — the kit, first
- `src/webview/components/ui/spotlight.tsx` — the focused pane's; a pinned one's pick in a new pane
- `src/webview/components/ui/find-replace.tsx` — the focused pane's
- `src/index.css` — the room under a pane's text, kept short
- `tests/unit/panes.test.ts` — ours
