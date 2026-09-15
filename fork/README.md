# Fork

A fork of [alialek/maden](https://github.com/alialek/maden), forked at `fba28f70`.

Upstream keeps moving. Our changes stay marked and documented, so every merge is mechanical.

## Branches and tags

- `main` — upstream, untouched
- `fork-fba28f70` — the fork
- `fork-latest` — a tag on the fork branch's tip

The hash is the upstream commit last merged in — each merge opens a new branch. `fork-latest` is how
to reach the fork without knowing it:

```bash
git tag -f fork-latest fork-fba28f70
git push -f origin fork-latest
```

The repository's GitHub description says this is a fork and points at this file through that tag.
Nothing is written into `main` — it stays upstream's, to the byte.

## Remotes

- `upstream` — https://github.com/alialek/maden
- `origin` — https://github.com/marklidenberg/maden

## Install

`$MADEN_REPO` is the clone the extension runs from, symlinked into vscode:

```bash
export MADEN_REPO=~/…/maden                                                    # in `.zshrc`
git clone -b fork-fba28f70 https://github.com/marklidenberg/maden "$MADEN_REPO"
cd "$MADEN_REPO" && npm install && npm run build
ln -s "$MADEN_REPO" ~/.vscode/extensions/alialek.maden-0.0.6
```

The id stays upstream's, so the marketplace copy goes first. The symlink also needs an entry in
`~/.vscode/extensions/extensions.json` — vscode loads what is listed there, not what is on disk.

`fork/deploy` is the skill that pulls and rebuilds; `Developer: Reload Window` picks it up.

## Regions

Every touch of an upstream file is wrapped in a region, named after its change.

An addition — ours, new:

```ts
// fork-add ai-local-provider

export const localProvider = ...

// end-fork-add ai-local-provider
```

A deletion — upstream's block stays, commented out:

```ts
// fork-delete telemetry-ping

// void reportUsage(editorId)

// end-fork-delete telemetry-ping
```

A mutation — upstream's block commented out above ours:

```ts
// fork-mutate ai-timeout

// - Old

// const timeout = 30_000

// - New

const timeout = 5_000

// end-fork-mutate ai-timeout
```

The original never leaves the file. Upstream's next edit to those lines cannot apply over the
commented copy, so the merge stops and asks the question worth asking: does ours still hold?

Avoid mutations: a deletion beside an addition says the same thing and merges better.

A file the fork adds whole is wrapped whole, from its first line to its last:

```ts
// fork-add ai-local-provider

'use client'

export const localProvider = ...

// end-fork-add ai-local-provider
```

The comment is the language's own:

- `.ts` `.tsx` `.js` `.mjs` — `// fork-add <name>`
- `.css` — `/* fork-add <name> */`
- `.md` `.html` — `<!-- fork-add <name> -->`
- `.yml` `.sh` — `# fork-add <name>`
- `.json` — no comments; the change doc carries it alone

Find them:

```bash
git grep -nE "fork-(add|delete|mutate)"
git grep -n ai-local-provider
```

## Changes

One doc per change — `fork/changes/<name>.md`, named as its regions are:

```markdown
# <name>

What it does, why upstream does not, and the files it touches — by path, never by line number.
```

## Merging upstream

On the fork branch:

```bash
fork/merge.sh                # upstream/main's head
fork/merge.sh 3c1d9e02       # or a given commit
```

A new branch `fork-<hash>`, off the fork branch, the commit merged in — by hash, never
`upstream/main`: it moves on every fetch.

Conflicts land on our regions. Resolve by keeping the region whole, markers included, and re-reading
its change doc — the doc is the intent, the region is only where it landed.

On a mutation, `Old` takes upstream's new text and `New` is written over that — the commented copy
is only useful while it is upstream's.

A change upstream has since adopted: drop the region, drop the doc.

Committed and built:

```bash
git push -u origin HEAD
git tag -f fork-latest HEAD
git push -f origin fork-latest
```

## Rules

- Additions and deletions; a mutation only where neither will do
- A region per change, a change doc per region — a file of ours too, wrapped whole
- As few upstream lines as possible — new code in new files, reached from one region
