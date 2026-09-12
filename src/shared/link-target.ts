// fork-add link-open

export type LinkTarget =
  | { kind: 'external'; url: string }
  | { kind: 'file'; path: string }
  | { kind: 'none' };

const EXTERNAL_SCHEMES = new Set(['http', 'https', 'mailto', 'tel']);

const SCHEME_PATTERN = /^([a-zA-Z][a-zA-Z\d+.-]*):/;

const WINDOWS_DRIVE_PATTERN = /^[a-zA-Z]:[\\/]/;

const decode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const toPath = (value: string) => decode(value.split('#')[0]).replace(/\\/g, '/');

const fileUriToPath = (value: string) => {
  const path = toPath(value.replace(/^file:\/\/[^/]*/, ''));
  return WINDOWS_DRIVE_PATTERN.test(path.slice(1)) ? path.slice(1) : path;
};

const resolveFrom = (documentPath: string, relative: string) => {
  const parts = documentPath.replace(/\\/g, '/').split('/').slice(0, -1);

  for (const part of relative.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') {
      parts.pop();
      continue;
    }
    parts.push(part);
  }

  return parts.join('/');
};

export const resolveLinkTarget = (url: string, documentPath: string): LinkTarget => {
  // - Take the url as written

  const value = url.trim();

  if (!value || value.startsWith('#')) {
    return { kind: 'none' };
  }

  // - A scheme decides, a windows drive letter is not one

  if (!WINDOWS_DRIVE_PATTERN.test(value)) {
    const scheme = SCHEME_PATTERN.exec(value)?.[1].toLowerCase();

    if (scheme && EXTERNAL_SCHEMES.has(scheme)) {
      return { kind: 'external', url: value };
    }

    if (scheme === 'file') {
      return { kind: 'file', path: fileUriToPath(value) };
    }

    if (scheme) {
      return { kind: 'none' };
    }
  }

  // - A path, from the document unless it stands on its own

  const path = toPath(value);
  const isAbsolute = path.startsWith('/') || WINDOWS_DRIVE_PATTERN.test(path);

  return {
    kind: 'file',
    path: isAbsolute ? path : resolveFrom(documentPath, path),
  };
};

// end-fork-add link-open
