// fork-add markdown-angle-text

// MDX throws on a `<` it cannot read — a tag never closed, `<name>`, or no tag at all, `<-` — and
// Plate's fallback cuts the document there: the space before it and every block after it are
// lost. Such a `<` is text: `&lt;` reads back as `<`, and is saved as typed.

// Plate closes these itself.
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

const CODE_SPAN_REGEX = /(?<!`)(`+)(?!`)[^\n]*?[^`\n]\1(?!`)/g;

// `<name …>` or `</name>` on one line; `<https://…>` and `<a@b.c>` are not tags.
const TAG_SOURCE = String.raw`<(\/?)([A-Za-z][\w.-]*)(?=[\s/>])[^<>\n]*>`;

// A `<` that starts nothing — not a name, a closing tag, a comment, a fragment or a space.
const STRAY_ANGLE_REGEX = /(?<!\\)(?<!\]\()<(?=[^\s\p{L}/!?>])/gu;

type OpenTag = { index: number; name: string; token: string };

export const escapeTextAngles = (markdown: string): string => {
  const tagRegex = new RegExp(TAG_SOURCE, 'g');
  const unclosed: OpenTag[] = [];
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(markdown)) !== null) {
    const token = match[0];
    const index = match.index;
    const name = (match[2] ?? '').toLowerCase();

    // `\<name>` is text already; `](<path>)` is a link destination.
    if (markdown[index - 1] === '\\' || markdown.slice(Math.max(0, index - 2), index) === '](') {
      continue;
    }

    if (match[1]) {
      for (let openIndex = unclosed.length - 1; openIndex >= 0; openIndex -= 1) {
        if (unclosed[openIndex]?.name === name) {
          unclosed.splice(openIndex, 1);
          break;
        }
      }
      continue;
    }

    if (!token.endsWith('/>') && !VOID_ELEMENTS.has(name)) {
      unclosed.push({ index, name, token });
    }
  }

  return unclosed
    .reduceRight(
      (result, { index, token }) =>
        `${result.slice(0, index)}&lt;${token.slice(1, -1)}&gt;${result.slice(index + token.length)}`,
      markdown
    )
    .replace(STRAY_ANGLE_REGEX, '&lt;');
};

// Code spans hold no tags.
export const applyOutsideCodeSpans = (
  markdown: string,
  transform: (markdown: string) => string
): string => {
  const codeSpans: string[] = [];
  const masked = markdown.replace(CODE_SPAN_REGEX, (span) => {
    codeSpans.push(span);
    return `\u0000MADEN_CODE_SPAN_${codeSpans.length - 1}\u0000`;
  });

  return transform(masked).replace(
    /\u0000MADEN_CODE_SPAN_(\d+)\u0000/g,
    (token, index: string) => codeSpans[Number(index)] ?? token
  );
};

// end-fork-add markdown-angle-text
