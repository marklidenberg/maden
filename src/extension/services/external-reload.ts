// fork-add external-reload

import type { HostToWebviewMessage } from '../../shared/messages';

// The file's text where it changed from outside; `undefined` for an echo of the host's own write
export const readExternalText = async ({
  held,
  read,
  seen,
  writes,
  writing,
}: {
  held: () => string | undefined;
  read: () => Promise<string>;
  seen: (text: string) => void;
  writes: () => number;
  writing: () => boolean;
}): Promise<string | undefined> => {
  // - A host write in flight — it tells a change from outside itself

  if (writing()) {
    return undefined;
  }

  // - Read

  const writesBefore = writes();
  const text = await read();

  // - A host write begun during the read — it tells a change from outside itself

  if (writing() || writes() !== writesBefore) {
    return undefined;
  }

  seen(text);

  // - The text held — an echo

  return text === held() ? undefined : text;
};

// One file's host writes, in turn. A write finding the file moved from the text last seen there — a
// change from outside, not taken yet — is not written; that text is returned instead
export const createFileWriter = ({
  read,
  write,
}: {
  read: () => Promise<string | undefined>; // `undefined` — no file
  write: (text: string) => Promise<void>;
}) => {
  let seen: string | undefined;
  let queue: Promise<unknown> = Promise.resolve();

  return {
    seen: (text: string) => {
      seen = text;
    },

    write: (next: string): Promise<string | undefined> => {
      const run = queue.then(async () => {
        const current = await read();

        // - Moved from outside

        if (current !== undefined && seen !== undefined && current !== seen && current !== next) {
          seen = current;
          return current;
        }

        // - Written, where not there already

        if (current !== next) {
          await write(next);
        }

        seen = next;
        return undefined;
      });

      queue = run.catch(() => undefined);
      return run;
    },
  };
};

export type FileWriter = ReturnType<typeof createFileWriter>;

export const markExternal = (message: HostToWebviewMessage): HostToWebviewMessage =>
  message.type === 'externalDocumentUpdated' ? { ...message, external: true } : message;

// The document's text, with the count of changes from outside taken — a webview write carries it back
export const withRevision = (message: HostToWebviewMessage, revision: number): HostToWebviewMessage =>
  message.type === 'initDocument' || message.type === 'externalDocumentUpdated'
    ? { ...message, revision }
    : message;

// end-fork-add external-reload
