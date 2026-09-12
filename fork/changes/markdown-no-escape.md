# markdown-no-escape

Markdown is written back as it was typed. The serializer escapes anything that could ever start
a construct, so a plan line `- [~] - step_b` is saved as `- \[~\] - step\_b`, and a tight nested
list is saved with a blank line before every level.

Escaping is kept only where the construct we are inside needs it — a table cell's `|`, a link
label's brackets, a destination's parens, a title's quote, an ATX heading's trailing `#`, a code
fence's info string — plus whitespace and character references. A character that merely *could*
start something is written as typed.

Two serializer defaults come with it:

- `*` for emphasis, not upstream's `_`. `_` cannot mark emphasis inside a word, so with escaping
  off the serializer has to spell the neighbouring letters as character references — `fo&#x6F;_&#x62;ar_`
  for `foo*bar*`.
- `-` for bullets, which is what the source files use.

The price: text that looks like markdown is now read as markdown when the file is reopened — a
paragraph typed as `# title` comes back a heading. In the editor those sequences autoformat into
the block anyway, so there is little way to hold them as text.

Files:

- `src/webview/lib/markdown-serialize-options.ts` — ours, whole
- `src/webview/components/editor/plugins/markdown-kit.tsx` — the region passing it to the plugin
- `tests/unit/markdown-no-escape.test.ts` — ours, whole
- `tests/unit/markdown-full-file-debug.test.ts` — the region, `_` expectations to `*`
