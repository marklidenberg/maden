// fork-add todo-states

'use client';

import * as React from 'react';

import type { TElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import {
  CheckIcon,
  ChevronRightIcon,
  CircleQuestionMarkIcon,
  MinusIcon,
  SlashIcon,
} from 'lucide-react';
import { useReadOnly } from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getTodoState,
  setTodoState,
  TODO_STATES,
  type TodoState,
} from '@/lib/todo-states';
import { cn } from '@/lib/utils';

const ICONS: Record<TodoState, React.FC | null> = {
  todo: null,
  'in-progress': SlashIcon,
  done: CheckIcon,
  cancelled: MinusIcon,
  deferred: ChevronRightIcon,
  question: CircleQuestionMarkIcon,
};

const BOX =
  'maden-task-checkbox -left-6 absolute top-1 flex size-4 items-center justify-center rounded-[4px] border border-foreground/40 text-muted-foreground [&_svg]:size-3.5 data-[state=done]:border-primary data-[state=done]:bg-primary data-[state=done]:text-primary-foreground';

function TodoStateIcon({ state }: { state: TodoState }) {
  const Icon = ICONS[state];

  return Icon ? <Icon /> : null;
}

export function TodoStateLi({
  children,
  element,
}: {
  children?: React.ReactNode;
  element: TElement;
}) {
  const state = getTodoState(element);

  return (
    <li
      className={cn(
        'list-none',
        (state === 'done' || state === 'cancelled') &&
          'text-muted-foreground line-through'
      )}
    >
      {children}
    </li>
  );
}

export function TodoStateBox({ element }: { element: TElement }) {
  const state = getTodoState(element);

  return (
    <div contentEditable={false}>
      <span className={cn(BOX, 'pointer-events-none')} data-state={state}>
        <TodoStateIcon state={state} />
      </span>
    </div>
  );
}

// A press on the box picks a state.
export function TodoStateMarker({ editor, element }: PlateElementProps) {
  const readOnly = useReadOnly();
  const state = getTodoState(element);

  return (
    <div contentEditable={false}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild disabled={readOnly}>
          <button
            className={cn(BOX, readOnly && 'pointer-events-none')}
            data-state={state}
            type="button"
          >
            <TodoStateIcon state={state} />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            editor.tf.focus();
          }}
        >
          <DropdownMenuRadioGroup
            value={state}
            onValueChange={(value) =>
              setTodoState(editor, element, value as TodoState)
            }
          >
            {TODO_STATES.map(({ label, name }) => (
              <DropdownMenuRadioItem key={name} value={name}>
                <span className="flex size-4 items-center justify-center">
                  <TodoStateIcon state={name} />
                </span>
                {label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// end-fork-add todo-states
