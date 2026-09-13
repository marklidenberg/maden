// fork-add todo-states

import { createPlateEditor } from 'platejs/react';
import { describe, expect, it } from 'vitest';

import { reconcileMarkdownPreservingUnchangedFormatting } from '../../src/shared/markdown-format-reconcile';
import { ListKit } from '../../src/webview/components/editor/plugins/list-kit';
import {
  canonicalizeMarkdown,
  createMarkdownConversionEditor,
  deserializeMarkdownToPlateValue,
  roundTripMarkdownWithPlate,
  serializePlateValueWithConversionEditor,
} from '../../src/webview/lib/markdown-plate-conversion';
import {
  getTodoState,
  setTodoState,
  TODO_STATES,
} from '../../src/webview/lib/todo-states';

const serialize = (markdown: string): string =>
  canonicalizeMarkdown(roundTripMarkdownWithPlate(markdown).serializedMarkdown);

const TODOS = [
  '- [ ] todo',
  '- [/] in progress',
  '- [x] done',
  '- [-] cancelled',
  '- [>] deferred',
  '- [?] question',
].join('\n');

describe('todo states', () => {
  it('opens each box as a todo in its state', () => {
    const value = deserializeMarkdownToPlateValue(TODOS).value;

    expect(value.map((node) => node.listStyleType)).toEqual(
      TODO_STATES.map(() => 'todo')
    );
    expect(value.map(getTodoState)).toEqual(TODO_STATES.map(({ name }) => name));
    expect(value[1].children).toEqual([{ text: 'in progress' }]);
  });

  it('writes each box back as typed', () => {
    expect(serialize(TODOS)).toBe(TODOS);
  });

  it('writes a picked state, the rest as it was', () => {
    const source = ['- [ ] a', '  - [/] b', '- [x] **c**', '- [?]'].join('\n');
    const editor = createMarkdownConversionEditor();

    editor.tf.setValue(deserializeMarkdownToPlateValue(source).value);
    setTodoState(editor, editor.children[0], 'deferred');
    setTodoState(editor, editor.children[1], 'done');
    setTodoState(editor, editor.children[2], 'cancelled');

    const saved = reconcileMarkdownPreservingUnchangedFormatting(
      source,
      serializePlateValueWithConversionEditor(editor.children)
    );

    expect(canonicalizeMarkdown(saved)).toBe(
      ['- [>] a', '  - [x] b', '- [-] **c**', '- [?]'].join('\n')
    );
  });

  it('keeps other brackets as text', () => {
    const source = ['- [~] a', '- [/]b', '', '1. [/] c', '', '- \\[/] d'].join('\n');
    const value = deserializeMarkdownToPlateValue(source).value;

    expect(value.map((node) => node.listStyleType)).toEqual([
      'disc',
      'disc',
      'decimal',
      'disc',
    ]);
  });

  it('opens a plain todo on Enter', () => {
    const point = { offset: 1, path: [0, 0] };
    const editor = createPlateEditor({
      plugins: ListKit,
      selection: { anchor: point, focus: point },
      value: [
        {
          checked: false,
          children: [{ text: 'a' }],
          indent: 1,
          listStyleType: 'todo',
          todoState: 'question',
          type: 'p',
        },
      ],
    });

    editor.tf.insertBreak();

    expect(editor.children[1]).toMatchObject({ listStyleType: 'todo' });
    expect(getTodoState(editor.children[1])).toBe('todo');
  });
});

// end-fork-add todo-states
