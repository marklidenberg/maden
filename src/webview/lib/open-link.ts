// fork-add link-open

import { resolveLinkTarget } from '../../shared/link-target';

import { postToHost } from '@/vscode';

export const openLink = (url: string) => {
  // - The host opens it

  if (typeof window.acquireVsCodeApi === 'function') {
    postToHost({ type: 'openLink', url });
    return;
  }

  // - Standalone browser mode: only a url the browser can take

  const target = resolveLinkTarget(url, window.__MADEN_DOCUMENT_PATH__ ?? '');

  if (target.kind === 'external') {
    window.open(target.url, '_blank', 'noopener,noreferrer');
  }
};

// end-fork-add link-open
