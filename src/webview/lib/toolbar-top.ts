// fork-add toolbar-top

import * as React from 'react';

// The row at the top of the page, where the focused pane's buttons go.
let slot: HTMLElement | null = null;

const listeners = new Set<() => void>();

export const setToolbarSlot = (element: HTMLElement | null) => {
  if (element === slot) return;

  slot = element;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

const getSlot = () => slot;

export const useToolbarSlot = () => React.useSyncExternalStore(subscribe, getSlot, getSlot);

// end-fork-add toolbar-top
