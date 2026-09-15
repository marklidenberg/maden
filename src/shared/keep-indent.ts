// fork-add keep-indent

type Operation =
  | { type: 'equal'; previousIndex: number; nextIndex: number }
  | { type: 'insert'; nextIndex: number }
  | { type: 'delete'; previousIndex: number };

type Line = {
  blank: boolean;
  fenced: boolean;
  indent?: string;  // the file's, once known
  nextIndex: number;
  source?: string;  // the indent of the line it replaces
  width: number;  // maden's
};

const FENCE_PATTERN = /^\s*(`{3,}|~{3,})/u;

const indentOf = (line: string): string => /^[ \t]*/u.exec(line)?.[0] ?? '';

const widthOf = (indent: string): number => indent.replace(/\t/g, '    ').length;

// A re-serialized line keeps the file's indent, not maden's 2 spaces a level
export const keepFileIndent = (
  operations: readonly Operation[],
  previousLines: readonly string[],
  nextLines: string[]
): void => {
  // - The lines as saved, a replaced line paired with the one it replaces

  const lines: Line[] = [];
  let deleted: string[] = [];
  let inserted: Line[] = [];
  let inFence = false;

  const pair = () => {
    if (deleted.length === inserted.length) {
      inserted.forEach((line, index) => {
        line.source = deleted[index];
      });
    }

    deleted = [];
    inserted = [];
  };

  for (const operation of operations) {
    if (operation.type === 'delete') {
      const line = previousLines[operation.previousIndex] ?? '';

      if (line.trim()) deleted.push(indentOf(line));
      continue;
    }

    const text = nextLines[operation.nextIndex] ?? '';
    const isFence = FENCE_PATTERN.test(text);
    const line: Line = {
      blank: !text.trim(),
      fenced: inFence && !isFence,
      indent:
        operation.type === 'equal'
          ? indentOf(previousLines[operation.previousIndex] ?? '')
          : undefined,
      nextIndex: operation.nextIndex,
      width: indentOf(text).length,
    };

    if (isFence) inFence = !inFence;
    lines.push(line);

    if (operation.type === 'equal') {
      pair();
    } else if (!line.blank) {
      inserted.push(line);
    }
  }

  pair();

  // - Each new line, in order: its siblings' indent, else the one it had, else a step under its parent

  lines.forEach((line, index) => {
    if (line.indent !== undefined || line.blank) return;

    if (line.width === 0) {
      line.indent = '';
      return;
    }

    const scan = (step: 1 | -1): { parent?: Line; sibling?: Line } => {
      for (let i = index + step; i >= 0 && i < lines.length; i += step) {
        const other = lines[i];

        if (other.blank) continue;
        if (other.width < line.width) return { parent: other };
        if (other.width === line.width && other.indent !== undefined) return { sibling: other };
      }

      return {};
    };

    const before = scan(-1);
    const sibling = before.sibling ?? scan(1).sibling;
    const parentIndent = before.parent?.indent ?? '';
    const parentWidth = before.parent?.width ?? 0;

    line.indent =
      sibling?.indent ??
      (!line.fenced && line.source !== undefined && widthOf(line.source) > widthOf(parentIndent)
        ? line.source
        : undefined) ??
      parentIndent + ' '.repeat(line.width - parentWidth);

    const text = nextLines[line.nextIndex] ?? '';
    nextLines[line.nextIndex] = line.indent + text.slice(line.width);
  });
};

// end-fork-add keep-indent
