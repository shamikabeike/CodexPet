export const PANEL_BASE_WIDTH = 520;
export const PANEL_BASE_HEIGHT = 460;
export const PANEL_DEFAULT_SCALE = 0.5;
export const PANEL_MIN_SCALE = 0.25;
export const PANEL_MAX_SCALE = 1.5;
export const PANEL_COMPACT_MAX_SCALE = 0.36;
export const PANEL_DEFAULT_WIDTH = PANEL_BASE_WIDTH * PANEL_DEFAULT_SCALE;
export const PANEL_DEFAULT_HEIGHT = PANEL_BASE_HEIGHT * PANEL_DEFAULT_SCALE;
export const PANEL_MIN_WIDTH = PANEL_BASE_WIDTH * PANEL_MIN_SCALE;
export const PANEL_MAX_WIDTH = PANEL_BASE_WIDTH * PANEL_MAX_SCALE;
export const PANEL_ASPECT_RATIO = PANEL_BASE_WIDTH / PANEL_BASE_HEIGHT;

export function usesCompactLayout(scale: number): boolean {
  return Number.isFinite(scale) && scale <= PANEL_COMPACT_MAX_SCALE;
}

export function clampPanelWidth(width: number): number {
  if (!Number.isFinite(width)) {
    return PANEL_DEFAULT_WIDTH;
  }

  return Math.min(PANEL_MAX_WIDTH, Math.max(PANEL_MIN_WIDTH, Math.round(width)));
}

export function panelHeightForWidth(width: number): number {
  return Math.round(clampPanelWidth(width) / PANEL_ASPECT_RATIO);
}

export function projectResizeWidth(
  startWidth: number,
  deltaX: number,
  deltaY: number,
): number {
  const projectedDelta =
    (deltaX + deltaY / PANEL_ASPECT_RATIO) /
    (1 + 1 / PANEL_ASPECT_RATIO ** 2);

  return clampPanelWidth(startWidth + projectedDelta);
}
