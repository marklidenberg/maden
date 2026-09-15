// fork-add panes

import type { Operation, SlateEditor } from 'platejs';

import { NodeIdPlugin } from 'platejs';
import { createPlatePlugin } from 'platejs/react';

import { FoldPlugin } from '@/lib/fold';
import { keepSelection } from '@/lib/keep-selection';
import { getZoom, NodeZoomPlugin } from '@/lib/node-zoom';
import { spotlightJump } from '@/lib/spotlight';

// A pane: a view of the one document — an editor of its own, with its zoom and its folds; `jump` —
// the bullet it opens zoomed in on.
export type Pane = { from?: string; id: string; jump?: string; pinned?: boolean };

export type PanesState = { focused: string; panes: Pane[] };

let count = 0;

const newId = () => `pane-${++count}`;

export const initialPanes = (): PanesState => {
  const id = newId();

  return { focused: id, panes: [{ id }] };
};

// A pane under the focused one, split off it — focused.
export const addPane = (state: PanesState, jump?: string): PanesState => {
  const id = newId();
  const at = state.panes.findIndex((pane) => pane.id === state.focused) + 1;

  return {
    focused: id,
    panes: [
      ...state.panes.slice(0, at),
      { from: state.focused, id, jump },
      ...state.panes.slice(at),
    ],
  };
};

// The focus onto the pane above, else the one below; the last pane stays.
export const closePane = (state: PanesState, id: string): PanesState => {
  const at = state.panes.findIndex((pane) => pane.id === id);

  if (at === -1 || state.panes.length === 1) return state;

  const panes = state.panes.filter((pane) => pane.id !== id);
  const focused = state.focused === id ? panes[Math.max(0, at - 1)].id : state.focused;

  return { focused, panes };
};

// The pane before the one at `to` — `panes.length`, last.
export const movePane = (state: PanesState, id: string, to: number): PanesState => {
  const from = state.panes.findIndex((pane) => pane.id === id);

  if (from === -1 || to === from || to === from + 1) return state;

  const panes = state.panes.filter((pane) => pane.id !== id);

  panes.splice(to > from ? to - 1 : to, 0, state.panes[from]);

  return { ...state, panes };
};

export const focusPane = (state: PanesState, id: string): PanesState =>
  state.focused === id || !state.panes.some((pane) => pane.id === id)
    ? state
    : { ...state, focused: id };

// Pinned, or not — the focused pane where none named.
export const pinPane = (state: PanesState, id = state.focused): PanesState => ({
  ...state,
  panes: state.panes.map((pane) => (pane.id === id ? { ...pane, pinned: !pane.pinned } : pane)),
});

// The plus's press; a spotlight's pick in a pinned pane — zoomed in on it.
export const PANE_ADD_EVENT = 'maden:pane-add';

export const splitPane = (jump?: string) =>
  window.dispatchEvent(new CustomEvent(PANE_ADD_EVENT, { detail: jump }));

// - One document across the panes

const editors = new Map<string, SlateEditor>();

// Of a flush's operations, the spans that came from another pane — keyed by the array, gone with it
const foreign = new WeakMap<Operation[], [number, number][]>();

// Another pane's change taken as is: the ids kept, out of the history, the caret held where it stood
const takeForeign = (editor: SlateEditor, take: () => void) => {
  const operations = editor.operations;
  const start = operations.length;
  const selection = editor.selection;
  const reuseId = editor.getOption(NodeIdPlugin, 'reuseId');

  editor.setOption(NodeIdPlugin, 'reuseId', true);

  try {
    editor.tf.withoutSaving(() => editor.tf.withoutNormalizing(take));
  } finally {
    editor.setOption(NodeIdPlugin, 'reuseId', reuseId);
    foreign.set(operations, [...(foreign.get(operations) ?? []), [start, operations.length]]);
  }

  if (selection && !editor.selection) keepSelection(editor, selection);
};

// The flush's own operations — the selection's and another pane's left out
const ownOperations = (editor: SlateEditor): Operation[] => {
  const spans = foreign.get(editor.operations) ?? [];

  return editor.operations.filter(
    (operation, index) =>
      operation.type !== 'set_selection' &&
      !spans.some(([start, end]) => index >= start && index < end)
  );
};

// The pane's change onto every other; one that will not take it — the whole document again.
export const forwardChange = (editor: SlateEditor) => {
  const operations = ownOperations(editor);

  if (operations.length === 0) return;

  editors.forEach((other) => {
    if (other === editor) return;

    try {
      takeForeign(other, () => operations.forEach((operation) => other.tf.apply(operation)));
    } catch {
      takeForeign(other, () => other.tf.setValue(structuredClone(editor.children)));
    }
  });
};

export const PanePlugin = createPlatePlugin({
  key: 'pane',
  options: { focused: true, pinned: false },
  handlers: {
    onChange: ({ editor }) => {
      forwardChange(editor);
    },
  },
});

// The singletons — the magnifier, the find, the rail — act on the focused pane alone.
export const isPaneFocused = (editor: SlateEditor) => editor.getOption(PanePlugin, 'focused');

// A pinned pane keeps its zoom: a bullet other than its root opens in a new pane.
export const opensPane = (editor: SlateEditor, id: string) =>
  editor.getOption(PanePlugin, 'pinned') &&
  getZoom(editor.getOption(NodeZoomPlugin, 'stack'))?.root !== id;

// Among the others: the document from any, the history theirs; the view from the pane split, zoomed
// in on `jump`.
export const registerPane = (id: string, editor: SlateEditor, from?: string, jump?: string) => {
  const source = [...editors.values()].find((other) => other !== editor);
  const split = from === undefined ? undefined : editors.get(from);

  if (source) {
    editor.history = source.history;
    takeForeign(editor, () => editor.tf.setValue(structuredClone(source.children)));
  }

  if (split) {
    editor.setOption(NodeZoomPlugin, 'stack', split.getOption(NodeZoomPlugin, 'stack'));
    editor.setOption(FoldPlugin, 'foldedIds', new Set(split.getOption(FoldPlugin, 'foldedIds')));

    if (split.selection) editor.tf.select(split.selection);
  }

  if (jump) spotlightJump(editor, jump);

  editors.set(id, editor);

  return () => {
    if (editors.get(id) === editor) editors.delete(id);
  };
};

// fork-add session

// A pane's editor — its view saved off it.
export const paneEditor = (id: string): SlateEditor | undefined => editors.get(id);

// end-fork-add session

// end-fork-add panes
