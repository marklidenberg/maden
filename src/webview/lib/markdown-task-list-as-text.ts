// fork-add task-list-as-text

import type { Processor } from 'unified';

// GFM reads `- [ ]` and `- [x]` as a task list item, which Plate opens as a todo. With the
// check's construct off, `[ ]` stays text — a bullet with `[ ]` inside, saved as typed.
export function remarkTaskListAsText(this: Processor) {
  // `micromarkExtensions` is declared by remark-parse, which is not in scope here.
  const data = this.data() as { micromarkExtensions?: object[] };

  (data.micromarkExtensions ??= []).push({ disable: { null: ['tasklistCheck'] } });
}

// end-fork-add task-list-as-text
