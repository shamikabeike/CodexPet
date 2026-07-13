import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import {
  PANEL_MAX_WIDTH,
  PANEL_MIN_WIDTH,
  clampPanelWidth,
  projectResizeWidth,
} from "../shared/windowSizing";
import { useI18n } from "../i18n";

const KEYBOARD_STEP = 16;

export function ResizeHandle() {
  const { messages } = useI18n();
  const [resizing, setResizing] = useState(false);
  const [requestedWidth, setRequestedWidth] = useState(() => window.innerWidth);
  const dragStart = useRef({ screenX: 0, screenY: 0, width: window.innerWidth });
  const pendingWidth = useRef<number | null>(null);
  const animationFrame = useRef<number | null>(null);

  const requestResize = (width: number) => {
    const safeWidth = clampPanelWidth(width);
    setRequestedWidth(safeWidth);
    window.codexPet?.window.resize(safeWidth);
  };

  const flushResize = () => {
    animationFrame.current = null;
    if (pendingWidth.current !== null) {
      requestResize(pendingWidth.current);
      pendingWidth.current = null;
    }
  };

  const queueResize = (width: number) => {
    pendingWidth.current = width;
    if (animationFrame.current === null) {
      animationFrame.current = window.requestAnimationFrame(flushResize);
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = {
      screenX: event.screenX,
      screenY: event.screenY,
      width: window.innerWidth,
    };
    setRequestedWidth(window.innerWidth);
    setResizing(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!resizing) {
      return;
    }

    queueResize(
      projectResizeWidth(
        dragStart.current.width,
        event.screenX - dragStart.current.screenX,
        event.screenY - dragStart.current.screenY,
      ),
    );
  };

  const finishResize = (event: PointerEvent<HTMLDivElement>) => {
    if (!resizing) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    flushResize();
    setResizing(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const direction =
      event.key === "ArrowRight" || event.key === "ArrowUp"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowDown"
          ? -1
          : 0;

    if (direction === 0) {
      return;
    }

    event.preventDefault();
    requestResize(window.innerWidth + direction * KEYBOARD_STEP);
  };

  return (
    <div
      className={`resize-handle ${resizing ? "is-resizing" : ""}`}
      role="separator"
      aria-label={messages.resizeAria}
      aria-orientation="horizontal"
      aria-valuemin={PANEL_MIN_WIDTH}
      aria-valuemax={PANEL_MAX_WIDTH}
      aria-valuenow={requestedWidth}
      data-resizing={resizing}
      tabIndex={0}
      title={messages.resizeTitle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishResize}
      onPointerCancel={finishResize}
      onKeyDown={handleKeyDown}
    >
      <span aria-hidden="true" />
    </div>
  );
}
