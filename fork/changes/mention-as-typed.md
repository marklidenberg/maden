# mention-as-typed

`@name` is saved as typed, not as `[name](mention:name)` — `@` tasks in `tasks.md` stay intact.
Upstream parses `@name` into a mention.

`remarkMention` is off: `@name` opens as text, `[name](mention:id)` as a link.

Files:

- `src/webview/components/editor/plugins/markdown-kit.tsx` — `remarkMention` dropped
- `tests/unit/mention-as-typed.test.ts` — ours
