// fork-add fast-reload

import { NodeApi, type Value } from 'platejs';
import { createPlateEditor } from 'platejs/react';
import { Scrubber } from 'slate';
import { afterEach, describe, expect, it } from 'vitest';

import { MarkdownConversionKit } from '../../src/webview/components/editor/markdown-conversion-kit';
import {
  connectHost,
  HostSyncPlugin,
  resetHostSync,
  takeHostText,
} from '../../src/webview/lib/host-sync';
import {
  deserializeMarkdownToPlateValue,
  EMPTY_VALUE,
} from '../../src/webview/lib/markdown-plate-conversion';
import { HistoryGuardPlugin, PanePlugin, registerPane } from '../../src/webview/lib/panes';
import { blockKey, exactKey, patchBlocks } from '../../src/webview/lib/patch-blocks';

const SOURCE = [
  '# Title',
  '',
  'one [a link](https://example.com) inside',
  '',
  '1. first',
  '2. second',
  '3. third',
  '',
  'two',
  '',
  'three',
].join('\n');

const createEditor = (value: Value = EMPTY_VALUE) =>
  createPlateEditor({
    plugins: [...MarkdownConversionKit, PanePlugin, HostSyncPlugin, HistoryGuardPlugin],
    value: structuredClone(value),
  });

type Editor = ReturnType<typeof createEditor>;

const texts = (editor: Editor) => editor.children.map((node) => NodeApi.string(node));

const paragraph = (text: string) => ({ children: [{ text }], type: 'p' });

const hostText = (markdown: string, more: { external?: boolean; revision?: number } = {}) => ({
  fileName: 'note',
  filePath: '/note.md',
  markdown,
  revision: 0,
  ...more,
});

// The blocks of `editor` still the same nodes as `before`, by where they stand now
const kept = (editor: Editor, before: Value) =>
  editor.children.map((node) => before.includes(node));

connectHost(() => undefined);

const registered: (() => void)[] = [];

afterEach(() => {
  registered.splice(0).forEach((off) => off());
  resetHostSync();
});

describe('patchBlocks', () => {
  it('brings the blocks to the text — moved, put in, removed', () => {
    const editor = createEditor(['a', 'b', 'c', 'd', 'e'].map(paragraph));
    const next = ['a', 'd', 'x', 'b', 'e', 'y'].map(paragraph);

    patchBlocks(editor, next);

    expect(editor.children.map(exactKey)).toEqual(next.map(exactKey));
  });

  it('leaves the blocks standing as they are, the nodes themselves', () => {
    const editor = createEditor(['a', 'b', 'c', 'd'].map(paragraph));
    const before = editor.children;

    patchBlocks(editor, ['a', 'b', 'changed', 'd', 'new'].map(paragraph));

    expect(kept(editor, before)).toEqual([true, true, false, true, false]);
  });

  it('puts a paragraph where the text has nothing', () => {
    const editor = createEditor(['a', 'b'].map(paragraph));

    patchBlocks(editor, []);

    expect(texts(editor)).toEqual(['']);
    expect(editor.children[0].type).toBe('p');
  });

  it('writes the document into no error of its own, and leaves slate as it was', () => {
    const editor = createEditor();

    patchBlocks(editor, deserializeMarkdownToPlateValue(SOURCE).value);

    expect(texts(editor)).toEqual(['Title', 'one a link inside', 'first', 'second', 'third', 'two', 'three']);
    expect(Scrubber.stringify({ a: 1 })).toBe('{"a":1}');
  });
});

describe('blockKey', () => {
  it('reads a block parsed afresh as the one in the editor — its ids inside, the numbering, the empty leaves aside', () => {
    const editor = createEditor(deserializeMarkdownToPlateValue(SOURCE).value);
    const fresh = deserializeMarkdownToPlateValue(SOURCE).value;

    fresh.forEach((node, index) => {
      node.id = editor.children[index].id;
    });

    expect(fresh.map(blockKey)).toEqual(editor.children.map(blockKey));
    expect(fresh.map(exactKey)).not.toEqual(editor.children.map(exactKey));
  });
});

describe('a change from outside', () => {
  it('changes the block changed alone, in every pane', () => {
    const a = createEditor();
    const b = createEditor();

    registered.push(registerPane('a', a), registerPane('b', b));
    takeHostText(a, hostText(SOURCE));
    takeHostText(b, hostText(SOURCE));

    const beforeA = a.children;
    const beforeB = b.children;

    takeHostText(a, hostText(SOURCE.replace('two', 'outside'), { external: true }));
    takeHostText(b, hostText(SOURCE.replace('two', 'outside'), { external: true }));

    const changed = [true, true, true, true, true, false, true];

    expect(texts(a)).toEqual(['Title', 'one a link inside', 'first', 'second', 'third', 'outside', 'three']);
    expect(texts(b)).toEqual(texts(a));
    expect(b.children.map((node) => node.id)).toEqual(a.children.map((node) => node.id));
    expect(kept(a, beforeA)).toEqual(changed);
    expect(kept(b, beforeB)).toEqual(changed);
  });
});

// end-fork-add fast-reload
