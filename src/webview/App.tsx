import * as React from 'react';

import { type Value } from 'platejs';
import { Plate, usePlateEditor } from 'platejs/react';
import { ReactEditor } from 'slate-react';

import { AiSettingsDialog } from '@/components/app/ai-settings-dialog';
import { EditorKit } from '@/components/editor/editor-kit';
import { AppearanceMenu, type ExportActions, type FontMode } from '@/components/app/appearance-menu';
import {
  MadenSettingsDialog,
  type MadenThemeMode,
} from '@/components/app/maden-settings-dialog';
import { Editor, EditorContainer } from '@/components/ui/editor';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAiSettings } from '@/hooks/use-ai-settings';
import { useWebviewDocumentState } from '@/hooks/use-webview-document-state';
import { useEditorDropHandlers } from '@/hooks/use-editor-drop-handlers';
import { useEditorPasteHandlers } from '@/hooks/use-editor-paste-handlers';
import {
  createDocxExport,
  createHtmlExport,
  createPdfExport,
  saveExportFile,
} from '@/lib/export';
import {
  EMPTY_VALUE,
  canonicalizeMarkdown,
  deserializeMarkdownToPlateValue,
  normalizeClipboardMarkdown,
  normalizeLineEndings,
  serializePlateValueToMarkdown,
} from '@/lib/markdown-plate-conversion';
import { postToHost } from '@/vscode';
// fork-add external-reload

import { keepSelection } from '@/lib/keep-selection';

// end-fork-add external-reload
// fork-add fold-state

import { keepBlocks } from '@/lib/keep-blocks';

// end-fork-add fold-state

// fork-add panes

import { type PaneProps, Panes } from '@/components/ui/panes';
import { closeFind } from '@/lib/find-replace';
import { PanePlugin, registerPane } from '@/lib/panes';

// The host's text as the editor holds it — one across the panes, held by the first
const hostSync = {
  isApplyingRemoteChangeRef: { current: false },
  lastSyncedMarkdownRef: { current: '' },
  revisionRef: { current: undefined as number | undefined },
};

const noExport = () => {};

// end-fork-add panes

const TOPBAR_STORAGE_KEY = 'maden.ui.topbarVisible';
const FONT_MODE_STORAGE_KEY = 'maden.ui.fontMode';
const WIDE_MODE_STORAGE_KEY = 'maden.ui.wideMode';
const THEME_STORAGE_KEY = 'maden.ui.theme';

