// fork-add panes

import type { Operation, SlateEditor } from 'platejs';

import { NodeIdPlugin } from 'platejs';
import { createPlatePlugin } from 'platejs/react';

import { FoldPlugin } from '@/lib/fold';
import { keepSelection } from '@/lib/keep-selection';
import { getZoom, NodeZoomPlugin } from '@/lib/node-zoom';
import { spotlightJump } from '@/lib/spotlight';
// fork-add fast-reload

import { patchBlocks } from '@/lib/patch-blocks';

// end-fork-add fast-reload

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

// fork-add edit-stability

// The editors holding the file's document — given it by the host, or by a pane holding it. One
// opened on nothing sends nothing to the host.
const holding = new WeakSet<SlateEditor>();

export const holdsDocument = (editor: SlateEditor) => holding.has(editor);

export const holdDocument = (editor: SlateEditor) => {
  holding.add(editor);
};

export const hasOwnOperations = (editor: SlateEditor) => ownOperations(editor).length > 0;

// fork-add session

// A whole document taken — the flush's operations before it, onto a document gone, not forwarded: the
// ids a pane gave the empty value it opened with, each pane's would have every other take it whole.
const takenWhole = (editor: SlateEditor) => {
  const { operations } = editor;

  foreign.set(operations, [...(foreign.get(operations) ?? []), [0, operations.length]]);
};

// end-fork-add session

// A pane given the whole document of another — the holding with it.
const takeWhole = (editor: SlateEditor, source: SlateEditor) => {
  // fork-mutate fast-reload

  // - Old

  // takeForeign(editor, () => editor.tf.setValue(structuredClone(source.children)));

  // - New

  // The blocks apart alone
  takeForeign(editor, () => patchBlocks(editor, source.children));

  // end-fork-mutate fast-reload
  // fork-add session

  takenWhole(editor);

  // end-fork-add session

  if (holding.has(source)) holding.add(editor);
};

// The history of a document no longer there — its operations would land at the wrong place. The
// object is shared: cleared in place, for every pane.
const forgetHistory = (editor: SlateEditor) => {
  editor.history.undos = [];
  editor.history.redos = [];
};

const sameNode = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const aKeys = Object.keys(a).filter((key) => (a as Record<string, unknown>)[key] !== undefined);
  const bKeys = Object.keys(b).filter((key) => (b as Record<string, unknown>)[key] !== undefined);

  return (
    aKeys.length === bKeys.length &&
    aKeys.every((key) =>
      sameNode((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
    )
  );
};

// A pane gone apart from the one it took a change from: the blocks' ids, and the blocks about the
// ones the operations named.
const hasDiverged = (editor: SlateEditor, other: SlateEditor, operations: Operation[]) => {
  const { children } = editor;

  if (other.children.length !== children.length) return true;
  if (other.children.some((node, index) => node.id !== children[index].id)) return true;

  const named = operations.flatMap((operation) => [
    ...('path' in operation ? [(operation.path as number[])[0]] : []),
    ...('newPath' in operation ? [(operation.newPath as number[])[0]] : []),
  ]);

  return named.some((index) =>
    [index - 1, index, index + 1].some(
      (at) => at >= 0 && at < children.length && !sameNode(children[at], other.children[at])
    )
  );
};

// end-fork-add edit-stability

// The pane's change onto every other; one that will not take it — the whole document again.
export const forwardChange = (editor: SlateEditor) => {
  const operations = ownOperations(editor);

  if (operations.length === 0) return;

  editors.forEach((other) => {
    if (other === editor) return;

    // fork-mutate edit-stability

    // - Old

    // try {
    //   takeForeign(other, () => operations.forEach((operation) => other.tf.apply(operation)));
    // } catch {
    //   takeForeign(other, () => other.tf.setValue(structuredClone(editor.children)));
    // }

    // - New

    // - Taken as is; gone apart — a normalization of its own, a change lost — the whole document again

    try {
      takeForeign(other, () => operations.forEach((operation) => other.tf.apply(operation)));

      if (hasDiverged(editor, other, operations)) takeWhole(other, editor);
    } catch {
      takeWhole(other, editor);
    }

    // end-fork-mutate edit-stability
  });
};

// fork-add external-reload

// The document from outside — the pane told of it takes it, every other pane takes it whole. A text
// in place of the text: its operations, forwarded, would land on a pane that took the document as it
// opened, and leave the old text standing under the new.
export const takeDocument = (editor: SlateEditor, take: () => void) => {
  takeForeign(editor, take);
  // fork-add edit-stability

  // - The history of the text before it gone; the document held

  forgetHistory(editor);
  holding.add(editor);

  // end-fork-add edit-stability
  // fork-add session

  takenWhole(editor);

  // end-fork-add session

  editors.forEach((other) => {
    if (other === editor) return;

    // fork-mutate edit-stability

    // - Old

    // takeForeign(other, () => other.tf.setValue(structuredClone(editor.children)));

    // - New

    takeWhole(other, editor);

    // end-fork-mutate edit-stability
  });
};

// end-fork-add external-reload

export const PanePlugin = createPlatePlugin({
  key: 'pane',
  options: { focused: true, pinned: false },
  handlers: {
    onChange: ({ editor }) => {
      forwardChange(editor);
    },
  },
});

// fork-add edit-stability

// An undo or a redo that will not apply — its operations half applied: the document put back as it
// stood, the history dropped, so the next press does not try it again.
export const HistoryGuardPlugin = createPlatePlugin({
  key: 'historyGuard',
}).overrideEditor(({ editor, tf: { redo, undo } }) => {
  const guard = (step: () => void) => {
    const children = editor.children;
    const selection = editor.selection;

    try {
      step();
    } catch (error) {
      console.error('Maden: history step failed, the document put back', error);

      forgetHistory(editor);
      editor.tf.withoutSaving(() => {
        editor.tf.setValue(children);
        keepSelection(editor, selection);
      });
    }
  };

  return {
    transforms: {
      redo: () => guard(redo),
      undo: () => guard(undo),
    },
  };
});

// end-fork-add edit-stability

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
    // fork-mutate edit-stability

    // - Old

    // takeForeign(editor, () => editor.tf.setValue(structuredClone(source.children)));

    // - New

    takeWhole(editor, source);

    // end-fork-mutate edit-stability
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
