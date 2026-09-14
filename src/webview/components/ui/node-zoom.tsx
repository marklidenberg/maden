// fork-add node-zoom

'use client';

import * as React from 'react';

import { ArrowLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { type SlateEditor, type TElement, KEYS, NodeApi } from 'platejs';
import {
  type PlateElementProps,
  type RenderNodeWrapper,
  useEditorContainerRef,
  useEditorRef,
  useEditorSelector,
  usePluginOption,
} from 'platejs/react';

import { Button } from '@/components/ui/button';
import {
  type NodeZoom,
  getZoom,
  getZoomView,
  indentShift,
  NodeZoomPlugin,
  placeIn,
  zoomBack,
  zoomIn,
  zoomReset,
} from '@/lib/node-zoom';

type Crumb = { id: string; label: string };

const sameCrumbs = (a: Crumb[], b: Crumb[]) =>
  a.length === b.length &&
  a.every((crumb, i) => crumb.id === b[i].id && crumb.label === b[i].label);

const keepSelection = (event: React.MouseEvent) => event.preventDefault();

// Zooms that scroll: in — to the top; out — to the block left.
const useZoomActions = () => {
  const editor = useEditorRef();
  const containerRef = useEditorContainerRef();

  return React.useMemo(() => {
    const leave = (out: (editor: SlateEditor) => void) => {
      const stack = editor.getOption(NodeZoomPlugin, 'stack');
      const root = getZoomView(editor.children, getZoom(stack))?.root;

      out(editor);
      requestAnimationFrame(() => {
        if (root) editor.api.toDOMNode(root)?.scrollIntoView({ block: 'center' });
      });
    };

    return {
      back: () => leave(zoomBack),
      reset: () => leave(zoomReset),
      zoomIn: (id: string) => {
        zoomIn(editor, id);
        editor.tf.focus();
        requestAnimationFrame(() => containerRef.current?.scrollTo({ top: 0 }));
      },
    };
  }, [containerRef, editor]);
};

// The gutter's magnifier, beside the grip.
export function NodeZoomButton({ element, top }: { element: TElement; top: number }) {
  const stack = usePluginOption(NodeZoomPlugin, 'stack');
  const actions = useZoomActions();

  if (getZoom(stack)?.root === element.id) return null;

  return (
    <div className="slate-blockToolbar pointer-events-auto relative flex w-[18px] items-center">
      <Button
        className="-left-0 absolute h-6 w-full p-0 text-muted-foreground hover:bg-transparent dark:hover:bg-transparent"
        data-plate-prevent-deselect
        style={{ top: `${top + 3}px` }}
        title="Zoom in"
        variant="ghost"
        onClick={() => actions.zoomIn(element.id as string)}
        onMouseDown={keepSelection}
      >
        <ZoomIn />
      </Button>
    </div>
  );
}

// Above the zoom's root: back, reset, its breadcrumb — a crumb zooms in on it.
function NodeZoomBar({ zoom }: { zoom: NodeZoom }) {
  const actions = useZoomActions();
  const crumbs = useEditorSelector(
    (editor) =>
      (getZoomView(editor.children, zoom)?.ancestors ?? []).map((node) => ({
        id: node.id as string,
        label: NodeApi.string(node),
      })),
    [zoom],
    { equalityFn: sameCrumbs }
  );

  return (
    <div
      className="maden-node-zoom-bar mb-3 flex min-h-8 flex-wrap items-center gap-0.5 border-b border-border pb-1 text-muted-foreground select-none"
      contentEditable={false}
      data-plate-prevent-deselect
    >
      <Button
        size="icon-sm"
        title="Back"
        variant="ghost"
        onClick={actions.back}
        onMouseDown={keepSelection}
      >
        <ArrowLeft />
      </Button>
      <Button
        size="icon-sm"
        title="Reset zoom"
        variant="ghost"
        onClick={actions.reset}
        onMouseDown={keepSelection}
      >
        <X />
      </Button>
      {crumbs.length > 0 && <span className="mx-1 h-4 w-px bg-border" />}
      {crumbs.map((crumb) => (
        <React.Fragment key={crumb.id}>
          <Button
            className="max-w-56 font-normal text-muted-foreground"
            size="xs"
            title={crumb.label}
            variant="ghost"
            onClick={() => actions.zoomIn(crumb.id)}
            onMouseDown={keepSelection}
          >
            <span className="truncate">{crumb.label || 'Untitled'}</span>
          </Button>
          <ChevronRight className="size-3.5 shrink-0" />
        </React.Fragment>
      ))}
    </div>
  );
}

function NodeZoomBlock({ children, editor, element }: PlateElementProps) {
  const zoom = getZoom(usePluginOption(NodeZoomPlugin, 'stack'));
  const place = useEditorSelector(
    (editor) => placeIn(editor.children, zoom, element.id),
    [zoom, element.id]
  );
  const shift = useEditorSelector(
    (editor) => {
      const view = getZoomView(editor.children, zoom);

      return view ? indentShift(view.root) : 0;
    },
    [zoom]
  );

  if (place === 'hidden') return <div style={{ display: 'none' }}>{children}</div>;

  const offset = shift * ((editor.getOption({ key: KEYS.indent }, 'offset') as number) ?? 24);
  const shifted = offset ? <div style={{ marginLeft: -offset }}>{children}</div> : children;

  if (place === 'root' && zoom) {
    return (
      <>
        <NodeZoomBar zoom={zoom} />
        {shifted}
      </>
    );
  }

  return shifted;
}

// A top-level block — hidden outside the zoom, shifted inside it, the bar above its root.
export const NodeZoomAboveNodes: RenderNodeWrapper = ({ path }) => {
  if (path.length !== 1) return;

  return (props) => <NodeZoomBlock {...props} />;
};

// end-fork-add node-zoom
