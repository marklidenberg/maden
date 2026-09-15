// fork-add spotlight

import type { SlateEditor, TElement, Value } from 'platejs';

import { KEYS, NodeApi } from 'platejs';
import { createPlatePlugin } from 'platejs/react';

import { rankOf, zoomIn } from '@/lib/node-zoom';

export type Bullet = {
  crumbs: string[];
  id: string;
  index: number;
  text: string;
};

const bullets = new WeakMap<Value, Bullet[]>();

// Every top-level list item with text, its breadcrumb as the zoom's — one pass over a stack of the
// blocks ranked shallower than all after them.
export const bulletsOf = (children: Value): Bullet[] => {
  const cached = bullets.get(children);

  if (cached) return cached;

  const found: Bullet[] = [];
  const stack: { rank: number; text: string }[] = [];

  children.forEach((node, index) => {
    const rank = rankOf(node);
    const text = NodeApi.string(node);

    while (stack.length > 0 && stack.at(-1)!.rank >= rank) stack.pop();

    if (node[KEYS.listType] && text.trim()) {
      found.push({
        crumbs: stack.map((crumb) => crumb.text).filter(Boolean),
        id: node.id as string,
        index,
        text,
      });
    }

    stack.push({ rank, text });
  });

  bullets.set(children, found);

  return found;
};

export type FuzzyMatch = { indexes: number[]; score: number };

const RUN = 5; // a letter right after the one before
const WORD_START = 8; // a letter opening a word
const MAX_LENGTH = 512; // past it, a text is not searched

const isWordChar = (char: string | undefined) => !!char && /[\p{L}\p{N}]/u.test(char);

// A term's letters in order, placed for the best score — runs and word starts weigh most.
const matchTerm = (term: string, text: string): FuzzyMatch | null => {
  const lower = text.slice(0, MAX_LENGTH).toLowerCase();
  const m = term.length;
  const n = lower.length;

  for (let i = 0, j = -1; i < m; i++) {
    j = lower.indexOf(term[i], j + 1);

    if (j === -1) return null;
  }

  // At `i * n + j`: term[i] placed at j; the best of term[..i] with term[i] at j or before, and where
  const placed = new Float64Array(m * n).fill(-Infinity);
  const best = new Float64Array(m * n).fill(-Infinity);
  const bestAt = new Int32Array(m * n);
  const run = new Uint8Array(m * n);

  for (let i = 0; i < m; i++) {
    for (let j = i; j < n; j++) {
      const k = i * n + j;

      if (lower[j] === term[i]) {
        const own = 1 + (isWordChar(text[j - 1]) ? 0 : WORD_START);

        if (i === 0) {
          placed[k] = own - Math.min(j, 20) * 0.05;
        } else if (placed[k - n - 1] + RUN >= best[k - n - 1]) {
          placed[k] = own + placed[k - n - 1] + RUN;
          run[k] = 1;
        } else {
          placed[k] = own + best[k - n - 1];
        }
      }

      if (j === i || placed[k] > best[k - 1]) {
        best[k] = placed[k];
        bestAt[k] = j;
      } else {
        best[k] = best[k - 1];
        bestAt[k] = bestAt[k - 1];
      }
    }
  }

  const last = m * n - 1;
  const indexes: number[] = [];

  for (let i = m - 1, j = bestAt[last]; i >= 0; i--) {
    indexes.unshift(j);
    j = run[i * n + j] ? j - 1 : bestAt[(i - 1) * n + j - 1];
  }

  return { indexes, score: best[last] };
};

// Each word of the query, anywhere in the text.
export const fuzzyMatch = (query: string, text: string): FuzzyMatch | null => {
  const indexes = new Set<number>();
  let score = 0;

  for (const term of query.toLowerCase().split(/\s+/).filter(Boolean)) {
    const match = matchTerm(term, text);

    if (!match) return null;

    match.indexes.forEach((index) => indexes.add(index));
    score += match.score;
  }

  return { indexes: [...indexes].sort((a, b) => a - b), score };
};

export type SpotlightResult = { bullet: Bullet; match?: FuzzyMatch };

// The best first; a tie — the shorter, then the earlier.
export const searchBullets = (
  all: Bullet[],
  query: string,
  limit = 100
): SpotlightResult[] =>
  all
    .flatMap((bullet) => {
      const match = fuzzyMatch(query, bullet.text);

      return match ? [{ bullet, match }] : [];
    })
    .sort(
      (a, b) =>
        b.match.score - a.match.score ||
        a.bullet.text.length - b.bullet.text.length ||
        a.bullet.index - b.bullet.index
    )
    .slice(0, limit);

// A bullet zoomed into or typed in — its id while the editor lives, its text across sessions.
export type Recent = { id?: string; text: string };

