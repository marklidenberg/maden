// fork-add node-zoom

'use client';

import { NodeZoomAboveNodes } from '@/components/ui/node-zoom';
import { NodeZoomPlugin } from '@/lib/node-zoom';

// After `DndKit` — wrapped outside its gutter, so a hidden block hides it too.
export const NodeZoomKit = [
  NodeZoomPlugin.configure({
    render: { aboveNodes: NodeZoomAboveNodes },
  }),
];

// end-fork-add node-zoom
