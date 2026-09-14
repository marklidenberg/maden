// fork-add node-zoom

import type { SlateEditor, TElement, Value } from 'platejs';

import { BlockSelectionPlugin } from '@platejs/selection/react';
import { KEYS, RangeApi } from 'platejs';
import { createPlatePlugin } from 'platejs/react';

// A press on a magnifier: the block, and the first block past what it holds — `null`, the end.
// Blocks typed between the two stay in.
export type NodeZoom = { root: string; stop: string | null };

export type NodeZoomView = {
  ancestors: TElement[];
  root: TElement;
  start: number;
  stop: number;
};

export type NodeZoomPlace = 'hidden' | 'root' | 'shown';

// A heading ranks by its depth; any other block under every heading, by its indent.
export const rankOf = (node: TElement): number => {
  const heading = /^h([1-6])$/.exec(node.type);

  return heading
    ? Number(heading[1])
    : 7 + ((node[KEYS.indent] as number | undefined) ?? 0);
};

// What a block holds: the blocks after it ranked deeper, up to the first that is not.
export const holdsUpTo = (children: Value, index: number): number => {
  const rank = rankOf(children[index]);
  let stop = index + 1;

  while (stop < children.length && rankOf(children[stop]) > rank) stop++;

  return stop;
};

// Its breadcrumb: each block before it ranked shallower than all between, outermost first.
export const ancestorsOf = (children: Value, index: number): TElement[] => {
  const ancestors: TElement[] = [];
  let rank = rankOf(children[index]);

  for (let i = index - 1; i >= 0; i--) {
    if (rankOf(children[i]) < rank) {
      ancestors.unshift(children[i]);
      rank = rankOf(children[i]);
    }
  }

  return ancestors;
};

// The root's indent the zoom is moved left by — a list's first level kept, for its marker.
export const indentShift = (root: TElement): number =>
  Math.max(
    0,
    ((root[KEYS.indent] as number | undefined) ?? 0) - (root[KEYS.listType] ? 1 : 0)
  );

const indexes = new WeakMap<Value, Map<unknown, number>>();

const indexOf = (children: Value, id: unknown): number => {
  let index = indexes.get(children);

  if (!index) {
    const built = new Map<unknown, number>();

    children.forEach((node, i) => built.set(node.id, i));
    indexes.set(children, built);
    index = built;
  }

  return id == null ? -1 : (index.get(id) ?? -1);
};

export const zoomAt = (children: Value, index: number): NodeZoom => ({
  root: children[index].id as string,
  stop: (children[holdsUpTo(children, index)]?.id as string | undefined) ?? null,
});

export const getZoom = (stack: NodeZoom[]): NodeZoom | null => stack.at(-1) ?? null;

let cached: { children: Value; view: NodeZoomView | null; zoom: NodeZoom } | undefined;

// The blocks a zoom shows, `start` up to `stop`; `null` — its root gone.
export const getZoomView = (
  children: Value,
  zoom: NodeZoom | null
): NodeZoomView | null => {
  if (!zoom) return null;
  if (cached?.children === children && cached.zoom === zoom) return cached.view;

  const start = indexOf(children, zoom.root);
  let view: NodeZoomView | null = null;

  if (start !== -1) {
    const stop = zoom.stop === null ? children.length : indexOf(children, zoom.stop);

    view = {
      ancestors: ancestorsOf(children, start),
      root: children[start],
      start,
      stop: stop > start ? stop : holdsUpTo(children, start),
    };
  }

  cached = { children, view, zoom };

  return view;
};

export const placeIn = (
  children: Value,
  zoom: NodeZoom | null,
  id: unknown
): NodeZoomPlace => {
  const view = getZoomView(children, zoom);

  if (!view) return 'shown';

  const index = indexOf(children, id);

  if (index === view.start) return 'root';

  return index > view.start && index < view.stop ? 'shown' : 'hidden';
};

// The zoom on top fit to the blocks: its root gone — dropped; its stop gone — found again.
export const settleZoomStack = (children: Value, stack: NodeZoom[]): NodeZoom[] => {
  const zoom = getZoom(stack);

  if (!zoom) return stack;

  const start = indexOf(children, zoom.root);

  if (start === -1) return settleZoomStack(children, stack.slice(0, -1));
  if (zoom.stop === null || indexOf(children, zoom.stop) > start) return stack;

  return [...stack.slice(0, -1), zoomAt(children, start)];
};

export const NodeZoomPlugin = createPlatePlugin({
  key: 'nodeZoom',
  options: { stack: [] as NodeZoom[] },
  handlers: {
    onChange: ({ editor, getOption, setOption }) => {
      const stack = getOption('stack');
      const settled = settleZoomStack(editor.children, stack);

      if (settled !== stack) setOption('stack', settled);
    },
  },
}).overrideEditor(({ editor, getOption, tf: { selectAll } }) => {
  // Absent in an editor without block selection
  const blockSelection = editor.getApi(BlockSelectionPlugin).blockSelection;
  const selectAllBlocks = blockSelection?.selectAll;
  const viewOf = () => getZoomView(editor.children, getZoom(getOption('stack')));

  const selectZoomBlocks = (view: NodeZoomView) => {
    blockSelection.set(
      editor.children.slice(view.start, view.stop).map((node) => node.id as string)
    );
    blockSelection.focus();
  };

  // Select all — upstream's reaches hidden blocks; in a zoom, its blocks alone
  return {
    api: {
      blockSelection: {
        selectAll: () => {
          const view = viewOf();

          if (view) selectZoomBlocks(view);
          else selectAllBlocks?.();
        },
      },
    },
    transforms: {
      // A block first, as upstream; then the zoom's text; then its blocks
      selectAll: () => {
        const view = viewOf();

        if (!view) return selectAll();
        if (
          editor.api.isAt({ block: true }) &&
          !editor.api.isAt({ block: true, end: true, start: true })
        ) {
          return selectAll();
        }

        const range = {
          anchor: editor.api.start([view.start])!,
          focus: editor.api.end([view.stop - 1])!,
        };

        if (editor.selection && RangeApi.equals(editor.selection, range)) {
          selectZoomBlocks(view);
        } else {
          editor.tf.select(range);
        }

        return true;
      },
    },
  };
});

const setStack = (editor: SlateEditor, stack: NodeZoom[]) =>
  editor.setOption(NodeZoomPlugin, 'stack', stack);

// In on a block — it and what it holds, alone; a caret outside brought to its end.
export const zoomIn = (editor: SlateEditor, id: string) => {
  const stack = editor.getOption(NodeZoomPlugin, 'stack');
  const index = indexOf(editor.children, id);

  if (index === -1 || getZoom(stack)?.root === id) return;

  const zoom = zoomAt(editor.children, index);
  const view = getZoomView(editor.children, zoom)!;
  const inView = (path?: number[]) =>
    !!path && path[0] >= view.start && path[0] < view.stop;

  setStack(editor, [...stack, zoom]);

  if (!inView(editor.selection?.anchor.path) || !inView(editor.selection?.focus.path)) {
    editor.tf.select(editor.api.end([index])!);
  }
};

export const zoomBack = (editor: SlateEditor) =>
  setStack(
    editor,
    settleZoomStack(editor.children, editor.getOption(NodeZoomPlugin, 'stack').slice(0, -1))
  );

export const zoomReset = (editor: SlateEditor) => setStack(editor, []);

// end-fork-add node-zoom
