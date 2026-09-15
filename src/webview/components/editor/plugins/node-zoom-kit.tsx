// fork-add node-zoom

'use client';

import { createPlatePlugin } from 'platejs/react';

import { NodeZoomAboveNodes, NodeZoomShiftAboveNodes } from '@/components/ui/node-zoom';
import { NodeZoomPlugin } from '@/lib/node-zoom';

// After `DndKit` and `FoldKit` — wrapped outside both, so a hidden block hides its gutter too.
export const NodeZoomKit = [
  NodeZoomPlugin.configure({
    render: { aboveNodes: NodeZoomAboveNodes },
  }),
];

// Before `DndKit` — wrapped inside its row, so a zoom moves the block left and its gutter stays.
export const NodeZoomShiftKit = [
  createPlatePlugin({
    key: 'nodeZoomShift',
    render: { aboveNodes: NodeZoomShiftAboveNodes },
  }),
];

// end-fork-add node-zoom
