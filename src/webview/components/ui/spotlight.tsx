// fork-add spotlight

'use client';

import * as React from 'react';

import { SearchIcon } from 'lucide-react';
import { useEditorContainerRef, useEditorRef, usePluginOption } from 'platejs/react';
import { Dialog } from 'radix-ui';

import { getZoom, NodeZoomPlugin } from '@/lib/node-zoom';
import {
  type SpotlightResult,
  bulletsOf,
  loadRecent,
  resolveRecent,
  searchBullets,
  SPOTLIGHT_EVENT,
  SpotlightPlugin,
  spotlightJump,
  touchRecent,
} from '@/lib/spotlight';
import { cn } from '@/lib/utils';

// fork-add panes

import { isPaneFocused, opensPane, splitPane } from '@/lib/panes';

// end-fork-add panes

const keepFocus = (event: React.MouseEvent) => event.preventDefault();

// The letters matched, bold.
function Highlight({ indexes, text }: { indexes?: number[]; text: string }) {
  if (!indexes?.length) return <>{text}</>;

  const marked = new Set(indexes);
  const parts: { marked: boolean; text: string }[] = [];

  for (let i = 0; i < text.length; i++) {
    const last = parts.at(-1);

    if (last?.marked === marked.has(i)) last.text += text[i];
    else parts.push({ marked: marked.has(i), text: text[i] });
  }

  return (
    <>
      {parts.map((part, i) =>
        part.marked ? (
          <span key={i} className="font-semibold text-foreground">
            {part.text}
          </span>
        ) : (
          part.text
        )
      )}
    </>
  );
}

// Every bullet: the recent ones first, then any by a fuzzy search; a pick zooms in on it.
export function Spotlight() {
  const editor = useEditorRef();
  const containerRef = useEditorContainerRef();
  const stack = usePluginOption(NodeZoomPlugin, 'stack');
  const recent = usePluginOption(SpotlightPlugin, 'recent');

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState(0);

  const listRef = React.useRef<HTMLDivElement>(null);
  const openRef = React.useRef(false);
  const picked = React.useRef(false);
  const zoomed = React.useRef(stack);
  // fork-add panes

  // A pick for a new pane — opened once the dialog lets the focus go
  const toPane = React.useRef<string | null>(null);

  // end-fork-add panes

  openRef.current = open;

  // - A zoom in — recent

  React.useEffect(() => {
    const root = getZoom(stack)?.root;

    if (root && stack.length > zoomed.current.length) {
      touchRecent(
        editor,
        editor.children.find((node) => node.id === root)
      );
    }

    zoomed.current = stack;
  }, [editor, stack]);

  // - Opened by the magnifier or the host; again — the next item

  React.useEffect(() => {
    const show = () => {
      // fork-add panes

      if (!isPaneFocused(editor)) return;

      // end-fork-add panes
      if (openRef.current) {
        setSelected((index) => index + 1);

        return;
      }

      loadRecent(editor);
      setQuery('');
      setSelected(0);
      setOpen(true);
    };
    const onMessage = (event: MessageEvent<{ type?: string } | undefined>) => {
      if (event.data?.type === 'openSpotlight') show();
    };

    window.addEventListener(SPOTLIGHT_EVENT, show);
    window.addEventListener('message', onMessage);

    return () => {
      window.removeEventListener(SPOTLIGHT_EVENT, show);
      window.removeEventListener('message', onMessage);
    };
  }, [editor]);

  // - The items

  const { heading, items } = React.useMemo<{ heading?: string; items: SpotlightResult[] }>(() => {
    if (!open) return { items: [] };

    const all = bulletsOf(editor.children);

    if (query.trim()) return { items: searchBullets(all, query) };

    const recents = resolveRecent(all, recent);

    return recents.length > 0
      ? { heading: 'Recent', items: recents.map((bullet) => ({ bullet })) }
      : { heading: 'Bullets', items: all.map((bullet) => ({ bullet })) };
  }, [editor, open, query, recent]);

  const active = items.length > 0 ? ((selected % items.length) + items.length) % items.length : -1;

  React.useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [active, items]);

  const pick = (id: string) => {
    // fork-add panes

    if (opensPane(editor, id)) {
      toPane.current = id;
      setOpen(false);

      return;
    }

    // end-fork-add panes
    picked.current = spotlightJump(editor, id);
    setOpen(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        {/* Not `Dialog.Overlay`: its scroll lock drops the body's padding and shifts the page */}
        <div className="pointer-events-auto fixed inset-0 z-[100] bg-black/10" />
        <Dialog.Content
          aria-describedby={undefined}
          className="maden-spotlight fixed top-[12vh] left-1/2 z-[100] flex max-h-[70vh] w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 flex-col overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            // fork-add panes

            // The pinned pane left as it was; the new one takes the caret
            if (toPane.current) {
              splitPane(toPane.current);
              toPane.current = null;

              return;
            }

            // end-fork-add panes
            editor.tf.focus();

            if (picked.current) {
              picked.current = false;
              requestAnimationFrame(() => containerRef.current?.scrollTo({ top: 0 }));
            }
          }}
        >
          <Dialog.Title className="sr-only">Search bullets</Dialog.Title>

          <div className="flex items-center gap-2 border-b border-border px-3">
            <SearchIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Search bullets"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSelected(0);
              }}
              onKeyDown={(event) => {
                if (event.nativeEvent.isComposing) return;

                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                  event.preventDefault();
                  setSelected(active + (event.key === 'ArrowDown' ? 1 : -1));
                } else if (event.key === 'Enter' && active !== -1) {
                  event.preventDefault();
                  pick(items[active].bullet.id);
                }
              }}
            />
          </div>

          <div ref={listRef} role="listbox" className="overflow-y-auto p-1">
            {heading && items.length > 0 && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">{heading}</div>
            )}

            {items.map(({ bullet, match }, index) => (
              <div
                key={bullet.id}
                role="option"
                aria-selected={index === active}
                data-active={index === active}
                className={cn(
                  'flex cursor-default items-baseline gap-3 rounded-md px-2 py-1.5 text-sm',
                  index === active && 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                )}
                onClick={() => pick(bullet.id)}
                onMouseDown={keepFocus}
                onMouseMove={() => index !== active && setSelected(index)}
              >
                <span className="min-w-0 truncate">
                  <Highlight indexes={match?.indexes} text={bullet.text} />
                </span>
                {bullet.crumbs.length > 0 && (
                  <span className="ml-auto max-w-[45%] shrink-0 truncate text-xs text-muted-foreground">
                    {bullet.crumbs.join(' › ')}
                  </span>
                )}
              </div>
            ))}

            {items.length === 0 && (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                No bullets
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// end-fork-add spotlight
