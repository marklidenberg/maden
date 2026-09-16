// fork-add session

import type { SlateEditor, TRange } from 'platejs';

import * as React from 'react';

import { NodeApi } from 'platejs';
import { createPlatePlugin, usePluginOption } from 'platejs/react';

import { FoldPlugin } from '@/lib/fold';
import { type Outline, outlineOf, pairOutline } from '@/lib/keep-blocks';
import { keepSelection } from '@/lib/keep-selection';
import { getZoom, getZoomView, NodeZoomPlugin, zoomAt } from '@/lib/node-zoom';
import { type PanesState, addPane, initialPanes } from '@/lib/panes';

// A block by where it stood and what it read — its id is new each load.
type Block = { at: number; text: string };

// A pane's view: its zooms, outermost first; its folds; its caret.
export type PaneView = { caret: TRange | null; folded: Block[]; zooms: Block[] };

// A file's panes as they were left, in order; the document they held — absent in an older session.
export type Session = {
  focused: number;
  outline?: Outline;
  panes: { pinned: boolean; view: PaneView }[];
};

// - Kept per file

const storageKey = (path: string) => `maden.session:${path}`;

export const readSession = (path: string): Session | null => {
  try {
    const session: Session | null = JSON.parse(
      window.localStorage.getItem(storageKey(path)) ?? 'null'
    );

    return Array.isArray(session?.panes) && session.panes.length > 0 ? session : null;
  } catch {
    return null;
  }
};

export const writeSession = (path: string, session: Session) => {
  try {
    window.localStorage.setItem(storageKey(path), JSON.stringify(session));
  } catch {
    // Storage off
  }
};

// - A pane's view, out and back

export const viewOf = (editor: SlateEditor): PaneView => {
  const indexes = new Map(editor.children.map((node, index) => [node.id, index]));
  const blocks = (ids: unknown[]): Block[] =>
    ids.flatMap((id) => {
      const at = indexes.get(id);

      return at === undefined ? [] : [{ at, text: NodeApi.string(editor.children[at]) }];
    });

  return {
    caret: editor.selection,
    folded: blocks([...editor.getOption(FoldPlugin, 'foldedIds')]),
    zooms: blocks(editor.getOption(NodeZoomPlugin, 'stack').map((zoom) => zoom.root)),
  };
};

// At its index where it reads the same, else the nearest block that does.
const findBlock = (texts: string[], { at, text }: Block): number | undefined => {
  for (let distance = 0; distance <= Math.max(at, texts.length); distance++) {
    if (texts[at - distance] === text) return at - distance;
    if (texts[at + distance] === text) return at + distance;
  }

  return undefined;
};

// Put back onto the document as it stands — a block paired with the document as it was left, else
// found by its text, else dropped.
export const applyView = (editor: SlateEditor, view: PaneView, outline?: Outline) => {
  const children = editor.children;
  const texts = children.map((node) => NodeApi.string(node));
  const paired = new Map(outline ? pairOutline(outline, children) : []);
  const found = (blocks: Block[]) =>
    blocks.flatMap((block) => {
      const at = paired.get(block.at) ?? findBlock(texts, block);

      return at === undefined ? [] : [at];
    });

  // - Zooms and folds

  const stack = found(view.zooms).map((at) => zoomAt(children, at));

  editor.setOption(NodeZoomPlugin, 'stack', stack);
  editor.setOption(
    FoldPlugin,
    'foldedIds',
    new Set(found(view.folded).map((at) => children[at].id as string))
  );

  // - The caret; outside the zoom — at its root's end

  const follow = (point: TRange['anchor']) => {
    const at = paired.get(point.path[0]);

    return at === undefined ? point : { ...point, path: [at, ...point.path.slice(1)] };
  };

  keepSelection(
    editor,
    view.caret && { anchor: follow(view.caret.anchor), focus: follow(view.caret.focus) }
  );

  const zoom = getZoomView(children, getZoom(stack));
  const inZoom = (path?: number[]) => !!path && path[0] >= zoom!.start && path[0] < zoom!.stop;

  if (zoom && (!inZoom(editor.selection?.anchor.path) || !inZoom(editor.selection?.focus.path))) {
    editor.tf.select(editor.api.end([zoom.start])!);
  }
};

// - The panes

// As they were left — ids new, each pane's view to put back once it holds the document.
export const restorePanes = (
  session: Session | null
): { outline?: Outline; state: PanesState; views: Map<string, PaneView> } => {
  let state = initialPanes();

  if (!session) return { state, views: new Map() };

  session.panes.slice(1).forEach(() => {
    state = addPane(state);
  });

  const ids = state.panes.map((pane) => pane.id);

  return {
    outline: session.outline,
    state: {
      focused: ids[session.focused] ?? ids[0],
      panes: ids.map((id, index) => ({ id, pinned: session.panes[index].pinned })),
    },
    views: new Map(ids.map((id, index) => [id, session.panes[index].view])),
  };
};

// As they stand — none while a pane has no editor yet.
export const sessionOf = (
  state: PanesState,
  editorOf: (id: string) => SlateEditor | undefined
): Session | null => {
  const panes: Session['panes'] = [];

  for (const pane of state.panes) {
    const editor = editorOf(pane.id);

    if (!editor) return null;

    panes.push({ pinned: !!pane.pinned, view: viewOf(editor) });
  }

  return {
    focused: state.panes.findIndex((pane) => pane.id === state.focused),
    outline: outlineOf(editorOf(state.panes[0].id)!.children),
    panes,
  };
};

// - A move — the session saved a moment after the last

export const SESSION_SAVE_MS = 500;

export const SESSION_TOUCH_EVENT = 'maden:session-touch';

export const touchSession = () => {
  window.dispatchEvent(new Event(SESSION_TOUCH_EVENT));
};

// A pane's caret or text moved, a zoom or a fold.
export const SessionPlugin = createPlatePlugin({
  key: 'session',
  handlers: {
    onChange: () => {
      touchSession();
    },
  },
  useHooks: () => {
    const stack = usePluginOption(NodeZoomPlugin, 'stack');
    const folded = usePluginOption(FoldPlugin, 'foldedIds');

    React.useEffect(touchSession, [stack, folded]);
  },
});

// end-fork-add session
