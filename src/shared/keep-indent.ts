// fork-add keep-indent

type Operation =
  | { type: 'equal'; previousIndex: number; nextIndex: number }
  | { type: 'insert'; nextIndex: number }
  | { type: 'delete'; previousIndex: number };

type Line = {
  blank: boolean;
  depth: number;  // maden's, in its list
  fenced: boolean;
  indent?: string;  // the file's, once known
  item: boolean;
  nextIndex: number;
  source?: string;  // the indent of the line it replaces, at the same depth
  width: number;  // maden's
};

const FENCE_PATTERN = /^\s*(`{3,}|~{3,})/u;

const LIST_ITEM_PATTERN = /^[ \t]*([-*+]|\d{1,9}[.)])([ \t]+|$)/u;

const indentOf = (line: string): string => /^[ \t]*/u.exec(line)?.[0] ?? '';

const widthOf = (indent: string): number => indent.replace(/\t/g, '    ').length;

// Where a line can continue a list item's paragraph — not a block of its own
const CONTINUATION_PATTERN = /^[ \t]*[^ \t#>|<=-]/u;

// The depth of each list item, and of each line continuing its paragraph; -1 for the rest. Maden
// lifts an item's other blocks out of its list, the items after them too: a block starts the depths
// again
const listDepths = (lines: readonly string[]): number[] => {
  const contents: number[] = [];  // the content columns of the items open
  let continued = -1;  // the depth of the paragraph open
  let inFence = false;

  return lines.map((line) => {
    const isFence = FENCE_PATTERN.test(line);

    if (isFence) inFence = !inFence;

    if (!line.trim() && !inFence) {
      continued = -1;
      return -1;
    }

    const item = !isFence && !inFence ? LIST_ITEM_PATTERN.exec(line) : null;

    if (!item) {
      if (continued < 0 || isFence || inFence || !CONTINUATION_PATTERN.test(line)) {
        contents.length = 0;
        continued = -1;
      }

      return continued;
    }

    const width = widthOf(indentOf(line));

    while (contents.length > 0 && width < contents[contents.length - 1]) contents.pop();

    const spacing = widthOf(item[2]);

    continued = contents.length;
    contents.push(width + item[1].length + (spacing >= 1 && spacing <= 4 ? spacing : 1));

    return continued;
  });
};

// A line moved to another depth is not the line it was: its depth joins its semantic line
export const markListDepths = (lines: readonly string[], semanticLines: string[]): void => {
  listDepths(lines).forEach((depth, index) => {
    const semantic = semanticLines[index];

    if (depth < 0 || !semantic || semantic.startsWith('code:')) return;

    semanticLines[index] = `${depth}:${semantic}`;
  });
};

// A re-serialized line keeps the file's indent, not maden's 2 spaces a level
export const keepFileIndent = (
  operations: readonly Operation[],
  previousLines: readonly string[],
  nextLines: string[]
): void => {
  // - The lines as saved, a replaced line paired with the one it replaces

  const previousDepths = listDepths(previousLines);
  const nextDepths = listDepths(nextLines);
  const lines: Line[] = [];
  let deleted: Array<{ depth: number; indent: string }> = [];
  let inserted: Line[] = [];
  let inFence = false;

  const pair = () => {
    if (deleted.length === inserted.length) {
      inserted.forEach((line, index) => {
        if (deleted[index].depth === line.depth) line.source = deleted[index].indent;
      });
    }

    deleted = [];
    inserted = [];
  };

  for (const operation of operations) {
    if (operation.type === 'delete') {
      const line = previousLines[operation.previousIndex] ?? '';

      if (line.trim()) {
        deleted.push({ depth: previousDepths[operation.previousIndex], indent: indentOf(line) });
      }

      continue;
    }

    const text = nextLines[operation.nextIndex] ?? '';
    const isFence = FENCE_PATTERN.test(text);
    const line: Line = {
      blank: !text.trim(),
      depth: nextDepths[operation.nextIndex],
      fenced: inFence && !isFence,
      indent:
        operation.type === 'equal'
          ? indentOf(previousLines[operation.previousIndex] ?? '')
          : undefined,
      item: LIST_ITEM_PATTERN.test(text),
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

  // - Each line's parent: the nearest line before it, shallower

  const parents: Array<Line | undefined> = [];
  const open: Line[] = [];

  lines.forEach((line, index) => {
    if (line.blank || line.fenced) return;

    while (open.length > 0 && open[open.length - 1].width >= line.width) open.pop();

    parents[index] = open[open.length - 1];
    open.push(line);
  });

  // - The list's own step: the nearest item and its parent item, both as the file has them

  const stepNear = (index: number): number | undefined => {
    const stepAt = (i: number): number | undefined => {
      const line = lines[i];
      const parent = parents[i];

      if (!line.item || !parent?.item) return undefined;
      if (line.indent === undefined || parent.indent === undefined) return undefined;

      const step = widthOf(line.indent) - widthOf(parent.indent);

      return step > 0 ? step : undefined;
    };

    for (let i = index - 1; i >= 0; i -= 1) {
      const step = stepAt(i);

      if (step !== undefined) return step;
    }

    for (let i = index + 1; i < lines.length; i += 1) {
      const step = stepAt(i);

      if (step !== undefined) return step;
    }

    return undefined;
  };

  // - Each new line, in order: its siblings' indent, else the one it had, else the list's step under its parent

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
    const madenStep = line.width - (before.parent?.width ?? 0);
    const listStep = line.item && before.parent?.item ? stepNear(index) : undefined;

    line.indent =
      sibling?.indent ??
      (!line.fenced && line.source !== undefined && widthOf(line.source) > widthOf(parentIndent)
        ? line.source
        : undefined) ??
      parentIndent + ' '.repeat(Math.max(madenStep, listStep ?? 0));

    const text = nextLines[line.nextIndex] ?? '';
    nextLines[line.nextIndex] = line.indent + text.slice(line.width);
  });
};

// A line given back as the file had it keeps its new indent, where it stands at another depth now
export const keepMovedIndent = (
  previousLines: readonly string[],
  mergedLines: readonly string[],
  formattedLines: readonly string[]
): string[] => {
  const previousDepths = listDepths(previousLines);
  const mergedDepths = listDepths(mergedLines);

  return formattedLines.map((line, index) => {
    const merged = mergedLines[index] ?? '';

    if (line === merged || previousDepths[previousLines.indexOf(line)] === mergedDepths[index]) {
      return line;
    }

    return indentOf(merged) + line.slice(indentOf(line).length);
  });
};

// end-fork-add keep-indent
