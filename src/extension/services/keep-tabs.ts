// fork-add keep-tabs

import * as vscode from 'vscode';

import { createMerges, freeFragment } from './tab-merge';

const uriOf = (tab: vscode.Tab) =>
  tab.input instanceof vscode.TabInputText || tab.input instanceof vscode.TabInputCustom
    ? tab.input.uri
    : undefined;

const isMaden = (tab: vscode.Tab, viewType: string) =>
  tab.input instanceof vscode.TabInputCustom && tab.input.viewType === viewType;

const withoutFragment = (uri: vscode.Uri) => uri.with({ fragment: '' });

// A tab vscode merged into a maden tab of its file — back as maden at `#tab-n`, pinned as it was.
export const registerKeepTabs = (viewType: string): vscode.Disposable => {
  const merges = createMerges<vscode.Tab>();
  const indexes = new WeakMap<vscode.Tab, number>();

  const remember = () => {
    for (const group of vscode.window.tabGroups.all) {
      group.tabs.forEach((tab, index) => indexes.set(tab, index));
    }
  };

  const reopen = async (closed: vscode.Tab, uri: vscode.Uri) => {
    // - A fragment no tab of the group holds on the file

    const file = withoutFragment(uri).toString();
    const taken = closed.group.tabs.flatMap((tab) => {
      const other = uriOf(tab);
      return other && withoutFragment(other).toString() === file ? [other.fragment] : [];
    });

    // - Opened, pinned as it was

    await vscode.commands.executeCommand(
      'vscode.openWith',
      uri.with({ fragment: freeFragment(taken) }),
      viewType,
      { preview: false, viewColumn: closed.group.viewColumn }
    );

    if (closed.isPinned) {
      await vscode.commands.executeCommand('workbench.action.pinEditor');
    }
  };

  remember();

  return vscode.window.tabGroups.onDidChangeTabs((event) => {
    const at = Date.now();

    // - Maden tabs moved

    for (const tab of event.changed) {
      if (isMaden(tab, viewType)) {
        merges.changed(tab, indexes.get(tab), tab.group.tabs.indexOf(tab), at);
      }
    }

    // - Tabs merged into one of them

    for (const tab of event.closed) {
      const uri = uriOf(tab);

      if (!uri || isMaden(tab, viewType)) {
        continue;
      }

      const candidates = tab.group.tabs.filter(
        (other) => isMaden(other, viewType) && uriOf(other)?.toString() === uri.toString()
      );

      if (merges.closed(candidates, at)) {
        void reopen(tab, uri);
      }
    }

    remember();
  });
};

// A maden tab's document — its uri, `#tab-n` or none; the file's document under it
type TabDocument<T> = vscode.CustomDocument & { file: T };

export const keepTabsProvider = <T extends vscode.CustomDocument>(
  provider: vscode.CustomEditorProvider<T> & {
    onDidChangeCustomDocument: vscode.Event<vscode.CustomDocumentContentChangeEvent<T>>;
  }
): vscode.CustomEditorProvider<TabDocument<T>> => {
  const tabs = new WeakMap<T, TabDocument<T>>();
  const changed = new vscode.EventEmitter<vscode.CustomDocumentContentChangeEvent<TabDocument<T>>>();

  provider.onDidChangeCustomDocument((event) => {
    const tab = tabs.get(event.document);

    if (tab) {
      changed.fire({ document: tab });
    }
  });

  return {
    onDidChangeCustomDocument: changed.event,

    openCustomDocument: async (uri, context, token) => {
      const file = await provider.openCustomDocument(withoutFragment(uri), context, token);
      const tab = { uri, file, dispose: () => file.dispose() };
      tabs.set(file, tab);
      return tab;
    },

    resolveCustomEditor: (tab, panel, token) => provider.resolveCustomEditor(tab.file, panel, token),
    saveCustomDocument: (tab, token) => provider.saveCustomDocument(tab.file, token),
    saveCustomDocumentAs: (tab, destination, token) =>
      provider.saveCustomDocumentAs(tab.file, destination, token),
    revertCustomDocument: (tab, token) => provider.revertCustomDocument(tab.file, token),
    backupCustomDocument: (tab, context, token) =>
      provider.backupCustomDocument(tab.file, context, token),
  };
};

// end-fork-add keep-tabs