const RECENT_LIMIT = 50;

export const pushRecent = (recent: Recent[], entry: Recent): Recent[] =>
  [
    entry,
    ...recent.filter((other) => (other.id ? other.id !== entry.id : other.text !== entry.text)),
  ].slice(0, RECENT_LIMIT);

// The recent bullets still here, the latest first — by id, else by text.
export const resolveRecent = (all: Bullet[], recent: Recent[]): Bullet[] => {
  const byId = new Map(all.map((bullet) => [bullet.id, bullet]));
  const taken = new Set<string>();
  const resolved: Bullet[] = [];

  for (const entry of recent) {
    const bullet =
      (entry.id ? byId.get(entry.id) : undefined) ??
      all.find((other) => !taken.has(other.id) && other.text === entry.text);

    if (bullet && !taken.has(bullet.id)) {
      taken.add(bullet.id);
      resolved.push(bullet);
    }
  }

  return resolved;
};

const storageKey = (path: string) => `maden.spotlight.recent:${path}`;

const documentPath = () =>
  typeof window === 'undefined' ? undefined : window.__MADEN_DOCUMENT_PATH__;

const readRecent = (path: string): Recent[] => {
  try {
    const texts: unknown = JSON.parse(window.localStorage.getItem(storageKey(path)) ?? '[]');

    return Array.isArray(texts)
      ? texts.filter((text): text is string => typeof text === 'string').map((text) => ({ text }))
      : [];
  } catch {
    return [];
  }
};

const timers = new Map<string, ReturnType<typeof setTimeout>>();

// A moment after the last touch — the texts as they stand then.
const writeRecent = (editor: SlateEditor, path: string) => {
  clearTimeout(timers.get(path));
  timers.set(
    path,
    setTimeout(() => {
      timers.delete(path);

      const nodes = new Map(editor.children.map((node) => [node.id, node]));
      const texts = editor.getOption(SpotlightPlugin, 'recent').map(({ id, text }) => {
        const node = id ? nodes.get(id) : undefined;

        return node ? NodeApi.string(node) : text;
      });

      try {
        window.localStorage.setItem(
          storageKey(path),
          JSON.stringify([...new Set(texts.filter(Boolean))])
        );
      } catch {
        // Storage off
      }
    }, 500)
  );
};

export const SpotlightPlugin = createPlatePlugin({
  key: 'spotlight',
  options: { path: null as string | null, recent: [] as Recent[] },
}).overrideEditor(({ editor, tf: { apply } }) => ({
  transforms: {
    // Typing in a bullet — recent
    apply(operation) {
      apply(operation);

      if (operation.type === 'insert_text' || operation.type === 'remove_text') {
        touchRecent(editor, editor.children[operation.path[0]]);
      }
    },
  },
}));

// The file's stored recents, once per path — after this session's.
export const loadRecent = (editor: SlateEditor) => {
  const path = documentPath();

  if (!path || path === editor.getOption(SpotlightPlugin, 'path')) return;

  const recent = editor.getOption(SpotlightPlugin, 'recent');
  const stored = readRecent(path).filter(
    (entry) => !recent.some((other) => other.text === entry.text)
  );

  editor.setOption(SpotlightPlugin, 'path', path);
  editor.setOption(SpotlightPlugin, 'recent', [...recent, ...stored].slice(0, RECENT_LIMIT));
};

// A bullet first in the recents, stored a moment later.
export const touchRecent = (editor: SlateEditor, node: TElement | undefined) => {
  if (!node?.[KEYS.listType] || typeof node.id !== 'string') return;

  loadRecent(editor);

  const recent = editor.getOption(SpotlightPlugin, 'recent');
  const path = editor.getOption(SpotlightPlugin, 'path');

  if (recent[0]?.id !== node.id) {
    editor.setOption(
      SpotlightPlugin,
      'recent',
      pushRecent(recent, { id: node.id, text: NodeApi.string(node) })
    );
  }

  if (path) writeRecent(editor, path);
};

// In on a bullet: zoomed to it, the caret at its end — a caret there opens the folds over it.
export const spotlightJump = (editor: SlateEditor, id: string): boolean => {
  const index = editor.children.findIndex((node) => node.id === id);

  if (index === -1) return false;

  zoomIn(editor, id);
  editor.tf.select(editor.api.end([index])!);
  touchRecent(editor, editor.children[index]);

  return true;
};

// The magnifier's press; VS Code's `maden.spotlight` arrives as the host's `openSpotlight`.
export const SPOTLIGHT_EVENT = 'maden:spotlight';

export const openSpotlight = () => window.dispatchEvent(new Event(SPOTLIGHT_EVENT));

// end-fork-add spotlight
