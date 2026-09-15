# find-unfold

Find reveals a match in folded children — the folds over it open, as VS Code's. Upstream has neither
find nor folds on list items.

- a step — next or previous match; the folds over the match stepped to open
- typing, a toggle, a replace — no fold opens: a single letter matches everywhere
- the rest — counted and decorated, folded or not
- opened folds stay open once find closes

Files:

- `src/webview/lib/find-replace.ts` — the stepped-to match unfolded
- `src/webview/lib/fold.ts` — `unfoldAt`, out of `unfoldAtCaret`
- `tests/unit/find-unfold.test.ts` — ours
