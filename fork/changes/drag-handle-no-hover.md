# drag-handle-no-hover

The block drag handle reacts to nothing on hover — no tooltip, no background.

Upstream pops a `Drag to move` tooltip the instant the pointer touches the grip (the provider's
delay is 0) and paints the ghost button's hover background under it. The handle only appears
because the block is already hovered, so both fire on the way to a drag and read as noise.

Files:

- `src/webview/components/ui/block-draggable.tsx` — the tooltip held closed, the hover background
  turned transparent in both themes
