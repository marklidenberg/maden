// fork-add spotlight

'use client';

import { Spotlight } from '@/components/ui/spotlight';
import { SpotlightPlugin } from '@/lib/spotlight';

// After `NodeZoomKit` — a pick zooms in.
export const SpotlightKit = [
  SpotlightPlugin.configure({
    render: { afterEditable: () => <Spotlight /> },
  }),
];

// end-fork-add spotlight
