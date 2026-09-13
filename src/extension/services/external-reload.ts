// fork-add external-reload

import type { HostToWebviewMessage } from '../../shared/messages';

// The file's text where it changed from outside; `undefined` for an echo of the host's own write
export const readExternalText = async ({
  held,
  read,
  writes,
  writing,
}: {
  held: () => string | undefined;
  read: () => Promise<string>;
  writes: () => number;
  writing: () => boolean;
}): Promise<string | undefined> => {
  // - A host write in flight — its own event follows

  if (writing()) {
    return undefined;
  }

  // - Read

  const writesBefore = writes();
  const text = await read();

  // - A host write begun during the read — its own event follows

  if (writing() || writes() !== writesBefore) {
    return undefined;
  }

  // - The text held — an echo

  return text === held() ? undefined : text;
};

export const markExternal = (message: HostToWebviewMessage): HostToWebviewMessage =>
  message.type === 'externalDocumentUpdated' ? { ...message, external: true } : message;

// end-fork-add external-reload
