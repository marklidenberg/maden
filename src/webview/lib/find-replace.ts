// fork-add find-replace

import type { Point, PointRef, RangeRef, TRange } from 'platejs';
import type { PlateEditor } from 'platejs/react';

import { NodeApi, PathApi, PointApi, RangeApi } from 'platejs';
import { createPlatePlugin } from 'platejs/react';

export type FindQuery = {
  matchCase: boolean;
  regex: boolean;
  search: string;
  wholeWord: boolean;
};

export type FindOptions = FindQuery & {
  current: number;
  expanded: boolean;
  open: boolean;
  // Where the current match is looked for from: the caret it opened on, then each match moved to
  origin: Point | null;
  preserveCase: boolean;
  replace: string;
  // Find in selection — a range ref's current; `null`, the whole document
  scope: TRange | null;
};

export type FindMatch = TRange & { exec: RegExpExecArray };

export type FindResult = {
  // Match indexes by their block's path
  blocks: Map<string, number[]>;
  invalid: boolean;
  matches: FindMatch[];
};

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The query as a global regex; `null` — empty, or a pattern that will not compile.
export const buildFindRegExp = (query: FindQuery): RegExp | null => {
  if (!query.search) return null;

  const source = query.regex ? query.search : escapeRegExp(query.search);
  const flags = query.matchCase ? 'g' : 'gi';

  for (const unicode of ['u', '']) {
    try {
      return new RegExp(source, flags + unicode);
    } catch {
      // Some patterns compile only without `u`
    }
  }

  return null;
};

const WORD = /[\p{L}\p{N}_]/u;

const isSeparator = (char: string | undefined) => char === undefined || !WORD.test(char);

// As VS Code's: each end at the text's edge, or a separator on either side of it.
const isWholeWord = (text: string, start: number, end: number) =>
  (isSeparator(text[start - 1]) || isSeparator(text[start])) &&
  (isSeparator(text[end]) || isSeparator(text[end - 1]));

// A block's matches — empty ones skipped.
export const findInText = (text: string, regexp: RegExp, wholeWord: boolean) => {
  const found: RegExpExecArray[] = [];
  let exec: RegExpExecArray | null;

  regexp.lastIndex = 0;

  while ((exec = regexp.exec(text))) {
    if (!exec[0]) {
      regexp.lastIndex++;
      continue;
    }

    if (!wholeWord || isWholeWord(text, exec.index, exec.index + exec[0].length)) {
      found.push(exec);
    }
  }

  return found;
};

// Each lowest block is a line, as VS Code's: its text across marks and inlines, never past it.
export const findMatches = (
  editor: PlateEditor,
  query: FindQuery,
  scope: TRange | null
): FindResult => {
  const result: FindResult = { blocks: new Map(), invalid: false, matches: [] };
  const regexp = buildFindRegExp(query);

  if (!regexp) return { ...result, invalid: !!query.search };

  const [scopeStart, scopeEnd] = scope ? RangeApi.edges(scope) : [];

  for (const [block, path] of editor.api.nodes({
    at: scope ?? [],
    match: (node) => editor.api.isBlock(node),
    mode: 'lowest',
  })) {
    const texts: { end: number; path: number[]; start: number }[] = [];
    let text = '';

    for (const [leaf, relative] of NodeApi.texts(block)) {
      texts.push({ end: text.length + leaf.text.length, path: [...path, ...relative], start: text.length });
      text += leaf.text;
    }

    for (const exec of findInText(text, regexp, query.wholeWord)) {
      const end = exec.index + exec[0].length;
      const from = texts.find((leaf) => exec.index >= leaf.start && exec.index < leaf.end)!;
      const to = texts.find((leaf) => end > leaf.start && end <= leaf.end)!;
      const match: FindMatch = {
        anchor: { offset: exec.index - from.start, path: from.path },
        exec,
        focus: { offset: end - to.start, path: to.path },
      };

      if (
        scopeStart &&
        scopeEnd &&
        (PointApi.isBefore(match.anchor, scopeStart) || PointApi.isAfter(match.focus, scopeEnd))
      ) {
        continue;
      }

      const key = path.join();

      result.blocks.set(key, [...(result.blocks.get(key) ?? []), result.matches.length]);
      result.matches.push(match);
    }
  }

  return result;
};

let cached: { children: unknown; query: FindQuery; result: FindResult; scope: TRange | null } | undefined;

