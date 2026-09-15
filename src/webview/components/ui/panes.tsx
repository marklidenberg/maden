// fork-add panes

'use client';

import * as React from 'react';

import { GripVertical, PinIcon, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  type PanesState,
  addPane,
  closePane,
  focusPane,
  initialPanes,
  movePane,
  PANE_ADD_EVENT,
  pinPane,
} from '@/lib/panes';
import { cn } from '@/lib/utils';
// fork-add session

import { paneEditor } from '@/lib/panes';
import {
  applyView,
  readSession,
  restorePanes,
  SESSION_SAVE_MS,
  SESSION_TOUCH_EVENT,
  sessionOf,
  touchSession,
  writeSession,
} from '@/lib/session';

// end-fork-add session

export type PaneProps = {
  focused: boolean;
  from?: string;
  id: string;
  jump?: string;
  pinned: boolean;
  primary: boolean;
};

type Drag = { id: string; to: number };

const CORNER_BUTTON = 'h-7 w-7 bg-background/95 backdrop-blur-sm';

// The pane's top row — the zoom's bar, below the page's top padding, as tall as its buttons at the
// text zoom; the grip and the corner buttons centered on it.
const TOP_ROW: React.CSSProperties = {
  height: 'calc(2rem * var(--maden-text-zoom, 1))',
  top: '0.75rem',
};

// The panes in a column, each a view of the document, as tall as its text; a pin in its top right
// corner — more than one, a close beside it, a grip left of the pane, the focused one ringed.
// fork-mutate session

// - Old

// export function Panes({ children }: { children: (pane: PaneProps) => React.ReactNode }) {
//   const [state, setState] = React.useState<PanesState>(initialPanes);

// - New

// As the session of the file at `path` left them.
export function Panes({
  children,
  path,
}: {
  children: (pane: PaneProps) => React.ReactNode;
  path?: string;
}) {
  const [restored] = React.useState(() =>
    restorePanes(path === undefined ? null : readSession(path))
  );
  const [state, setState] = React.useState<PanesState>(restored.state);

  // end-fork-mutate session
  const [drag, setDrag] = React.useState<Drag | null>(null);
  const columnRef = React.useRef<HTMLDivElement>(null);
  const many = state.panes.length > 1;

  // - The plus — a pane under the focused one, zoomed in on a jump

  React.useEffect(() => {
    const add = (event: Event) =>
      setState((state) => addPane(state, (event as CustomEvent<string | undefined>).detail));

    window.addEventListener(PANE_ADD_EVENT, add);

    return () => window.removeEventListener(PANE_ADD_EVENT, add);
  }, []);

  // fork-add session

  // - Each pane's view put back — its editor holds the document by now, its effects run first

  React.useEffect(() => {
    restored.views.forEach((view, id) => {
      const editor = paneEditor(id);

      if (editor) applyView(editor, view);
    });
  }, [restored]);

  // - Saved a moment after the last move — a pane's or a view's; at once as the page goes

  const stateRef = React.useRef(state);

  stateRef.current = state;

  React.useEffect(() => {
    if (path === undefined) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const save = () => {
      clearTimeout(timer);
      timer = undefined;

      const session = sessionOf(stateRef.current, paneEditor);

      if (session) writeSession(path, session);
    };

    const touch = () => {
      clearTimeout(timer);
      timer = setTimeout(save, SESSION_SAVE_MS);
    };

    window.addEventListener(SESSION_TOUCH_EVENT, touch);
    window.addEventListener('pagehide', save);

    return () => {
      window.removeEventListener(SESSION_TOUCH_EVENT, touch);
      window.removeEventListener('pagehide', save);

      if (timer !== undefined) save();
    };
  }, [path]);

  React.useEffect(touchSession, [state]);

  // end-fork-add session

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
      className={cn('flex w-full flex-col', many && 'pl-6')}
      data-maden-panes={many ? 'many' : 'one'}
    >
      {state.panes.map((pane, index) => {
        const focused = pane.id === state.focused;
        const pinned = !!pane.pinned;
        const last = index === state.panes.length - 1;
        const line = drag && (drag.to === index ? 'top-0' : last && drag.to > index ? 'bottom-0' : null);

        return (
          <section
            key={pane.id}
            className={cn('relative', many && 'border-t border-border')}
            data-maden-pane={pane.id}
            data-maden-pane-focused={focused}
            onFocusCapture={() => focus(pane.id)}
            onPointerDownCapture={() => focus(pane.id)}
          >
            {many && (
              <div className="absolute right-full z-20 flex items-center pr-1" style={TOP_ROW}>
                <button
                  type="button"
                  aria-label="Move pane"
                  title="Drag to reorder"
                  className="cursor-grab touch-none rounded-sm p-0.5 text-muted-foreground/70 hover:bg-muted hover:text-foreground active:cursor-grabbing"
                  onPointerDown={onGrip(pane.id)}
                >
                  <GripVertical className="size-3.5" />
                </button>
              </div>
            )}

            <div className="absolute right-1 z-20 flex items-center gap-0.5" style={TOP_ROW}>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className={cn(CORNER_BUTTON, pinned && 'text-foreground')}
                aria-label={pinned ? 'Unpin pane' : 'Pin pane'}
                aria-pressed={pinned}
                title={pinned ? 'Unpin pane' : 'Pin pane'}
                onClick={() => setState((state) => pinPane(state, pane.id))}
                onMouseDown={(e) => e.preventDefault()}
              >
                <PinIcon className={cn('size-3.5', pinned && 'fill-current')} />
              </Button>
              {many && (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className={CORNER_BUTTON}
                  aria-label="Close pane"
                  title="Close pane"
                  onClick={() => setState((state) => closePane(state, pane.id))}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <X className="size-3.5" />
                </Button>
              )}
            </div>

            <div className="relative">
              {children({
                focused,
                from: pane.from,
                id: pane.id,
                jump: pane.jump,
                pinned,
                primary: index === 0,
              })}

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
