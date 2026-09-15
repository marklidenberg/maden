// fork-add node-zoom

import { type TElement, NodeApi } from 'platejs';
import { createPlateEditor } from 'platejs/react';
import { describe, expect, it } from 'vitest';

import { deserializeMarkdownToPlateValue } from '../../src/webview/lib/markdown-plate-conversion';
import {
  ancestorsOf,
  getZoom,
  getZoomView,
  holdsUpTo,
  indentIn,
  NodeZoomPlugin,
  placeIn,
  settleZoomStack,
  zoomBack,
  zoomIn,
  zoomReset,
} from '../../src/webview/lib/node-zoom';

const SOURCE = [
  '# Title',
  '',
  'intro',
  '',
  '## A',
  '',
  '- one',
  '  - two',
  '    - three',
  '  - four',
  '- five',
  '',
  'para',
  '',
  '### A1',
  '',
  'text',
  '',
  '## B',
  '',
  '1. x',
].join('\n');

const A = ['A', 'one', 'two', 'three', 'four', 'five', 'para', 'A1', 'text'];
const ONE = ['one', 'two', 'three', 'four'];

const texts = (nodes: TElement[]) => nodes.map((node) => NodeApi.string(node));

const createEditor = () =>
  createPlateEditor({
    plugins: [NodeZoomPlugin],
    value: deserializeMarkdownToPlateValue(SOURCE).value,
  });

const idOf = (editor: ReturnType<typeof createEditor>, text: string) =>
  editor.children.find((node) => NodeApi.string(node) === text)!.id as string;

const shown = (editor: ReturnType<typeof createEditor>) => {
  const view = getZoomView(
    editor.children,
    getZoom(editor.getOption(NodeZoomPlugin, 'stack'))
  );

  return view ? texts(editor.children.slice(view.start, view.stop)) : null;
};

describe('node zoom', () => {
  it('finds what a block holds', () => {
    const value = deserializeMarkdownToPlateValue(SOURCE).value;

    expect(texts(value.slice(2, holdsUpTo(value, 2)))).toEqual(A);
    expect(texts(value.slice(3, holdsUpTo(value, 3)))).toEqual(ONE);
    expect(holdsUpTo(value, 1)).toBe(2);
    expect(holdsUpTo(value, value.length - 1)).toBe(value.length);
  });

  it('finds its breadcrumb', () => {
    const value = deserializeMarkdownToPlateValue(SOURCE).value;

    expect(texts(ancestorsOf(value, 5))).toEqual(['Title', 'A', 'one', 'two']);
    expect(texts(ancestorsOf(value, 9))).toEqual(['Title', 'A']);
    expect(texts(ancestorsOf(value, 0))).toEqual([]);
  });

  it('zooms in, back and out', () => {
    const editor = createEditor();

    zoomIn(editor, idOf(editor, 'A'));
    expect(shown(editor)).toEqual(A);

    zoomIn(editor, idOf(editor, 'one'));
    expect(shown(editor)).toEqual(ONE);
    expect(editor.selection?.anchor.path[0]).toBe(3);

    zoomBack(editor);
    expect(shown(editor)).toEqual(A);

    zoomIn(editor, idOf(editor, 'one'));
    zoomReset(editor);
    expect(shown(editor)).toBeNull();
  });

  it('places each block', () => {
    const editor = createEditor();

    zoomIn(editor, idOf(editor, 'one'));

    const zoom = getZoom(editor.getOption(NodeZoomPlugin, 'stack'));
    const place = (text: string) => placeIn(editor.children, zoom, idOf(editor, text));

    expect([place('A'), place('one'), place('two'), place('five')]).toEqual([
      'hidden',
      'root',
      'shown',
      'hidden',
    ]);
  });

  it('keeps a block typed inside', () => {
    const editor = createEditor();

    zoomIn(editor, idOf(editor, 'one'));
    editor.tf.insertNodes(
      { children: [{ text: 'new' }], indent: 1, listStyleType: 'disc', type: 'p' },
      { at: [4] }
    );

    expect(shown(editor)).toEqual(['one', 'new', 'two', 'three', 'four']);
  });

  it('finds its stop again, and drops a zoom whose block is gone', () => {
    const editor = createEditor();

    zoomIn(editor, idOf(editor, 'A'));
    zoomIn(editor, idOf(editor, 'one'));
    editor.tf.removeNodes({ at: [7] });

    const stack = editor.getOption(NodeZoomPlugin, 'stack');
    const settled = settleZoomStack(editor.children, stack);

    expect(settled.at(-1)?.stop).toBe(idOf(editor, 'para'));

    editor.tf.removeNodes({ at: [3] });

    expect(settleZoomStack(editor.children, settled).map(({ root }) => root)).toEqual([
      idOf(editor, 'A'),
    ]);
  });

  it('indents a block as the zoom shows it', () => {
    const editor = createEditor();
    const node = (text: string) => editor.children.find((n) => NodeApi.string(n) === text)!;
    const view = () =>
      getZoomView(editor.children, getZoom(editor.getOption(NodeZoomPlugin, 'stack')));

    expect(indentIn(view(), node('three'))).toBe(3);

    zoomIn(editor, idOf(editor, 'two'));
    expect([indentIn(view(), node('two')), indentIn(view(), node('three'))]).toEqual([1, 2]);
  });
});

// end-fork-add node-zoom
