// fork-add todo-states

import type { MdRules } from '@platejs/markdown';
import type { Descendant, SlateEditor, TElement, Value } from 'platejs';
import type { Processor } from 'unified';

import { defaultRules } from '@platejs/markdown';
import { ElementApi, KEYS, TextApi } from 'platejs';
import { createPlatePlugin } from 'platejs/react';

export const TODO_STATES = [
  { label: 'Todo', mark: ' ', name: 'todo' },
  { label: 'In progress', mark: '/', name: 'in-progress' },
  { label: 'Done', mark: 'x', name: 'done' },
  { label: 'Cancelled', mark: '-', name: 'cancelled' },
  { label: 'Deferred', mark: '>', name: 'deferred' },
  { label: 'Question', mark: '?', name: 'question' },
] as const;

export type TodoState = (typeof TODO_STATES)[number]['name'];

// `checked` stays upstream's — `[ ]` or `[x]`. The other four ride beside it.
export const TODO_STATE_KEY = 'todoState';

const isUpstreamState = (state: TodoState): boolean =>
  state === 'todo' || state === 'done';

const stateOfMark = (mark: string): TodoState | undefined =>
  mark === 'X' ? 'done' : TODO_STATES.find((state) => state.mark === mark)?.name;

const markOfState = (state: TodoState): string =>
  TODO_STATES.find(({ name }) => name === state)?.mark ?? ' ';

export const getTodoState = (element: TElement): TodoState =>
  (element[TODO_STATE_KEY] as TodoState | undefined) ??
  (element.checked ? 'done' : 'todo');

export const setTodoState = (
  editor: SlateEditor,
  element: TElement,
  state: TodoState
) => {
  const at = editor.api.findPath(element);

  if (!at) return;

  editor.tf.withoutNormalizing(() => {
    editor.tf.setNodes({ checked: state === 'done' }, { at });

    if (isUpstreamState(state)) {
      editor.tf.unsetNodes(TODO_STATE_KEY, { at });
    } else {
      editor.tf.setNodes({ [TODO_STATE_KEY]: state }, { at });
    }
  });
};

// Enter opens the next todo unchecked upstream; its state goes the same way.
export const TodoStatePlugin = createPlatePlugin({
  key: TODO_STATE_KEY,
}).overrideEditor(({ editor, tf: { insertBreak } }) => ({
  transforms: {
    insertBreak() {
      const entry = editor.api.above();
      const opensTodo =
        !!entry &&
        entry[0][KEYS.listType] === KEYS.listTodo &&
        editor.api.isCollapsed() &&
        editor.api.isEnd(editor.selection?.focus, entry[1]);

      editor.tf.withoutNormalizing(() => {
        insertBreak();

        const next = opensTodo && editor.api.above();

        if (next) editor.tf.unsetNodes(TODO_STATE_KEY, { at: next[1] });
      });
    },
  },
}));

type MdNode = {
  checked?: boolean | null;
  children?: MdNode[];
  data?: Record<string, unknown>;
  ordered?: boolean | null;
  type: string;
  value?: string;
};

// mdast-util-from-markdown's, which is not in scope here.
type CompileContext = {
  exit: (token: unknown) => void;
  sliceSerialize: (token: unknown) => string;
  stack: MdNode[];
};

// Read off the source, so an escaped `\[` is no box.
const BOX = /^\[(.)\](?:[ \t]+|$)/;

// A box opens a bullet's first paragraph; an ordered item keeps it as text.
function exitParagraphWithTodoState(this: CompileContext, token: unknown) {
  const paragraph = this.stack.at(-1);
  const item = this.stack.at(-2);
  const list = this.stack.at(-3);
  const head = paragraph?.children?.[0];
  const box = BOX.exec(this.sliceSerialize(token));
  const state = box ? stateOfMark(box[1]) : undefined;

  if (
    box &&
    state &&
    paragraph &&
    item?.type === 'listItem' &&
    !list?.ordered &&
    item.children?.[0] === paragraph &&
    head?.type === 'text' &&
    head.value?.startsWith(box[0])
  ) {
    head.value = head.value.slice(box[0].length);

    if (!head.value) paragraph.children?.shift();

    item.checked = state === 'done';

    if (!isUpstreamState(state)) {
      paragraph.data = { ...paragraph.data, [TODO_STATE_KEY]: state };
    }
  }

  this.exit(token);
}

export function remarkTodoStates(this: Processor) {
  // Declared by remark-parse, which is not in scope here.
  const data = this.data() as {
    fromMarkdownExtensions?: object[];
    micromarkExtensions?: object[];
  };

  // GFM's check reads `[ ]` and `[x]` alone. Off, and our paragraph exit reads all six — pushed
  // after remark-gfm's, it replaces GFM's, idle with the check off.
  (data.micromarkExtensions ??= []).push({ disable: { null: ['tasklistCheck'] } });
  (data.fromMarkdownExtensions ??= []).push({
    exit: { paragraph: exitParagraphWithTodoState },
  });
}

// Plate carries `checked` alone off a list item; its paragraph brings the state over.
export const todoStateMarkdownRules: MdRules = {
  [KEYS.p]: {
    deserialize: (node, deco, options) => {
      const result = defaultRules.p!.deserialize!(node, deco, options);
      const state = (node as MdNode).data?.[TODO_STATE_KEY];

      if (state) {
        (Array.isArray(result) ? result[0] : result)[TODO_STATE_KEY] = state;
      }

      return result;
    },
  },
};

const writeNodes = (nodes: Descendant[]): Descendant[] =>
  nodes.map((node) => {
    if (!ElementApi.isElement(node)) return node;

    const children = writeNodes(node.children);
    const state =
      node[KEYS.listType] === KEYS.listTodo
        ? (node[TODO_STATE_KEY] as TodoState | undefined)
        : undefined;

    if (!state || isUpstreamState(state)) return { ...node, children };

    const empty = children.every((child) => TextApi.isText(child) && !child.text);
    const box = `[${markOfState(state)}]${empty ? '' : ' '}`;

    return { ...node, checked: undefined, children: [{ text: box }, ...children] };
  });

// Plate writes `checked` alone; the other four go out as the item's text.
export const writeTodoStatesAsText = (value: Value): Value =>
  writeNodes(value) as Value;

// end-fork-add todo-states
