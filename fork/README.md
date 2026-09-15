# Fork

A fork of [alialek/maden](https://github.com/alialek/maden). Our changes marked and
documented — every merge mechanical.

## Branches

- `main` — upstream, to the byte
- `fork-fba28f70` — the fork; the hash, the upstream commit last merged
- `fork-latest` — a tag on its tip; the GitHub description points here through it

```bash
git tag -f fork-latest fork-fba28f70
git push -f origin fork-latest
```

## Remotes

- `upstream` — https://github.com/alialek/maden
- `origin` — https://github.com/marklidenberg/maden

## Install

```bash
export MADEN_REPO=~/…/maden                                                    # in `.zshrc`
git clone -b fork-latest https://github.com/marklidenberg/maden "$MADEN_REPO"
cd "$MADEN_REPO" && npm install && npm run build
ln -s "$MADEN_REPO" ~/.vscode/extensions/alialek.maden-0.0.6
```

- the marketplace copy removed first — the id is upstream's
- the symlink listed in `~/.vscode/extensions/extensions.json` — vscode loads what is listed
- `fork/deploy` — the skill that pulls and rebuilds; then `Developer: Reload Window`

## Regions

Every touch of an upstream file — a region, named after its change:

```ts
// fork-add ai-local-provider            <- ours, where nothing stood

export const localProvider = ...

// end-fork-add ai-local-provider

// fork-delete telemetry-ping            <- upstream's, gone

// void reportUsage(editorId)

// end-fork-delete telemetry-ping

// fork-mutate ai-timeout                <- upstream's, ours in its place

// - Old

// const timeout = 30_000

// - New

const timeout = 5_000

// end-fork-mutate ai-timeout
```

- a deletion with ours in its place — a mutation, never a `fork-delete` beside a `fork-add`
- upstream's lines stay, commented out — its next edit to them stops the merge: does ours still hold?
- a file of ours — wrapped whole, first line to last

The comment, the language's own:

- `.ts` `.tsx` `.js` `.mjs` — `// fork-add <name>`
- JSX — `{/* fork-add <name> */}`
- `.css` — `/* fork-add <name> */`
- `.md` `.html` — `<!-- fork-add <name> -->`
- `.yml` `.sh` — `# fork-add <name>`
- `.json` — none; the change doc alone

```bash
git grep -nE "fork-(add|delete|mutate)"
```

## Changes

`fork/changes/<name>.md` — a doc per change, named as its regions:

```markdown
# <name>

What it does, why upstream does not, the files it touches — by path, never by line.
```

## Merging upstream

```bash
fork/merge.sh                # on the fork branch — upstream/main's head
fork/merge.sh 3c1d9e02       # or a commit
```

A branch `fork-<hash>` off the fork branch, the commit merged in — by hash: `upstream/main` moves.

- a conflict — the region kept whole, markers too; its change doc re-read — the doc is the intent
- a mutation — `Old` takes upstream's new text, `New` rewritten over it
- a change upstream adopted — its regions and doc dropped

Then:

```bash
git push -u origin HEAD
git tag -f fork-latest HEAD
git push -f origin fork-latest
```

## Rules

- as few upstream lines as possible — new code in new files, reached from one region
- additions first; a deletion or a mutation only where an addition will not do
- a block replaced — a mutation, never a deletion beside an addition
- a region per change, a change doc per region
