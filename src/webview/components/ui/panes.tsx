// fork-add panes

'use client';

import * as React from 'react';

import { GripHorizontal, X } from 'lucide-react';

import {
  type PanesState,
  addPane,
  closePane,
  focusPane,
  initialPanes,
  movePane,
  PANE_ADD_EVENT,
} from '@/lib/panes';
import { cn } from '@/lib/utils';

export type PaneProps = { focused: boolean; from?: string; id: string; primary: boolean };

type Drag = { id: string; to: number };

// The panes in a column, each a view of the document; more than one — a strip over each, a grip
// and a close in it, the focused one ringed.
export function Panes({ children }: { children: (pane: PaneProps) => React.ReactNode }) {
  const [state, setState] = React.useState<PanesState>(initialPanes);
  const [drag, setDrag] = React.useState<Drag | null>(null);
  const columnRef = React.useRef<HTMLDivElement>(null);
  const many = state.panes.length > 1;

  // - The plus — a pane under the focused one

  React.useEffect(() => {
    const add = () => setState(addPane);

    window.addEventListener(PANE_ADD_EVENT, add);

    return () => window.removeEventListener(PANE_ADD_EVENT, add);
  }, []);

  // - A grip held: a line between panes follows the pointer; let go — the pane moved there

  const onGrip = (id: string) => (event: React.PointerEvent<HTMLElement>) => {
    const grip = event.currentTarget;
    const column = columnRef.current;

    if (!column || event.button !== 0) return;

    event.preventDefault();
    grip.setPointerCapture(event.pointerId);

    const dropAt = (y: number) => {
      const rects = Array.from(column.querySelectorAll<HTMLElement>('[data-maden-pane]'), (pane) =>
        pane.getBoundingClientRect()
      );
      const at = rects.findIndex((rect) => y < rect.top + rect.height / 2);

      return at === -1 ? rects.length : at;
    };

    let to = dropAt(event.clientY);

    setDrag({ id, to });

    const onMove = (move: PointerEvent) => {
      to = dropAt(move.clientY);
      setDrag({ id, to });
    };
    const onEnd = (moved: boolean) => () => {
      grip.removeEventListener('pointermove', onMove);
      grip.removeEventListener('pointerup', onUp);
      grip.removeEventListener('pointercancel', onCancel);
      setDrag(null);

      if (moved) setState((state) => movePane(state, id, to));
    };
    const onUp = onEnd(true);
    const onCancel = onEnd(false);

    grip.addEventListener('pointermove', onMove);
    grip.addEventListener('pointerup', onUp);
    grip.addEventListener('pointercancel', onCancel);
  };

  const focus = (id: string) => setState((state) => focusPane(state, id));

  return (
    <div
      ref={columnRef}
      className="flex h-full w-full flex-col"
      data-maden-panes={many ? 'many' : 'one'}
    >
      {state.panes.map((pane, index) => {
        const focused = pane.id === state.focused;
        const last = index === state.panes.length - 1;
        const line = drag && (drag.to === index ? 'top-0' : last && drag.to > index ? 'bottom-0' : null);

        return (
          <section
            key={pane.id}
            className="relative flex min-h-0 flex-1 flex-col"
            data-maden-pane={pane.id}
            data-maden-pane-focused={focused}
            onFocusCapture={() => focus(pane.id)}
            onPointerDownCapture={() => focus(pane.id)}
          >
            {many && (
              <div className="flex h-6 shrink-0 items-center border-b border-border bg-muted/40 pr-12 pl-1 text-muted-foreground select-none">
                <button
                  type="button"
                  aria-label="Move pane"
                  title="Drag to reorder"
                  className="cursor-grab touch-none rounded-sm p-0.5 hover:bg-muted hover:text-foreground active:cursor-grabbing"
                  onPointerDown={onGrip(pane.id)}
                >
                  <GripHorizontal className="size-4" />
                </button>
                <span className="flex-1" />
                <button
                  type="button"
                  aria-label="Close pane"
                  title="Close pane"
                  className="rounded-sm p-0.5 hover:bg-muted hover:text-foreground"
                  onClick={() => setState((state) => closePane(state, pane.id))}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

            <div className="relative min-h-0 flex-1">
              {children({ focused, from: pane.from, id: pane.id, primary: index === 0 })}

              {many && focused && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-10 ring-1 ring-inset ring-primary/50"
                />
              )}
            </div>

            {line && (
              <div
                aria-hidden
                className={cn('pointer-events-none absolute inset-x-0 z-20 h-0.5 bg-primary', line)}
              />
            )}
          </section>
        );
      })}
    </div>
  );
}

// end-fork-add panes
