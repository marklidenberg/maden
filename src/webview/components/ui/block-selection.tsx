'use client';

import * as React from 'react';

import { DndPlugin } from '@platejs/dnd';
import { useBlockSelected } from '@platejs/selection/react';
import { cva } from 'class-variance-authority';
import { type PlateElementProps, usePluginOption } from 'platejs/react';

// fork-add block-select

import { BlockSelectGroup } from '@/components/ui/block-select';

// end-fork-add block-select

export const blockSelectionVariants = cva(
  'pointer-events-none absolute inset-0 z-[1] bg-brand/[.13] transition-opacity',
  {
    defaultVariants: {
      active: true,
    },
    variants: {
      active: {
        false: 'opacity-0',
        true: 'opacity-100',
      },
    },
  }
);

export function BlockSelection(props: PlateElementProps) {
  const isBlockSelected = useBlockSelected();
  const isDragging = usePluginOption(DndPlugin, 'isDragging');

  if (
    !isBlockSelected ||
    props.plugin.key === 'tr' ||
    props.plugin.key === 'table'
  )
    return null;

  // fork-add block-select

  // A top-level block — one highlight with its children
  if (props.path.length === 1) {
    return (
      <BlockSelectGroup
        className={blockSelectionVariants({ active: isBlockSelected && !isDragging })}
        element={props.element}
      />
    );
  }

  // end-fork-add block-select

  return (
    <div
      className={blockSelectionVariants({
        active: isBlockSelected && !isDragging,
      })}
      data-slot="block-selection"
    />
  );
}
