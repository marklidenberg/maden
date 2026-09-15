// fork-add fold-chevrons

'use client';

import * as React from 'react';

import { ChevronRightIcon } from 'lucide-react';
import {
  type PlateElementProps,
  atom,
  plateStore,
  usePlateStore,
  usePluginOption,
  useStoreAtomValue,
} from 'platejs/react';

import { useZoomIndent } from '@/components/ui/node-zoom';
import { buildFoldIndex, FoldPlugin } from '@/lib/fold';
import { lineMiddle } from '@/lib/gutter-center';
import { cn } from '@/lib/utils';

const foldIndexAtom = atom((get) =>
  buildFoldIndex(get(plateStore.atom.trackedEditor).editor.children)
);

// Upstream toggle's.
const HIDDEN: React.CSSProperties = {
  height: 0,
  margin: 0,
  overflow: 'hidden',
  visibility: 'hidden',
};

export function FoldHidden({ children, element }: PlateElementProps) {
  const id = element.id as string;
  const folded = usePluginOption(FoldPlugin, 'foldedIds');
  const hidden = useStoreAtomValue(
    usePlateStore(),
    React.useMemo(
      () =>
        atom((get) =>
          (get(foldIndexAtom).ancestors.get(id) ?? []).some((ancestor) =>
            folded.has(ancestor)
          )
        ),
      [folded, id]
    )
  );

  return hidden ? <div style={HIDDEN}>{children}</div> : children;
}

// Left of the marker, on hover of the drag row; while folded, always. A top-level item's marker
// sits beside the drag handle — its chevron goes left of the handle; in a zoom, by the indent it shows.
// Its middle on the item's first line, kept there as the line moves — a theme, the text zoom.
export function FoldChevron({ children, editor, element }: PlateElementProps) {
  const id = element.id as string;
  const folded = usePluginOption(FoldPlugin, 'foldedIds').has(id);
  const indent = useZoomIndent(element);
  const ref = React.useRef<HTMLButtonElement>(null);
  const parent = useStoreAtomValue(
    usePlateStore(),
    React.useMemo(
      () => atom((get) => get(foldIndexAtom).parents.has(id)),
      [id]
    )
  );

  React.useLayoutEffect(() => {
    const button = ref.current;
    const item = button?.parentElement;

    if (!button || !item) return;

    const observer = new ResizeObserver(() => {
      const middle = lineMiddle(item, item);

      if (middle !== undefined) button.style.top = `${middle - button.offsetHeight / 2}px`;
    });

    observer.observe(item);

    return () => observer.disconnect();
  }, [parent]);

  return (
    <>
      {parent && (
        <button
          ref={ref}
          className={cn(
            'absolute top-1 flex size-5 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:bg-accent [&_svg]:size-4',
            indent === 1 ? '-left-[70px]' : '-left-12',
            !folded && 'opacity-0 group-hover:opacity-100'
          )}
          contentEditable={false}
          data-plate-prevent-deselect
          type="button"
          onClick={() => editor.getApi(FoldPlugin).fold.toggle(id)}
          onMouseDown={(event) => event.preventDefault()}
        >
          <ChevronRightIcon
            className={cn('transition-transform duration-75', !folded && 'rotate-90')}
          />
        </button>
      )}
      {children}
    </>
  );
}

// end-fork-add fold-chevrons
