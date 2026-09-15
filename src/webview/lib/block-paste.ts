// fork-add block-paste

import type { SlateEditor, TElement, Value } from 'platejs';

import { BlockSelectionPlugin } from '@platejs/selection/react';
import { KEYS } from 'platejs';
import { createPlatePlugin } from 'platejs/react';
import { useEffect } from 'react';

import { lastChildIndex } from '@/lib/fold';
import {
  normalizeClipboardMarkdown,
  serializePlateValueToMarkdown,
} from '@/lib/markdown-plate-conversion';

// Ours — the copied blocks as they stand; a paste reads them back.
export const BLOCKS_TYPE = 'application/x-maden-blocks';

const indentOf = (node: TElement): number => (node[KEYS.indent] as number | undefined) ?? 0;

// A list item's last child — as block-select's; any other block, its own.
const lastOf = (children: Value, index: number): number =>
  children[index][KEYS.listType] ? lastChildIndex(children, index) : index;

// The shallowest on `base`, the rest kept relative; a list item never under 1.
export const rebaseIndent = (nodes: TElement[], base: number): TElement[] => {
  const delta = Math.max(
    base - Math.min(...nodes.map(indentOf)),
    ...nodes.filter((node) => node[KEYS.listType]).map((node) => 1 - indentOf(node))
  );

  return nodes.map((node) => {
    const next: TElement = { ...node, [KEYS.indent]: indentOf(node) + delta };

    if (next[KEYS.indent] === 0) delete next[KEYS.indent];

    return next;
  });
};

// The selected blocks, children with them as block-select took them — top-level alone, or none.
const selectedBlocks = (editor: SlateEditor): TElement[] | undefined => {
  const entries = editor.getApi(BlockSelectionPlugin).blockSelection.getNodes({ sort: true });

  if (entries.length === 0 || entries.some(([, path]) => path.length !== 1)) return;

  return entries.map(([node]) => node);
};

export const copyBlocks = (editor: SlateEditor, data: DataTransfer, nodes: TElement[]) => {
  const markdown = normalizeClipboardMarkdown(
    serializePlateValueToMarkdown(editor as never, rebaseIndent(nodes, 0))
  );

  data.setData(BLOCKS_TYPE, JSON.stringify(nodes));
  data.setData('text/plain', markdown);
  data.setData('text/markdown', markdown);
};

// Blocks pasted by the top-level block at `index`: an empty one replaced; any other, followed
// after its children — at its indent. The pasted, first to last.
export const pasteBlocks = (
  editor: SlateEditor,
  nodes: TElement[],
  index: number
): [number, number] => {
  const target = editor.children[index];
  const replace = editor.api.isEmpty(target) && !editor.api.isVoid(target);
  const at = replace ? index : lastOf(editor.children, index) + 1;
  const pasted = rebaseIndent(nodes, indentOf(target));

  editor.tf.withoutNormalizing(() => {
    editor.tf.insertNodes(pasted, { at: [at] });

    if (replace) editor.tf.removeNodes({ at: [at + pasted.length] });
  });

  return [at, at + pasted.length - 1];
};

// The last selected block not a child of one before it.
export const lastSelectedRoot = (children: Value, ids: Set<string>): number | undefined => {
  let root: number | undefined;

  for (let index = 0; index < children.length; index++) {
    if (!ids.has(children[index].id as string)) continue;

    root = index;
    index = lastOf(children, index);
  }

  return root;
};

const isShadowInput = (target: EventTarget | null) =>
  target instanceof HTMLElement && target.classList.contains('slate-shadow-input');

const isSelecting = (editor: SlateEditor, event: ClipboardEvent) =>
  isShadowInput(event.target) && !!editor.getOption(BlockSelectionPlugin, 'isSelectingSome');

// Over selected blocks, ahead of upstream's shadow input: its fragment keeps their indent.
const onCopy = (editor: SlateEditor, event: ClipboardEvent) => {
  if (event.defaultPrevented || !event.clipboardData || !isSelecting(editor, event)) return;

  const nodes = selectedBlocks(editor);

  if (!nodes) return;

  event.preventDefault();
  event.stopPropagation();
  copyBlocks(editor, event.clipboardData, nodes);

  if (event.type !== 'cut' || editor.api.isReadOnly()) return;

  editor.getTransforms(BlockSelectionPlugin).blockSelection.removeNodes();
  editor.getApi(BlockSelectionPlugin).blockSelection.clear();

  if (editor.children.length === 0) editor.tf.focus();
};

// Ours alone, ahead of slate's paste — at the caret in a top-level block, or over selected blocks.
const onPaste = (editor: SlateEditor, event: ClipboardEvent) => {
  const json = event.clipboardData?.getData(BLOCKS_TYPE);

  if (event.defaultPrevented || !json || editor.api.isReadOnly()) return;

  let nodes: TElement[];

  try {
    nodes = JSON.parse(json);
  } catch {
    return;
  }

  if (!Array.isArray(nodes) || nodes.length === 0) return;

  // - Over selected blocks

  if (isSelecting(editor, event)) {
    const ids = editor.getOption(BlockSelectionPlugin, 'selectedIds');
    const index = ids && selectedBlocks(editor) && lastSelectedRoot(editor.children, ids);

    if (index === undefined || index === null) return;

    event.preventDefault();
    event.stopPropagation();

    const [first, last] = pasteBlocks(editor, nodes, index);

    editor.setOption(
      BlockSelectionPlugin,
      'selectedIds',
      new Set(editor.children.slice(first, last + 1).map((node) => node.id as string))
    );

    return;
  }

  // - At the caret

  const { selection } = editor;

  if (!selection || !editor.api.hasEditableTarget(event.target)) return;
  if ([selection.anchor, selection.focus].some((at) => editor.api.block({ at })?.[1].length !== 1)) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  if (editor.api.isExpanded()) editor.tf.delete();

  const [, last] = pasteBlocks(editor, nodes, editor.selection!.focus.path[0]);

  editor.tf.select(editor.api.end([last])!);
};

export const BlockPastePlugin = createPlatePlugin({
  key: 'blockPaste',
  useHooks: ({ editor }) => {
    useEffect(() => {
      const copy = (event: ClipboardEvent) => onCopy(editor, event);
      const paste = (event: ClipboardEvent) => onPaste(editor, event);

      document.addEventListener('copy', copy, true);
      document.addEventListener('cut', copy, true);
      document.addEventListener('paste', paste, true);

      return () => {
        document.removeEventListener('copy', copy, true);
        document.removeEventListener('cut', copy, true);
        document.removeEventListener('paste', paste, true);
      };
    }, [editor]);
  },
});

// end-fork-add block-paste
