// fork-add find-replace

'use client';

import * as React from 'react';

import type { TRange, TText } from 'platejs';

import {
  ArrowDown,
  ArrowUp,
  CaseSensitive,
  CaseUpper,
  ChevronDown,
  ChevronRight,
  Regex,
  Replace,
  ReplaceAll,
  TextAlignStart,
  WholeWord,
  X,
} from 'lucide-react';
import { isHotkey } from 'platejs';
import {
  type PlateEditor,
  type PlateLeafProps,
  PlateLeaf,
  useEditorReadOnly,
  useEditorRef,
  useEditorSelector,
  usePluginOption,
} from 'platejs/react';
import { createPortal } from 'react-dom';

import {
  buildFindRegExp,
  closeFind,
  currentIndex,
  FindReplacePlugin,
  findStep,
  getFindMatches,
  openFind,
  replaceAll,
  replaceCurrent,
  setFindQuery,
  toggleFindInSelection,
} from '@/lib/find-replace';
import { cn } from '@/lib/utils';

type FindLeaf = TText & { findCurrent?: boolean; findMatch?: boolean; findScope?: boolean };

const keepFocus = (event: React.MouseEvent) => event.preventDefault();

// A match under the bar and the widget, or past the bottom — centered.
const revealMatch = (editor: PlateEditor, match: TRange) => {
  try {
    const range = editor.api.toDOMRange(match);
    const rect = range?.getBoundingClientRect();

    if (range && rect && (rect.top < 96 || rect.bottom > window.innerHeight - 24)) {
      range.startContainer.parentElement?.scrollIntoView({ block: 'center' });
    }
  } catch {
    // Not rendered
  }
};

function FindButton({
  active,
  className,
  ...props
}: React.ComponentProps<'button'> & { active?: boolean }) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-sm border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4',
        active && 'border-primary/60 bg-primary/15 text-foreground',
        className
      )}
      type="button"
      onMouseDown={keepFocus}
      {...props}
    />
  );
}

const inputClassName =
  'h-7 w-60 rounded-sm border border-border bg-background px-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring';

