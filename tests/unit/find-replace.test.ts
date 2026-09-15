// fork-add find-replace

import { NodeApi } from 'platejs';
import { createPlateEditor } from 'platejs/react';
import { describe, expect, it } from 'vitest';

import {
  type FindOptions,
  buildFindRegExp,
  closeFind,
  expandReplacement,
  FindReplacePlugin,
  findStep,
  getFindMatches,
  openFind,
  preserveCase,
  replaceAll,
  replaceCurrent,
  setFindQuery,
  toggleFindInSelection,
} from '../../src/webview/lib/find-replace';
import { deserializeMarkdownToPlateValue } from '../../src/webview/lib/markdown-plate-conversion';

const SOURCE = ['# Foo bar', '', 'foo **Foo**d food', '', '- foo-bar FOO', '', 'a1 b22'].join('\n');

const TEXTS = ['Foo bar', 'foo Food food', 'foo-bar FOO', 'a1 b22'];

const QUERY = { matchCase: false, regex: false, search: '', wholeWord: false };

const createEditor = () =>
  createPlateEditor({
    plugins: [FindReplacePlugin],
    value: deserializeMarkdownToPlateValue(SOURCE).value,
  });

type Editor = ReturnType<typeof createEditor>;

const texts = (editor: Editor) => editor.children.map((node) => NodeApi.string(node));

const found = (editor: Editor) =>
  getFindMatches(editor).matches.map((match) => editor.api.string(match));

const find = (editor: Editor, patch: Partial<FindOptions>) => {
  setFindQuery(editor, { open: true, ...patch });

  return found(editor);
};

const current = (editor: Editor) => editor.getOption(FindReplacePlugin, 'current');

describe('find replace', () => {
  it('builds the regex', () => {
    expect(buildFindRegExp({ ...QUERY, search: 'a.b' })!.test('axb')).toBe(false);
    expect(buildFindRegExp({ ...QUERY, regex: true, search: '(' })).toBeNull();
    expect(buildFindRegExp(QUERY)).toBeNull();
  });

  it('finds across marks, ignoring case', () => {
    const editor = createEditor();

    expect(texts(editor)).toEqual(TEXTS);
    expect(find(editor, { search: 'foo' })).toEqual(['Foo', 'foo', 'Foo', 'foo', 'foo', 'FOO']);
    expect(find(editor, { search: 'food', wholeWord: true })).toEqual(['Food', 'food']);
  });

  it('matches case and whole words', () => {
    const editor = createEditor();

    expect(find(editor, { matchCase: true, search: 'foo' })).toEqual(['foo', 'foo', 'foo']);
    expect(find(editor, { matchCase: false, search: 'foo', wholeWord: true })).toEqual([
      'Foo',
      'foo',
      'foo',
      'FOO',
    ]);
  });

  it('finds by regex, flags an invalid one', () => {
    const editor = createEditor();

    expect(find(editor, { regex: true, search: '[a-z]\\d+' })).toEqual(['a1', 'b22']);
    setFindQuery(editor, { search: '[' });
    expect(getFindMatches(editor)).toMatchObject({ invalid: true, matches: [] });
  });

  it('expands a regex replacement', () => {
    const exec = /(?<letter>[a-z])(\d+)/.exec('x b22')!;

    expect(expandReplacement('$2$1 $<letter> $& $$ $12', exec)).toBe('22b b b22 $ b2');
  });

  it('preserves case', () => {
    expect(preserveCase('FOO', 'bar')).toBe('BAR');
    expect(preserveCase('foo', 'Bar')).toBe('bar');
    expect(preserveCase('Foo', 'bar')).toBe('Bar');
    expect(preserveCase('foo-Bar', 'baz-qux')).toBe('baz-Qux');
  });

  it('steps through the matches, wrapping', () => {
    const editor = createEditor();

    find(editor, { search: 'foo', wholeWord: true });
    findStep(editor, -1);
    expect(current(editor)).toBe(3);
    findStep(editor, 1);
    expect(current(editor)).toBe(0);
  });

  it('opens from the caret, seeded by a selection', () => {
    const editor = createEditor();

    editor.tf.select({ anchor: { offset: 4, path: [0, 0] }, focus: { offset: 7, path: [0, 0] } });
    openFind(editor);
    expect(editor.getOption(FindReplacePlugin, 'search')).toBe('bar');
    setFindQuery(editor, { search: 'foo' });
    expect(current(editor)).toBe(1);
  });

  it('replaces one, then moves past it', () => {
    const editor = createEditor();

    find(editor, { matchCase: true, replace: 'foofoo', search: 'foo' });
    replaceCurrent(editor);
    expect(texts(editor)[1]).toBe('foofoo Food food');
    expect(current(editor)).toBe(2);
    expect(editor.api.string(getFindMatches(editor).matches[2])).toBe('foo');
    expect(getFindMatches(editor).matches[2].anchor).toEqual({ offset: 2, path: [1, 2] });
  });

  it('replaces all, preserving case, in one undo', () => {
    const editor = createEditor();

    find(editor, { preserveCase: true, replace: 'baz', search: 'foo', wholeWord: true });
    replaceAll(editor);
    expect(texts(editor)).toEqual(['Baz bar', 'baz Food food', 'baz-bar BAZ', 'a1 b22']);
    expect(found(editor)).toEqual([]);

    editor.tf.undo();
    expect(texts(editor)).toEqual(TEXTS);
  });

  it('replaces by regex groups', () => {
    const editor = createEditor();

    find(editor, { regex: true, replace: '$2$1', search: '([a-z])(\\d+)' });
    replaceAll(editor);
    expect(texts(editor)[3]).toBe('1a 22b');
  });

  it('finds in the selection, the caret its block', () => {
    const editor = createEditor();

    find(editor, { search: 'foo' });
    editor.tf.select({ anchor: { offset: 0, path: [1, 0] }, focus: { offset: 3, path: [1, 1] } });
    toggleFindInSelection(editor);
    expect(found(editor)).toEqual(['foo', 'Foo']);

    toggleFindInSelection(editor);
    expect(found(editor)).toHaveLength(6);

    editor.tf.select({ offset: 1, path: [2, 0] });
    toggleFindInSelection(editor);
    expect(found(editor)).toEqual(['foo', 'FOO']);

    closeFind(editor);
    expect(editor.getOptions(FindReplacePlugin)).toMatchObject({ open: false, scope: null });
  });
});

// end-fork-add find-replace