export const getFindMatches = (editor: PlateEditor): FindResult => {
  const { matchCase, regex, scope, search, wholeWord } = editor.getOptions(FindReplacePlugin);
  const query = { matchCase, regex, search, wholeWord };

  if (
    cached?.children !== editor.children ||
    cached.scope !== scope ||
    (Object.keys(query) as (keyof FindQuery)[]).some((key) => cached!.query[key] !== query[key])
  ) {
    cached = { children: editor.children, query, result: findMatches(editor, query, scope), scope };
  }

  return cached.result;
};

export const currentIndex = (current: number, count: number) =>
  Math.max(0, Math.min(current, count - 1));

// The first match at or after a point; past the last — the first.
const indexFrom = (matches: FindMatch[], point: Point | null) =>
  point ? Math.max(0, matches.findIndex((match) => !PointApi.isBefore(match.anchor, point))) : 0;

const currentMatch = (editor: PlateEditor) => {
  const { matches } = getFindMatches(editor);

  return matches[currentIndex(editor.getOption(FindReplacePlugin, 'current'), matches.length)];
};

// `$&` `$0` the match, `$1`… a group, `$<name>` a named one, `$$` a dollar.
export const expandReplacement = (replace: string, exec: RegExpExecArray) =>
  replace.replace(/\$(\$|&|\d{1,2}|<([^>]*)>)/g, (token, key: string, name?: string) => {
    if (key === '$') return '$';
    if (key === '&') return exec[0];
    if (name !== undefined) return exec.groups?.[name] ?? token;
    if (Number(key) < exec.length) return exec[Number(key)] ?? '';
    // `$12` with a single group — `$1`, then `2`
    if (key.length === 2 && Number(key[0]) < exec.length) return (exec[Number(key[0])] ?? '') + key[1];

    return token;
  });

