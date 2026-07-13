import { describe, expect, it } from "vitest";
import {
  PANEL_BASE_HEIGHT,
  PANEL_BASE_WIDTH,
  PANEL_DEFAULT_HEIGHT,
  PANEL_DEFAULT_WIDTH,
  PANEL_MAX_WIDTH,
  PANEL_MIN_WIDTH,
  clampPanelWidth,
  panelHeightForWidth,
  projectResizeWidth,
  usesCompactLayout,
} from "./windowSizing";

describe("windowSizing", () => {
  it("keeps the approved 520 by 460 base size", () => {
    expect(panelHeightForWidth(PANEL_BASE_WIDTH)).toBe(PANEL_BASE_HEIGHT);
  });

  it("starts at half size and allows a quarter-size minimum", () => {
    expect(PANEL_DEFAULT_WIDTH).toBe(260);
    expect(PANEL_DEFAULT_HEIGHT).toBe(230);
    expect(PANEL_MIN_WIDTH).toBe(130);
    expect(panelHeightForWidth(PANEL_MIN_WIDTH)).toBe(115);
  });

  it("switches to the readable compact layout only near the minimum size", () => {
    expect(usesCompactLayout(0.25)).toBe(true);
    expect(usesCompactLayout(0.36)).toBe(true);
    expect(usesCompactLayout(0.5)).toBe(false);
    expect(usesCompactLayout(Number.NaN)).toBe(false);
  });

  it("clamps unsafe and non-finite widths", () => {
    expect(clampPanelWidth(80)).toBe(PANEL_MIN_WIDTH);
    expect(clampPanelWidth(2_000)).toBe(PANEL_MAX_WIDTH);
    expect(clampPanelWidth(Number.NaN)).toBe(PANEL_DEFAULT_WIDTH);
  });

  it("projects diagonal pointer movement while preserving the aspect ratio", () => {
    const width = projectResizeWidth(PANEL_BASE_WIDTH, 60, 40);
    expect(width).toBeGreaterThan(PANEL_BASE_WIDTH);
    expect(panelHeightForWidth(width) / width).toBeCloseTo(
      PANEL_BASE_HEIGHT / PANEL_BASE_WIDTH,
      2,
    );
  });
});
