// fork-add find-replace

'use client';

import { FindReplaceLeaf, FindReplaceWidget } from '@/components/ui/find-replace';
import { FindReplacePlugin } from '@/lib/find-replace';

export const FindReplaceKit = [
  FindReplacePlugin.configure({
    node: { component: FindReplaceLeaf },
    render: { afterEditable: () => <FindReplaceWidget /> },
  }),
];

// end-fork-add find-replace
