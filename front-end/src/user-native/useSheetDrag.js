import { useRef, useState } from "react";

// Drag-down-to-dismiss for bottom sheets: attach `handlers` to the sheet's header,
// translate the sheet by `dragY`, and `onDismiss` fires once it was pulled far enough.
export default function useSheetDrag(onDismiss, threshold = 120) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handlers = {
    onPointerDown: (e) => {
      startY.current = e.clientY;
      currentY.current = 0;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e) => {
      if (!dragging) return;
      const dy = e.clientY - startY.current;
      if (dy > 0) {
        currentY.current = dy;
        setDragY(dy);
      }
    },
    onPointerUp: (e) => {
      setDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // pointer already released
      }
      const dismissed = currentY.current > threshold;
      currentY.current = 0;
      setDragY(0);
      if (dismissed) onDismiss();
    },
    onPointerCancel: () => {
      setDragging(false);
      currentY.current = 0;
      setDragY(0);
    },
  };

  return { dragY, dragging, handlers };
}
