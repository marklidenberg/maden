# find-unfold

Find reveals a match in folded children — the folds over it open, as VS Code's. Upstream has neither
find nor folds on list items.

- the current match — typed, stepped to, past a replace; the folds over its block open
- the rest — counted and decorated, folded or not
- opened folds stay open once find closes

Files:

- `src/webview/lib/find-replace.ts` — the current match unfolded
- `src/webview/lib/fold.ts` — `unfoldAt`, out of `unfoldAtCaret`
- `tests/unit/find-unfold.test.ts` — ours
