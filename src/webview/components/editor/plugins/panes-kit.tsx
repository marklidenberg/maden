// fork-add panes

'use client';

import { PanePlugin } from '@/lib/panes';

// First — its `onChange` sends the pane's change on before any handler that may claim the change.
export const PanesKit = [PanePlugin];

// end-fork-add panes