export function FindReplaceWidget() {
  const editor = useEditorRef();
  const readOnly = useEditorReadOnly();
  const open = usePluginOption(FindReplacePlugin, 'open');
  const expanded = usePluginOption(FindReplacePlugin, 'expanded') && !readOnly;
  const search = usePluginOption(FindReplacePlugin, 'search');
  const replace = usePluginOption(FindReplacePlugin, 'replace');
  const matchCase = usePluginOption(FindReplacePlugin, 'matchCase');
  const wholeWord = usePluginOption(FindReplacePlugin, 'wholeWord');
  const regex = usePluginOption(FindReplacePlugin, 'regex');
  const preserveCase = usePluginOption(FindReplacePlugin, 'preserveCase');
  const scope = usePluginOption(FindReplacePlugin, 'scope');
  const current = usePluginOption(FindReplacePlugin, 'current');
  const findRef = React.useRef<HTMLInputElement>(null);
  const [focusTick, setFocusTick] = React.useState(0);

  const count = useEditorSelector(
    (editor) => getFindMatches(editor).matches.length,
    [search, matchCase, wholeWord, regex, scope]
  );
  const index = currentIndex(current, count);
  const invalid = !!search && !buildFindRegExp({ matchCase, regex, search, wholeWord });

  // `cmd + f` — on the frame's window, capturing, so VS Code's listener never gets it
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isHotkey('mod+f', event)) return;

      event.preventDefault();
      event.stopPropagation();
      openFind(editor, { seed: editor.api.isFocused() });
      setFocusTick((tick) => tick + 1);
    };

    window.addEventListener('keydown', onKeyDown, true);

    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [editor]);

  React.useEffect(() => {
    if (!focusTick) return;

    findRef.current?.focus();
    findRef.current?.select();
  }, [focusTick]);

  // `Escape` in the editor — closed, the selection where it is
  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (!(event.target instanceof Element) || !event.target.closest('[data-slate-editor]')) return;

      closeFind(editor);
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editor, open]);

  React.useEffect(() => {
    if (!open) return;

    const match = getFindMatches(editor).matches[index];

    if (match) requestAnimationFrame(() => revealMatch(editor, match));
  }, [editor, open, index, search, matchCase, wholeWord, regex, scope]);

  if (!open) return null;

  const onFindKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      findStep(editor, event.shiftKey ? -1 : 1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeFind(editor, { focus: true });
    }
  };

  const onReplaceKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();

      if (event.metaKey || event.ctrlKey) replaceAll(editor);
      else replaceCurrent(editor);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeFind(editor, { focus: true });
    }
  };

  // On the body — outside the editor container, whose block selection takes a drag
  return createPortal(
    <div
      className="maden-find-replace fixed top-12 right-4 z-[95] flex gap-1 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg"
      data-plate-prevent-deselect
    >
      <FindButton
        aria-expanded={expanded}
        className="h-auto w-5 self-stretch"
        disabled={readOnly}
        title="Toggle Replace"
        onClick={() => editor.setOption(FindReplacePlugin, 'expanded', !expanded)}
      >
        {expanded ? <ChevronDown /> : <ChevronRight />}
      </FindButton>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <div className="relative">
            <input
              ref={findRef}
              aria-invalid={invalid}
              className={cn(
                inputClassName,
                'pr-[76px]',
                invalid && 'border-[var(--destructive)] focus:border-[var(--destructive)]'
              )}
              placeholder="Find"
              spellCheck={false}
              value={search}
              onChange={(event) => setFindQuery(editor, { search: event.target.value })}
              onKeyDown={onFindKeyDown}
            />
            <div className="absolute inset-y-0 right-1 flex items-center gap-0.5">
              <FindButton
                active={matchCase}
                className="size-5"
                title="Match Case"
                onClick={() => setFindQuery(editor, { matchCase: !matchCase })}
              >
                <CaseSensitive />
              </FindButton>
              <FindButton
                active={wholeWord}
                className="size-5"
                title="Match Whole Word"
                onClick={() => setFindQuery(editor, { wholeWord: !wholeWord })}
              >
                <WholeWord />
              </FindButton>
              <FindButton
                active={regex}
                className="size-5"
                title="Use Regular Expression"
                onClick={() => setFindQuery(editor, { regex: !regex })}
              >
                <Regex />
              </FindButton>
            </div>
          </div>

          <span
            className={cn(
              'min-w-[4.5rem] px-1 text-xs whitespace-nowrap tabular-nums',
              !count && (search ? 'text-[var(--destructive)]' : 'text-muted-foreground')
            )}
          >
            {count ? `${index + 1} of ${count}` : 'No results'}
          </span>

          <FindButton
            disabled={!count}
            title="Previous Match (Shift+Enter)"
            onClick={() => findStep(editor, -1)}
          >
            <ArrowUp />
          </FindButton>
          <FindButton disabled={!count} title="Next Match (Enter)" onClick={() => findStep(editor, 1)}>
            <ArrowDown />
          </FindButton>
          <FindButton
            active={!!scope}
            title="Find in Selection"
            onClick={() => toggleFindInSelection(editor)}
          >
            <TextAlignStart />
          </FindButton>
          <FindButton title="Close (Escape)" onClick={() => closeFind(editor, { focus: true })}>
            <X />
          </FindButton>
        </div>

        {expanded && (
          <div className="flex items-center gap-1">
            <div className="relative">
              <input
                className={cn(inputClassName, 'pr-7')}
                placeholder="Replace"
                spellCheck={false}
                value={replace}
                onChange={(event) => editor.setOption(FindReplacePlugin, 'replace', event.target.value)}
                onKeyDown={onReplaceKeyDown}
              />
              <div className="absolute inset-y-0 right-1 flex items-center">
                <FindButton
                  active={preserveCase}
                  className="size-5"
                  title="Preserve Case"
                  onClick={() => editor.setOption(FindReplacePlugin, 'preserveCase', !preserveCase)}
                >
                  <CaseUpper />
                </FindButton>
              </div>
            </div>

            <FindButton disabled={!count} title="Replace (Enter)" onClick={() => replaceCurrent(editor)}>
              <Replace />
            </FindButton>
            <FindButton
              disabled={!count}
              title="Replace All (Cmd+Enter)"
              onClick={() => replaceAll(editor)}
            >
              <ReplaceAll />
            </FindButton>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// A match, the current one stronger; the find-in-selection scope, faint.
export function FindReplaceLeaf(props: PlateLeafProps) {
  const leaf = props.leaf as FindLeaf;

  return (
    <PlateLeaf
      {...props}
      className={cn(
        leaf.findScope && 'bg-sky-500/10',
        leaf.findMatch && 'rounded-[2px] bg-amber-400/40',
        leaf.findCurrent && 'bg-orange-500/70'
      )}
    >
      {props.children}
    </PlateLeaf>
  );
}

// end-fork-add find-replace