const readStoredThemeMode = (): MadenThemeMode => {
  if (typeof window === 'undefined') {
    return 'inherit';
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === 'light' ||
    storedTheme === 'dark' ||
    storedTheme === 'inherit' ||
    storedTheme === 'confluence'
    ? storedTheme
    : 'inherit';
};

function MarkdownEditor({
  documentState,
  onExportActionsChange,
  // fork-add panes

  pane,

  // end-fork-add panes
  wideMode,
}: {
  documentState: {
    aiEnabled: boolean;
    // fork-add external-reload

    external?: boolean;
    revision?: number;

    // end-fork-add external-reload
    fileName: string;
    filePath: string;
    markdown: string;
    readOnly: boolean;
  };
  onExportActionsChange: (actions: ExportActions | null) => void;
  // fork-add panes

  pane: PaneProps;

  // end-fork-add panes
  wideMode: boolean;
}) {
  const editor = usePlateEditor(
    {
      plugins: EditorKit,
      readOnly: documentState.readOnly,
      value: EMPTY_VALUE,
    },
    [documentState.readOnly]
  );

  useEditorDropHandlers(editor);
  useEditorPasteHandlers(editor);

  // fork-add panes

  const paneRef = React.useRef(pane);

  paneRef.current = pane;

  // - Among the panes — the document from one, the view from the pane split, zoomed in on its jump

  React.useEffect(
    () => registerPane(pane.id, editor, pane.from, pane.jump),
    [editor, pane.id, pane.from, pane.jump]
  );

  // - Focused — the singletons act on it, the caret in it; not — its find closed

  React.useEffect(() => {
    editor.setOption(PanePlugin, 'focused', pane.focused);

    if (!pane.focused) closeFind(editor);
    else if (!editor.api.isFocused()) editor.tf.focus();
  }, [editor, pane.focused]);

  // - Pinned — the spotlight opens another bullet in a new pane

  React.useEffect(() => {
    editor.setOption(PanePlugin, 'pinned', pane.pinned);
  }, [editor, pane.pinned]);

  // end-fork-add panes
  // fork-mutate panes

  // - Old

  // const isApplyingRemoteChangeRef = React.useRef(false);
  // const lastSyncedMarkdownRef = React.useRef('');

  // - New

  const { isApplyingRemoteChangeRef, lastSyncedMarkdownRef, revisionRef } = hostSync;

  // end-fork-mutate panes
  // fork-add external-reload

  // The host's revision of the text the editor holds — a write built on an older one is dropped
  // fork-delete panes

  // const revisionRef = React.useRef<number | undefined>(undefined);

  // end-fork-delete panes

  // end-fork-add external-reload

  React.useEffect(() => {
    // fork-add panes

    // - The first pane's — the others take its every change

    if (!paneRef.current.primary) return;

    // end-fork-add panes
    // fork-add external-reload

    // - A text from outside the editor has not taken yet

    const behind = documentState.revision !== revisionRef.current;
    revisionRef.current = documentState.revision;

    // end-fork-add external-reload
    const incomingMarkdown = normalizeLineEndings(documentState.markdown);
    const canonicalIncomingMarkdown = canonicalizeMarkdown(incomingMarkdown);
    const canonicalLastSyncedMarkdown = canonicalizeMarkdown(lastSyncedMarkdownRef.current);

    if (canonicalIncomingMarkdown === canonicalLastSyncedMarkdown) {
      return;
    }

    try {
      const currentMarkdown = serializePlateValueToMarkdown(
        editor as never,
        editor.children as Value
      );

      if (canonicalizeMarkdown(currentMarkdown) === canonicalIncomingMarkdown) {
        lastSyncedMarkdownRef.current = incomingMarkdown;
        return;
      }
    } catch {
      // Best effort comparison only.
    }

    let isEditorFocused = false;
    try {
      const editorElement = editor.api.toDOMNode(editor) as HTMLElement;
      isEditorFocused = !!editorElement && editorElement.contains(document.activeElement);
    } catch {
      const fallbackEditor = document.querySelector('[data-slate-editor]') as HTMLElement | null;
      isEditorFocused = !!fallbackEditor && fallbackEditor.contains(document.activeElement);
    }

    // fork-mutate external-reload

    // - Old

    // // Ignore stale/echoed remote updates while the user is actively typing.
    // if (isEditorFocused && lastSyncedMarkdownRef.current.length > 0) {
    //   return;
    // }

    // - New

    // An echo of this editor's own typing waits; a change from outside does not
    if (
      !documentState.external &&
      !behind &&
      isEditorFocused &&
      lastSyncedMarkdownRef.current.length > 0
    ) {
      return;
    }

    // end-fork-mutate external-reload

    const nextValue = deserializeMarkdownToPlateValue(incomingMarkdown, {
      context: {
        fileName: documentState.fileName,
        filePath: documentState.filePath,
      },
      onHostError: (error) =>
        postToHost({
          type: 'webviewError',
          ...error,
        }),
    }).value;

    // fork-add external-reload

    const selection = editor.selection;

    // end-fork-add external-reload
    // fork-add fold-state

    const kept = keepBlocks(editor.children, nextValue, selection);

    // end-fork-add fold-state

    isApplyingRemoteChangeRef.current = true;
    editor.tf.withoutSaving(() => {
      editor.tf.setValue(nextValue);
      // fork-add external-reload

      keepSelection(editor, kept);

      // end-fork-add external-reload
    });

    try {
      lastSyncedMarkdownRef.current = serializePlateValueToMarkdown(editor, nextValue);
    } catch {
      lastSyncedMarkdownRef.current = '';
    }

    queueMicrotask(() => {
      isApplyingRemoteChangeRef.current = false;
    });
    // fork-mutate external-reload

    // - Old

    // }, [documentState.fileName, documentState.filePath, documentState.markdown, editor]);

    // - New

    // - A text from outside equal to the one held — the revision alone moves
  }, [
    documentState.fileName,
    documentState.filePath,
    documentState.markdown,
    documentState.revision,
    editor,
  ]);
  // end-fork-mutate external-reload

  const onValueChange = React.useCallback(
    ({ editor, value }: { editor: { children: Value }; value: Value }) => {
      // fork-add panes

      if (!paneRef.current.primary) return;

      // end-fork-add panes
      if (isApplyingRemoteChangeRef.current) {
        return;
      }

      let markdown = '';

      try {
        markdown = serializePlateValueToMarkdown(editor as never, value);
      } catch {
        markdown = '';
      }

      if (markdown === lastSyncedMarkdownRef.current) {
        return;
      }

      lastSyncedMarkdownRef.current = markdown;
      // fork-mutate external-reload

      // - Old

      // postToHost({
      //   type: 'documentChanged',
      //   markdown,
      // });

      // - New

      postToHost({
        type: 'documentChanged',
        markdown,
        revision: revisionRef.current,
      });

      // end-fork-mutate external-reload
    },
    []
  );

  const onCopy = React.useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      const clipboard = event.clipboardData;
      if (!clipboard) return;
      if (editor.api.isCollapsed()) return;

      event.preventDefault();

      ReactEditor.setFragmentData(editor as any, clipboard, 'copy');

      const fragment = editor.api.fragment();
      if (!fragment || fragment.length === 0) {
        return;
      }

      const markdown = normalizeClipboardMarkdown(
        serializePlateValueToMarkdown(editor as never, fragment as Value)
      );

      if (!markdown) {
        return;
      }

      clipboard.setData('text/plain', markdown);
      clipboard.setData('text/markdown', markdown);
    },
    [editor]
  );

  const exportHtml = React.useCallback(async () => {
    await saveExportFile(await createHtmlExport(editor.children, documentState.fileName));
  }, [documentState.fileName, editor.children]);

  const exportPdf = React.useCallback(async () => {
    await saveExportFile(await createPdfExport(editor.children, documentState.fileName));
  }, [documentState.fileName, editor.children]);

  const exportDocx = React.useCallback(async () => {
    await saveExportFile(await createDocxExport(editor.children, documentState.fileName));
  }, [documentState.fileName, editor.children]);

  React.useEffect(() => {
    onExportActionsChange({ exportDocx, exportHtml, exportPdf });
    return () => onExportActionsChange(null);
  }, [exportDocx, exportHtml, exportPdf, onExportActionsChange]);

  return (
    <ErrorBoundary label="Editor">
      <Plate editor={editor} onValueChange={onValueChange} readOnly={documentState.readOnly}>
        <div className="h-full w-full bg-background text-foreground">
          <EditorContainer variant="default">
            <Editor
              autoFocus
              className="page-content"
              onCopy={onCopy}
              variant={wideMode ? 'fullWidth' : 'default'}
            />
          </EditorContainer>
        </div>
      </Plate>
    </ErrorBoundary>
  );
}

