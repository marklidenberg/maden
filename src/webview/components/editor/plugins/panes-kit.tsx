// fork-add panes

'use client';

import { PanePlugin } from '@/lib/panes';
// fork-add session

import { SessionPlugin } from '@/lib/session';

// end-fork-add session

// First — its `onChange` sends the pane's change on before any handler that may claim the change.
// fork-mutate session

// - Old

// export const PanesKit = [PanePlugin];

// - New

export const PanesKit = [PanePlugin, SessionPlugin];

// end-fork-mutate session

// end-fork-add panes
