# topbar-trimmed

The top bar keeps seven buttons — undo, redo, Turn into, table, insert image, insert file, the
three dots. Upstream ships ~30; the rest are reachable from the slash menu, the block menu and the
keyboard, and the bar is quieter without them.

`src/webview/components/ui/fixed-toolbar-buttons-trimmed.tsx` is ours, wrapped whole. It exports
upstream's `FixedToolbarButtons` name and keeps its wrapper, so the swap is one import.

`src/webview/components/editor/plugins/fixed-toolbar-kit.tsx` holds that import.
Upstream's `src/webview/components/ui/fixed-toolbar-buttons.tsx` is untouched — the fork reads it
when upstream adds a button worth keeping.

Gone with the rest: source view and the editing-mode picker. VS Code's own "Reopen Editor With…"
opens the markdown; nothing sets read-only any more.
