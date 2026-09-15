// fork-add keep-tabs

// vscode holds one tab per file per editor in a group. Reopening a tab with an editor the group
// already holds on its file moves that tab into the reopened one's slot, then closes the reopened
// one — a merge. A close alone moves nothing.

export const MERGE_MS = 1000;

export const createMerges = <Tab>() => {
  let move: { tab: Tab; at: number } | undefined;

  return {
    // A tab changed — `from`, its index before
    changed: (tab: Tab, from: number | undefined, to: number, at: number) => {
      if (from !== undefined && from !== to) {
        move = { tab, at };
      }
    },

    // A tab closed — the one of `candidates` it merged into
    closed: (candidates: Tab[], at: number): Tab | undefined => {
      const last = move;

      if (!last || at - last.at > MERGE_MS) {
        return undefined;
      }

      const into = candidates.find((tab) => tab === last.tab);

      if (into) {
        move = undefined;
      }

      return into;
    },
  };
};

// `tab-2`, `tab-3`, … — the first not taken
export const freeFragment = (taken: string[]) => {
  let n = 2;

  while (taken.includes(`tab-${n}`)) {
    n += 1;
  }

  return `tab-${n}`;
};

// end-fork-add keep-tabs
