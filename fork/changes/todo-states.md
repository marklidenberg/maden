# todo-states

`- [ ]` opens as a todo again, with six boxes where upstream has two. A press on the box picks one:

- `[ ]` todo
- `[/]` in progress
- `[x]` done — `[X]` too
- `[-]` cancelled
- `[>]` deferred
- `[?]` question

GFM's check reads `[ ]` and `[x]` alone, so it is off, and a paragraph exit reads the six — a bullet's
box, as typed; an ordered item's stays text. `checked` stays upstream's; the other four ride beside it
as `todoState`, written back as the item's text. Enter drops it as upstream drops `checked`. The
box's border is the text's color, faded — upstream's input border is too faint to see.

Files:

- `src/webview/lib/todo-states.ts` — ours: states, read, write, Enter
- `src/webview/components/ui/todo-state.tsx` — ours: the box and its menu
- `src/webview/components/ui/block-list.tsx` — the box
- `src/webview/components/ui/block-list-static.tsx` — the box, static
- `src/webview/components/editor/plugins/list-kit.tsx` — Enter
- `src/webview/components/editor/plugins/markdown-kit.tsx` — reads the boxes
- `src/webview/lib/markdown-plate-conversion.ts` — writes them
- `tests/unit/todo-states.test.ts` — ours
