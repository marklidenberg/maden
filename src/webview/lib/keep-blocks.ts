// fork-add fold-state

import type { TElement, TRange } from 'platejs';

import { KEYS, NodeApi } from 'platejs';

type Block = { content: string; shape: string; text: string };

const describe = (node: TElement): Block => ({
  // - As it reads, its ids aside

  content: JSON.stringify(node, (key, value) => (key === 'id' ? undefined : value)),

  // - Where it stands — a block edited in place keeps it

  shape: JSON.stringify([node.type, node[KEYS.indent] ?? 0, node[KEYS.listType] ?? null]),
  text: NodeApi.string(node),
});

// How far two sequences agree from the start, then from the end
const ends = (x: ArrayLike<string>, y: ArrayLike<string>): [number, number] => {
  let head = 0;

  while (head < x.length && head < y.length && x[head] === y[head]) head++;

  let tail = 0;

  while (
    tail < x.length - head &&
    tail < y.length - head &&
    x[x.length - 1 - tail] === y[y.length - 1 - tail]
  ) {
    tail++;
  }

  return [head, tail];
};

// 0 — never paired; an equal pair outweighs any two others
const likeness = (a: Block, b: Block): number => {
  if (a.content === b.content) return 5;
  if (a.shape !== b.shape) return 0;

  const longest = Math.max(a.text.length, b.text.length);
  const [head, tail] = ends(a.text, b.text);

  return 1 + (longest === 0 ? 1 : (head + tail) / longest);
};

// Past it, the middle of a change stays unpaired
const MAX_CELLS = 1_000_000;

// Old blocks paired with new, in order — as many as can be, the likest
// fork-mutate session

// - Old

// export const pairBlocks = (previous: TElement[], next: TElement[]): [number, number][] => {
//   const a = previous.map(describe);
//   const b = next.map(describe);

// - New

const pairDescribed = (a: Block[], b: Block[]): [number, number][] => {
  // end-fork-mutate session

  // - The same head and tail, as they stand

  const [head, tail] = ends(
    a.map(({ content }) => content),
    b.map(({ content }) => content)
  );
  const pairs: [number, number][] = Array.from({ length: head }, (_, i) => [i, i]);

  // - The middle, by a table of the best total likeness

  const n = a.length - head - tail;
  const m = b.length - head - tail;

  if (n * m <= MAX_CELLS) {
    const score = (i: number, j: number) => likeness(a[head + i], b[head + j]);
    const at = (i: number, j: number) => i * (m + 1) + j;
    const table = new Float64Array((n + 1) * (m + 1));

    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        const s = score(i, j);

        table[at(i, j)] = Math.max(
          table[at(i + 1, j)],
          table[at(i, j + 1)],
          s && s + table[at(i + 1, j + 1)]
        );
      }
    }

    let i = 0;
    let j = 0;

    while (i < n && j < m) {
      const s = score(i, j);

      if (s && table[at(i, j)] === s + table[at(i + 1, j + 1)]) {
        pairs.push([head + i++, head + j++]);
      } else if (table[at(i + 1, j)] >= table[at(i, j + 1)]) {
        i++;
      } else {
        j++;
      }
    }
  }

  // - The tail

  for (let k = tail; k > 0; k--) pairs.push([a.length - k, b.length - k]);

  return pairs;
};

// fork-add session

export const pairBlocks = (previous: TElement[], next: TElement[]): [number, number][] =>
  pairDescribed(previous.map(describe), next.map(describe));

// A document as stored — each block's shape and text
export type Outline = { shape: string; text: string }[];

export const outlineOf = (nodes: TElement[]): Outline =>
  nodes.map((node) => {
    const { shape, text } = describe(node);

    return { shape, text };
  });

// A stored document's blocks paired with a document's — the same where shape and text are
export const pairOutline = (outline: Outline, nodes: TElement[]): [number, number][] => {
  const asBlock = ({ shape, text }: Outline[number]): Block => ({
    content: JSON.stringify([shape, text]),
    shape,
    text,
  });

  return pairDescribed(outline.map(asBlock), outlineOf(nodes).map(asBlock));
};

// end-fork-add session

// The blocks a new value leaves standing keep their ids — folds hold by them. The selection, moved
// onto its blocks
export const keepBlocks = (
  previous: TElement[],
  next: TElement[],
  selection: TRange | null
): TRange | null => {
  const moved = new Map<number, number>();

  pairBlocks(previous, next).forEach(([p, q]) => {
    next[q].id = previous[p].id;
    moved.set(p, q);
  });

  if (!selection) return selection;

  const follow = (point: TRange['anchor']) => {
    const index = moved.get(point.path[0]);

    return index === undefined ? point : { ...point, path: [index, ...point.path.slice(1)] };
  };

  return { anchor: follow(selection.anchor), focus: follow(selection.focus) };
};

// end-fork-add fold-state
