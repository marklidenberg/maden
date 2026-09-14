// fork-add node-zoom

'use client';

import { NodeZoomAboveNodes } from '@/components/ui/node-zoom';
import { NodeZoomPlugin } from '@/lib/node-zoom';

// After `DndKit` and `FoldKit` — wrapped outside both, so a hidden block hides its gutter too.
export const NodeZoomKit = [
  NodeZoomPlugin.configure({
    render: { aboveNodes: NodeZoomAboveNodes },
  }),
];

// end-fork-add node-zoom
