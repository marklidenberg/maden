// The markdown serializer escapes anything that could ever start a construct, so text
// typed as `[~]` is written back as `\[~\]` and `step_a` as `step\_a`. Keep only the
// escapes a construct we are inside actually needs — a table cell's `|`, a link label's
// brackets, a destination's parens, a title's quote, an ATX heading's trailing `#`, a code
// fence's info string — plus whitespace and character references. The rest is written as
// typed.

type UnsafePattern = {
  character: string;
  inConstruct?: string | string[] | null;
};

type SafeInfo = {
  after: string;
  before: string;
};

type SerializerState = {
  safe: (value: string, info: SafeInfo) => string;
  unsafe: UnsafePattern[];
};

const WHITESPACE_CHARACTERS = new Set(['\t', '\n', '\r', ' ']);

// The catch-all scope every text node is in — a pattern that lists it applies everywhere,
// whatever else it lists beside it.
const PHRASING_CONSTRUCT = 'phrasing';

const isConstructScoped = (pattern: UnsafePattern): boolean => {
  const constructs = pattern.inConstruct;

  if (!constructs) {
    return false;
  }

  const names = Array.isArray(constructs) ? constructs : [constructs];

  return names.length > 0 && !names.includes(PHRASING_CONSTRUCT);
};

const isEscapeRequired = (pattern: UnsafePattern): boolean =>
  WHITESPACE_CHARACTERS.has(pattern.character) ||
  // An unescaped `&` before `#` or a letter reads back as a character reference.
  pattern.character === '&' ||
  isConstructScoped(pattern);

export const serializeTextAsTyped = (
  node: { value: string },
  _parent: unknown,
  state: SerializerState,
  info: SafeInfo
): string => {
  const unsafe = state.unsafe;
  state.unsafe = unsafe.filter(isEscapeRequired);

  try {
    return state.safe(node.value, info);
  } finally {
    state.unsafe = unsafe;
  }
};

// A list item's nested list is written a blank line below its own text, turning every tight
// list loose on save. The serializer only keeps a list item tight when the item carries
// `spread: false`, and the ones built for indent lists carry no `spread` at all.
const joinListItemWithNestedList = (
  _left: unknown,
  right: { type?: string },
  parent: { spread?: boolean | null; type?: string }
): number | undefined =>
  parent?.type === 'listItem' && parent.spread !== true && right?.type === 'list'
    ? 0
    : undefined;

export const markdownStringifyOptions = {
  // `-` for bullets and `*` for emphasis are what the source files use; the serializer's
  // `*` bullets and `_` emphasis rewrite every list and every emphasis on save. `_` also
  // cannot mark emphasis inside a word, so with escaping off it has to go.
  bullet: '-' as const,
  emphasis: '*' as const,
  handlers: {
    text: serializeTextAsTyped,
  },
  join: [joinListItemWithNestedList],
};