export function App() {
  const { documentState } = useWebviewDocumentState();
  const { save: saveAiSettings, settings: aiSettings } = useAiSettings();

  const [aiSettingsOpen, setAiSettingsOpen] = React.useState(false);
  const [madenSettingsOpen, setMadenSettingsOpen] = React.useState(false);
  // fork-mutate topbar-toggle

  // - Old

  // const [topbarVisible, setTopbarVisible] = React.useState(true);

  // - New

  const [topbarVisible, setTopbarVisible] = React.useState(false);

  // end-fork-mutate topbar-toggle
  const [fontMode, setFontMode] = React.useState<FontMode>('default');
  const [themeMode, setThemeMode] =
    React.useState<MadenThemeMode>(readStoredThemeMode);
  const [wideModeEnabled, setWideModeEnabled] = React.useState(false);
  const [exportActions, setExportActions] = React.useState<ExportActions | null>(null);

  React.useEffect(() => {
    const onError = (event: ErrorEvent) => {
      postToHost({
        type: 'webviewError',
        message: event.message || 'Unknown webview error',
        source: event.filename,
        stack: event.error instanceof Error ? event.error.stack : undefined,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
      const stack = event.reason instanceof Error ? event.reason.stack : undefined;

      postToHost({
        type: 'webviewError',
        message: `Unhandled promise rejection: ${reason}`,
        stack,
      });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  React.useEffect(() => {
    document.body.dataset.madenTheme = themeMode;
    document.body.classList.toggle('dark', themeMode === 'dark');
  }, [themeMode]);

  React.useEffect(() => {
    document.body.dataset.madenWideMode = wideModeEnabled ? 'enabled' : 'disabled';
  }, [wideModeEnabled]);

  React.useEffect(() => {
    const storedTopbar = window.localStorage.getItem(TOPBAR_STORAGE_KEY);
    const storedFont = window.localStorage.getItem(FONT_MODE_STORAGE_KEY);
    const storedWideMode = window.localStorage.getItem(WIDE_MODE_STORAGE_KEY);

    // fork-mutate topbar-toggle

    // - Old

    // if (storedTopbar === 'hidden') {
    //   setTopbarVisible(false);
    // }

    // - New

    if (storedTopbar === 'visible') {
      setTopbarVisible(true);
    }

    // end-fork-mutate topbar-toggle

    if (storedFont === 'serif' || storedFont === 'mono' || storedFont === 'default') {
      setFontMode(storedFont);
    }

    if (storedWideMode === 'enabled') {
      setWideModeEnabled(true);
    }
  }, []);

  if (!documentState) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading markdown editor...
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div
        className="relative h-full w-full"
        data-file-name={documentState.fileName}
        data-maden-topbar={topbarVisible ? 'visible' : 'hidden'}
        data-maden-font={fontMode}
        data-maden-wide-mode={wideModeEnabled ? 'enabled' : 'disabled'}
      >
        <ErrorBoundary label="Appearance menu">
          <AppearanceMenu
            exportActions={exportActions}
            topbarVisible={topbarVisible}
            wideModeEnabled={wideModeEnabled}
            onOpenAiSettings={() => {
              setAiSettingsOpen(true);
            }}
            onOpenMadenSettings={() => {
              setMadenSettingsOpen(true);
            }}
            onTopbarToggle={(next) => {
              setTopbarVisible(next);
              window.localStorage.setItem(TOPBAR_STORAGE_KEY, next ? 'visible' : 'hidden');
            }}
            onWideModeToggle={(next) => {
              setWideModeEnabled(next);
              window.localStorage.setItem(WIDE_MODE_STORAGE_KEY, next ? 'enabled' : 'disabled');
            }}
            fontMode={fontMode}
            onFontModeChange={(next) => {
              setFontMode(next);
              window.localStorage.setItem(FONT_MODE_STORAGE_KEY, next);
            }}
          />
        </ErrorBoundary>

        {/* fork-mutate panes */}

        {/* - Old */}

        {/* <ErrorBoundary label="Markdown editor">
          <MarkdownEditor
            documentState={documentState}
            onExportActionsChange={setExportActions}
            wideMode={wideModeEnabled}
          />
        </ErrorBoundary> */}

        {/* - New */}

        <Panes>
          {(pane) => (
            <ErrorBoundary label="Markdown editor">
              <MarkdownEditor
                documentState={documentState}
                onExportActionsChange={pane.primary ? setExportActions : noExport}
                pane={pane}
                wideMode={wideModeEnabled}
              />
            </ErrorBoundary>
          )}
        </Panes>

        {/* end-fork-mutate panes */}

        <AiSettingsDialog
          open={aiSettingsOpen}
          settings={aiSettings}
          onOpenChange={setAiSettingsOpen}
          onSave={saveAiSettings}
        />

        <MadenSettingsDialog
          open={madenSettingsOpen}
          themeMode={themeMode}
          onOpenChange={setMadenSettingsOpen}
          onSave={(next) => {
            setThemeMode(next);
            window.localStorage.setItem(THEME_STORAGE_KEY, next);
          }}
        />
      </div>
    </TooltipProvider>
  );
}
