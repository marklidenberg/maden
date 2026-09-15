// fork-add session

import { NodeApi } from 'platejs';
import { createPlateEditor } from 'platejs/react';
import { describe, expect, it } from 'vitest';

import { FoldPlugin } from '../../src/webview/lib/fold';
import { deserializeMarkdownToPlateValue } from '../../src/webview/lib/markdown-plate-conversion';
import { getZoom, NodeZoomPlugin, zoomIn } from '../../src/webview/lib/node-zoom';
import { addPane, initialPanes, pinPane } from '../../src/webview/lib/panes';
import {
  applyView,
  type PaneView,
  restorePanes,
  sessionOf,
  viewOf,
} from '../../src/webview/lib/session';

const SOURCE = ['# Title', '', '- one', '  - two', '- three', '  - four'];

// A load — its ids new each time
const load = (lines = SOURCE) =>
  createPlateEditor({
    plugins: [NodeZoomPlugin, FoldPlugin],
    value: deserializeMarkdownToPlateValue(lines.join('\n')).value,
  });

type Editor = ReturnType<typeof load>;

const idOf = (editor: Editor, text: string) =>
  editor.children.find((node) => NodeApi.string(node) === text)!.id as string;

const textOf = (editor: Editor, id: string) =>
  NodeApi.string(editor.children.find((node) => node.id === id)!);

const folded = (editor: Editor) =>
  [...editor.getOption(FoldPlugin, 'foldedIds')].map((id) => textOf(editor, id));

const zoomed = (editor: Editor) => {
  const zoom = getZoom(editor.getOption(NodeZoomPlugin, 'stack'));

  return zoom && textOf(editor, zoom.root);
};

// A view as stored — `one` folded, zoomed in on `three`
const stored = (): PaneView => {
  const editor = load();

  editor.setOption(FoldPlugin, 'foldedIds', new Set([idOf(editor, 'one')]));
  zoomIn(editor, idOf(editor, 'three'));

  return JSON.parse(JSON.stringify(viewOf(editor)));
};

describe('a pane view', () => {
  it('comes back on a new load', () => {
    const editor = load();

    applyView(editor, stored());

    expect(folded(editor)).toEqual(['one']);
    expect(zoomed(editor)).toBe('three');
    expect(editor.selection?.focus.path[0]).toBe(3);
  });

  it('finds a block moved by a line above it', () => {
    const editor = load(['# Title', '', '- new', ...SOURCE.slice(2)]);

    applyView(editor, stored());

    expect(folded(editor)).toEqual(['one']);
    expect(zoomed(editor)).toBe('three');
    expect(editor.selection?.focus.path[0]).toBe(4);
  });

  it('drops a block gone', () => {
    const editor = load(['# Title', '', '- one', '  - two']);

    applyView(editor, stored());

    expect(folded(editor)).toEqual(['one']);
    expect(zoomed(editor)).toBeNull();
  });
});

describe('the panes', () => {
  it('come back as they were left', () => {
    const state = pinPane(addPane(addPane(initialPanes())));
    const editors = new Map(state.panes.map((pane) => [pane.id, load()]));
    const session = JSON.parse(JSON.stringify(sessionOf(state, (id) => editors.get(id))));
    const restored = restorePanes(session);

    expect(restored.state.panes.map((pane) => pane.pinned)).toEqual([false, false, true]);
    expect(restored.state.focused).toBe(restored.state.panes[2].id);
    expect([...restored.views.keys()]).toEqual(restored.state.panes.map((pane) => pane.id));
  });

  it('are not taken while a pane has no editor', () => {
    expect(sessionOf(addPane(initialPanes()), () => undefined)).toBeNull();
  });

  it('start as one pane with no session', () => {
    expect(restorePanes(null).state.panes).toHaveLength(1);
  });
});

// end-fork-add session
