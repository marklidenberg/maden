// fork-add block-select

'use client';

import * as React from 'react';

import type { TElement } from 'platejs';

import { BlockSelectionPlugin } from '@platejs/selection/react';
import { useEditorRef, useEditorSelector, usePluginOption } from 'platejs/react';

import { selectionGroups } from '@/lib/block-select';

// A selected top-level block's highlight, stretched down over its children selected with it —
// theirs, none.
export function BlockSelectGroup({
  className,
  element,
}: {
  className: string;
  element: TElement;
}) {
  const editor = useEditorRef();
  const ids = usePluginOption(BlockSelectionPlugin, 'selectedIds');
  const covered = useEditorSelector(
    (editor) => selectionGroups(editor.children, ids).get(element.id as string),
    [ids, element.id]
  );
  const ref = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const overlay = ref.current;
    const editable = editor.api.toDOMNode(editor);

    if (!overlay || !editable || !covered?.length) return;

    // Down to the lowest child shown — a folded one is hidden, not gone.
    const stretch = () => {
      const bottoms = covered
        .map((node) => editor.api.toDOMNode(node))
        .filter((dom) => !!dom?.checkVisibility({ visibilityProperty: true }))
        .map((dom) => dom!.getBoundingClientRect().bottom);
      const box = overlay.offsetParent?.getBoundingClientRect();

      overlay.style.bottom =
        box && bottoms.length > 0 ? `${box.bottom - Math.max(...bottoms)}px` : '';
    };

    const observer = new ResizeObserver(stretch);

    stretch();
    observer.observe(editable);

    return () => {
      observer.disconnect();
      overlay.style.bottom = '';
    };
  }, [covered, editor]);

  if (!covered) return null;

  return <div ref={ref} className={className} data-slot="block-selection" />;
}

// end-fork-add block-select
