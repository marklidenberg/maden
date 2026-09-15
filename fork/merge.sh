#!/usr/bin/env bash
# fork/merge.sh [<commit>] — an upstream commit, upstream/main's head where none, merged into a new
# branch fork-<hash>, off the fork branch checked out

set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

# - The fork branch, up to date

old=$(git branch --show-current)
[[ $old == fork-* ]] || { echo "not on a fork branch: $old" >&2; exit 1; }
git pull --ff-only

# - The commit, pinned once — upstream/main moves on every fetch

git fetch upstream
hash=$(git rev-parse --short=8 "${1:-upstream/main}^{commit}")
new=fork-$hash
[[ $new != "$old" ]] || { echo "already at $hash" >&2; exit 0; }

# - The new branch, named in fork/README.md

git checkout -b "$new"
perl -pi -e "s/$old/$new/g" fork/README.md
git commit -qm "Open $new" fork/README.md

# - The commit merged — a conflict stops here

git merge "$hash"
