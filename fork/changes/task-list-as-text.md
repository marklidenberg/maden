# task-list-as-text

`- [ ]` opens as a bullet with `[ ]` inside, not a todo — `[x]`, `[X]` too, saved as typed. Upstream
reads GFM task lists into todos; a plan's boxes are text.

Typing `[] ` or `[x] ` no longer turns a block into a todo. A todo from the menus still saves as
`- [ ]`, and reopens as a bullet.

Files:

- `src/webview/lib/markdown-task-list-as-text.ts` — ours
- `src/webview/components/editor/plugins/markdown-kit.tsx` — passes it
- `src/webview/components/editor/plugins/autoformat-kit.tsx` — `[] `, `[x] ` rules dropped
- `tests/unit/task-list-as-text.test.ts` — ours
