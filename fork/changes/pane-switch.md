# pane-switch

A click in another pane takes it at once — the caret where the click put it, the two panes it
touches rendered again, not every one. Upstream has no panes.

A switch focused the pane's editor in the effect the click's state set off — before the browser's
own focus, the editor still without a selection: slate took the DOM selection away, the caret gone
until a second click. Every pane rendered again with the column, and the pane left closed its find,
open or not — a redecoration rendering the whole pane anew.

- the focus — a moment after the click's own; a pane the click reached has it by then, where it
  pressed; a pane focused otherwise — at its selection
- a pane's editor — rendered again as its own props move alone
- the find of the pane left — closed where it is open

Slate's focused context still renders the pane focused and the pane left, as long as the document.

Files:

- `src/webview/App.tsx` — panes': the pane's focus effect
- `src/webview/components/ui/panes.tsx` — panes': `PaneContent`, the pane's editor memoized
