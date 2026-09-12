# Fork

A fork of [alialek/maden](https://github.com/alialek/maden), forked at `fba28f70`.

Upstream keeps moving. Our changes stay marked and documented, so every merge is mechanical.

## Branches and tags

- `main` — upstream, untouched
- `fork-fba28f70` — the fork
- `fork-latest` — a tag on the fork branch's tip

The hash is the fork point. It never changes, however far the branch travels. `fork-latest` is how
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

## Regions

Every touch of an upstream file is wrapped in a region, named after its change.

An addition — ours, new:

```ts
// fork-start-addition ai-local-provider

export const localProvider = ...

// fork-stop-addition ai-local-provider
```

A deletion — upstream's block stays, commented out:

```ts
// fork-start-deletion telemetry-ping

// void reportUsage(editorId)

// fork-stop-deletion telemetry-ping
```

A mutation — upstream's block commented out above ours:

```ts
// fork-start-mutation ai-timeout

// - Old

// const timeout = 30_000

// - New

const timeout = 5_000

// fork-stop-mutation ai-timeout
```

The original never leaves the file. Upstream's next edit to those lines cannot apply over the
commented copy, so the merge stops and asks the question worth asking: does ours still hold?

Avoid mutations: a deletion beside an addition says the same thing and merges better.

A file the fork adds whole needs no region — its change doc says it is ours.

The comment is the language's own:

- `.ts` `.tsx` `.js` `.mjs` — `// fork-start-<kind> <name>`
- `.css` — `/* fork-start-<kind> <name> */`
- `.md` `.html` — `<!-- fork-start-<kind> <name> -->`
- `.yml` `.sh` — `# fork-start-<kind> <name>`
- `.json` — no comments; the change doc carries it alone

Find them:

```bash
git grep -n "fork-start-"
git grep -n "fork-.*ai-local-provider"
```

## Changes

One doc per change — `fork/changes/<name>.md`, named as its regions are:

```markdown
# <name>

What it does, why upstream does not, and the files it touches — by path, never by line number.
```

## Merging upstream

```bash
git fetch upstream
git checkout fork-fba28f70
git merge upstream/main
```

Conflicts land on our regions. Resolve by keeping the region whole, markers included, and re-reading
its change doc — the doc is the intent, the region is only where it landed.

On a mutation, `Old` takes upstream's new text and `New` is written over that — the commented copy
is only useful while it is upstream's.

A change upstream has since adopted: drop the region, drop the doc.

## Rules

- Additions and deletions; a mutation only where neither will do
- A region per change, a change doc per region
- As few upstream lines as possible — new code in new files, reached from one region
