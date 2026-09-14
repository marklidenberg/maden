// fork-add fold-chevrons

'use client';

import * as React from 'react';

import { ChevronRightIcon } from 'lucide-react';
import { KEYS } from 'platejs';
import {
  type PlateElementProps,
  atom,
  plateStore,
  usePlateStore,
  usePluginOption,
  useStoreAtomValue,
} from 'platejs/react';

import { buildFoldIndex, FoldPlugin } from '@/lib/fold';
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
// sits beside the drag handle — its chevron goes left of the handle.
export function FoldChevron({ children, editor, element }: PlateElementProps) {
  const id = element.id as string;
  const folded = usePluginOption(FoldPlugin, 'foldedIds').has(id);
  const parent = useStoreAtomValue(
    usePlateStore(),
    React.useMemo(
      () => atom((get) => get(foldIndexAtom).parents.has(id)),
      [id]
    )
  );

  return (
    <>
      {parent && (
        <button
          className={cn(
            'absolute top-1 flex size-5 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:bg-accent [&_svg]:size-4',
            element[KEYS.indent] === 1 ? '-left-[70px]' : '-left-12',
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