const casedLike = (matched: string, replacement: string) => {
  if (!matched || !replacement) return replacement;
  if (matched === matched.toUpperCase() && matched !== matched.toLowerCase()) {
    return replacement.toUpperCase();
  }
  if (matched === matched.toLowerCase() && matched !== matched.toUpperCase()) {
    return replacement.toLowerCase();
  }
  if (matched[0] !== matched[0].toLowerCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  if (matched[0] !== matched[0].toUpperCase()) {
    return replacement[0].toLowerCase() + replacement.slice(1);
  }

  return replacement;
};

const splitsAlike = (matched: string, replacement: string, separator: string) =>
  matched.includes(separator) &&
  replacement.includes(separator) &&
  matched.split(separator).length === replacement.split(separator).length;

// As VS Code's: upper, lower, capitalized — per `-` or `_` part where both split alike.
export const preserveCase = (matched: string, replacement: string) => {
  const hyphens = splitsAlike(matched, replacement, '-');
  const underscores = splitsAlike(matched, replacement, '_');

  if (hyphens !== underscores) {
    const separator = hyphens ? '-' : '_';
    const parts = matched.split(separator);

    return replacement
      .split(separator)
      .map((part, i) => casedLike(parts[i], part))
      .join(separator);
  }

  return casedLike(matched, replacement);
};

export const replacementFor = (
  match: FindMatch,
  options: Pick<FindOptions, 'preserveCase' | 'regex' | 'replace'>
) => {
  const text = options.regex ? expandReplacement(options.replace, match.exec) : options.replace;

  return options.preserveCase ? preserveCase(match.exec[0], text) : text;
};

const scopeRefs = new WeakMap<PlateEditor, RangeRef>();
const seen = new WeakMap<PlateEditor, unknown>();

export const FindReplacePlugin = createPlatePlugin({
  key: 'findReplace',
  node: { isLeaf: true },
  options: {
    current: 0,
    expanded: false,
    matchCase: false,
    open: false,
    origin: null,
    preserveCase: false,
    regex: false,
    replace: '',
    scope: null,
    search: '',
    wholeWord: false,
  } as FindOptions,
  decorate: ({ editor, entry: [, path], getOptions, type }) => {
    const { current, open, scope } = getOptions();

    if (!open || path.length === 0) return;

    const ranges: (TRange & Record<string, unknown>)[] = [];

    // The scope off each top-level block — slate hands it down
    if (scope && path.length === 1) {
      const within = RangeApi.intersection(scope, editor.api.range(path)!);

      if (within) ranges.push({ ...within, findScope: true, [type]: true });
    }

    const { blocks, matches } = getFindMatches(editor);
    const index = currentIndex(current, matches.length);

    for (const i of blocks.get(path.join()) ?? []) {
      ranges.push({
        anchor: matches[i].anchor,
        findCurrent: i === index,
        findMatch: true,
        focus: matches[i].focus,
        [type]: true,
      });
    }

    return ranges;
  },
  handlers: {
    // An edit moves the scope and the matches
    onChange: ({ editor, getOptions, setOption }) => {
      if (!getOptions().open || seen.get(editor) === editor.children) return;

      seen.set(editor, editor.children);
      setOption('scope', scopeRefs.get(editor)?.current ?? null);
      editor.api.redecorate();
    },
  },
});

// The options set; the current match — the first from the origin.
export const setFindQuery = (editor: PlateEditor, patch: Partial<FindOptions>) => {
  editor.setOptions(FindReplacePlugin, patch);
  editor.setOption(
    FindReplacePlugin,
    'current',
    indexFrom(getFindMatches(editor).matches, editor.getOption(FindReplacePlugin, 'origin'))
  );
  editor.api.redecorate();
};

// Open from the caret; a selection within one block seeds the search.
export const openFind = (editor: PlateEditor, { seed = true } = {}) => {
  const { selection } = editor;
  const patch: Partial<FindOptions> = {
    open: true,
    origin: selection ? RangeApi.start(selection) : null,
  };

  if (seed && selection && RangeApi.isExpanded(selection)) {
    const anchorBlock = editor.api.block({ at: selection.anchor });
    const focusBlock = editor.api.block({ at: selection.focus });
    const text = editor.api.string(selection);

    if (text && anchorBlock && focusBlock && PathApi.equals(anchorBlock[1], focusBlock[1])) {
      patch.search = editor.getOption(FindReplacePlugin, 'regex') ? escapeRegExp(text) : text;
    }
  }

  setFindQuery(editor, patch);
};

// Closed; with `focus` — back in the editor, the current match selected.
export const closeFind = (editor: PlateEditor, { focus = false } = {}) => {
  const match = currentMatch(editor);

  scopeRefs.get(editor)?.unref();
  scopeRefs.delete(editor);
  editor.setOptions(FindReplacePlugin, { open: false, scope: null });
  editor.api.redecorate();

  if (!focus) return;
  if (match) editor.tf.select({ anchor: match.anchor, focus: match.focus });

  editor.tf.focus();
};

export const findStep = (editor: PlateEditor, step: 1 | -1) => {
  const { matches } = getFindMatches(editor);

  if (!matches.length) return;

  const current =
    (currentIndex(editor.getOption(FindReplacePlugin, 'current'), matches.length) +
      step +
      matches.length) %
    matches.length;

  editor.setOptions(FindReplacePlugin, { current, origin: matches[current].anchor });
  editor.api.redecorate();
};

// On — the selection, or the caret's block; off — the whole document.
export const toggleFindInSelection = (editor: PlateEditor) => {
  const held = scopeRefs.get(editor);
  let scope: TRange | null = null;

  scopeRefs.delete(editor);

  if (held) {
    held.unref();
  } else if (editor.selection) {
    const block = editor.api.block();
    const range = RangeApi.isExpanded(editor.selection)
      ? editor.selection
      : block && editor.api.range(block[1]);

    if (range) {
      const ref = editor.api.rangeRef(range);

      scopeRefs.set(editor, ref);
      scope = ref.current;
    }
  }

  setFindQuery(editor, { scope });
};

// Deleted, then the text inserted raw — past `insertText`'s overrides, autoformat's among them.
const replaceRange = (editor: PlateEditor, range: TRange, text: string) => {
  const start = editor.api.pointRef(RangeApi.start(range));

  editor.tf.delete({ at: range });

  const at = start.unref();

  if (at && text) editor.tf.apply({ offset: at.offset, path: at.path, text, type: 'insert_text' });

  return at;
};

// The current match replaced; the next current — the first match past the text put in.
export const replaceCurrent = (editor: PlateEditor) => {
  const match = currentMatch(editor);

  if (!match) return;

  const text = replacementFor(match, editor.getOptions(FindReplacePlugin));
  let after: PointRef | undefined;

  editor.tf.withNewBatch(() => {
    editor.tf.withoutNormalizing(() => {
      const at = replaceRange(editor, match, text);

      if (at) after = editor.api.pointRef({ offset: at.offset + text.length, path: at.path });
    });
  });

  setFindQuery(editor, { origin: after?.unref() ?? null });
};

// Every match, backwards so the ranges ahead still hold — one undo.
export const replaceAll = (editor: PlateEditor) => {
  const { matches } = getFindMatches(editor);
  const options = editor.getOptions(FindReplacePlugin);

  if (!matches.length) return;

  editor.tf.withNewBatch(() => {
    editor.tf.withoutNormalizing(() => {
      for (const match of [...matches].reverse()) {
        replaceRange(editor, match, replacementFor(match, options));
      }
    });
  });

  setFindQuery(editor, {});
};

// end-fork-add find-replace
