// fork-add panes

'use client';

import { PanePlugin } from '@/lib/panes';
// fork-add edit-stability

import { HostSyncPlugin } from '@/lib/host-sync';
import { HistoryGuardPlugin } from '@/lib/panes';

// end-fork-add edit-stability
// fork-add session

import { SessionPlugin } from '@/lib/session';

// end-fork-add session

// First — its `onChange` sends the pane's change on before any handler that may claim the change.
// fork-mutate session

// - Old

// export const PanesKit = [PanePlugin];

// - New

// fork-mutate edit-stability

// - Old

// export const PanesKit = [PanePlugin, SessionPlugin];

// - New

// The host sync after it — the change forwarded to every pane, then sent to the host

export const PanesKit = [PanePlugin, HostSyncPlugin, HistoryGuardPlugin, SessionPlugin];

// end-fork-mutate edit-stability

// end-fork-mutate session

// end-fork-add panes
