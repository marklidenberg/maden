// fork-add fold-chevrons

'use client';

import { KEYS } from 'platejs';

import { FoldChevron, FoldHidden } from '@/components/ui/fold-node';
import { FoldPlugin } from '@/lib/fold';

// Top-level blocks alone — children are siblings.
export const FoldKit = [
  FoldPlugin.configure({
    render: {
      aboveNodes: ({ path }) => {
        if (path.length !== 1) return;

        return (props) => <FoldHidden {...props} />;
      },
      belowNodes: ({ element, path }) => {
        if (path.length !== 1 || !element[KEYS.listType]) return;

        return (props) => <FoldChevron {...props} />;
      },
    },
  }),
];

// end-fork-add fold-chevrons
