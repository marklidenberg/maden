// fork-add fast-reload

import { type Descendant, KEYS, type SlateEditor } from 'platejs';
import { Scrubber } from 'slate';

// A text leaf with nothing in it — the normalizer's, about an inline
const isEmptyText = (node: unknown) =>
  typeof node === 'object' &&
  node !== null &&
  Object.keys(node).length === 1 &&
  (node as { text?: unknown }).text === '';

// A node as a string — keys in order, the undefined left out. Loose: as it reads — the ids inside it,
// the list's numbering and the empty leaves the normalizer adds left out, a text parsed afresh has none
const stable = (value: unknown, loose: boolean, depth = 0): string => {
  if (typeof value !== 'object' || value === null) return JSON.stringify(value) ?? 'null';

  if (Array.isArray(value)) {
    const items = loose ? value.filter((item) => !isEmptyText(item)) : value;

    return `[${items.map((item) => stable(item, loose, depth)).join(',')}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record)
    .filter(
      (key) =>
        record[key] !== undefined &&
        !(loose && (key === KEYS.listStart || (key === 'id' && depth > 0)))
    )
    .sort();

  return `{${keys.map((key) => `${JSON.stringify(key)}:${stable(record[key], loose, depth + 1)}`).join(',')}}`;
};

// A block to the letter
export const exactKey = (node: Descendant) => stable(node, false);

// A block as it reads, its own id with it
export const blockKey = (node: Descendant) => stable(node, true);

// The longest run of pairs rising in both
const rising = (pairs: [number, number][]): [number, number][] => {
  const tails: number[] = [];
  const before = new Int32Array(pairs.length).fill(-1);

  pairs.forEach(([, j], index) => {
    let lo = 0;
    let hi = tails.length;

    while (lo < hi) {
      const mid = (lo + hi) >> 1;

      if (pairs[tails[mid]][1] < j) lo = mid + 1;
      else hi = mid;
    }

    if (lo > 0) before[index] = tails[lo - 1];

    tails[lo] = index;
  });

  const run: [number, number][] = [];

  for (let index = tails.at(-1) ?? -1; index !== -1; index = before[index]) run.push(pairs[index]);

  return run.reverse();
};

// The equal blocks of `a` and `b`, paired in order — the same head and tail, then the blocks alike in
// no other place, and again between them
const align = (
  a: string[],
  b: string[],
  aFrom: number,
  aTo: number,
  bFrom: number,
  bTo: number,
  pairs: [number, number][]
) => {
  // - The same head

  while (aFrom < aTo && bFrom < bTo && a[aFrom] === b[bFrom]) pairs.push([aFrom++, bFrom++]);

  // - The same tail

  let tail = 0;

  while (aTo - tail > aFrom && bTo - tail > bFrom && a[aTo - 1 - tail] === b[bTo - 1 - tail]) tail++;

  // - The blocks alike in no other place, paired — between them, again

  const counts = new Map<string, [number, number, number]>(); // in a, in b, where in b

  for (let j = bFrom; j < bTo - tail; j++) {
    const count = counts.get(b[j]) ?? [0, 0, j];

    count[1]++;
    counts.set(b[j], count);
  }

  for (let i = aFrom; i < aTo - tail; i++) {
    const count = counts.get(a[i]);

    if (count) count[0]++;
  }

  const unique: [number, number][] = [];

  for (let i = aFrom; i < aTo - tail; i++) {
    const count = counts.get(a[i]);

    if (count?.[0] === 1 && count[1] === 1) unique.push([i, count[2]]);
  }

  let i = aFrom;
  let j = bFrom;

  rising(unique).forEach(([p, q]) => {
    align(a, b, i, p, j, q, pairs);
    pairs.push([p, q]);
    i = p + 1;
    j = q + 1;
  });

  if (unique.length > 0) align(a, b, i, aTo - tail, j, bTo - tail, pairs);

  // - The tail

  for (let k = tail; k > 0; k--) pairs.push([aTo - k, bTo - k]);
};

// The editor's blocks brought to `next` — the ones standing, by `key`, left as they are: their nodes,
// their render. The rest removed and put in, a block at a time; Plate's `setValue` does it to every
// block, in time square to their count.
export const patchBlocks = (
  editor: SlateEditor,
  next: Descendant[],
  key: (node: Descendant) => string = exactKey
) => {
  // - Nothing — a paragraph, as `setValue` has it

  const blocks = next.length > 0 ? next : (editor.api.create.value() as Descendant[]);

  // - The blocks paired

  const previous = editor.children;
  const pairs: [number, number][] = [];

  align(previous.map(key), blocks.map(key), 0, previous.length, 0, blocks.length, pairs);

  // - Those between the pairs removed and put in — slate's miss past the last block, asked by the list
  // after each, writes the whole document into its error: not written

  Scrubber.setScrubber((field, value) => (field === '' ? '…' : value));

  try {
    editor.tf.withoutNormalizing(() => {
      let at = 0;
      let i = 0;
      let j = 0;

      const until = (p: number, q: number) => {
        for (; i < p; i++) {
          editor.tf.apply({ node: editor.children[at], path: [at], type: 'remove_node' });
        }

        for (; j < q; j++) {
          editor.tf.apply({ node: structuredClone(blocks[j]), path: [at++], type: 'insert_node' });
        }
      };

      pairs.forEach(([p, q]) => {
        until(p, q);
        at++;
        i++;
        j++;
      });

      until(previous.length, blocks.length);
    });
  } finally {
    Scrubber.setScrubber(undefined);
  }
};

// end-fork-add fast-reload
