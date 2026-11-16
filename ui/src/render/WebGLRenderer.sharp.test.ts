/**
 * The pixel-exact rules: where the picture lands and which filter draws it.
 * Pure functions, because the renderer itself needs a WebGL2 context that
 * jsdom does not have.
 */
import { describe, expect, it } from "vitest";
import { isIntegerScale, placeContent, usesNearest } from "./WebGLRenderer";

describe("placeContent", () => {
  it("snaps the origin to a whole device pixel at 1:1", () => {
    // 1921 wide canvas, 1920 wide desktop: centring leaves half a pixel.
    const t = placeContent(1921, 1081, 1920, 1080, 1, 1, 0, 0);
    expect(t.x).toBe(Math.round(t.x));
    expect(t.y).toBe(Math.round(t.y));
    expect(Math.abs(t.x - 0.5)).toBeLessThanOrEqual(0.5);
  });

  it("snaps at a whole-number zoom too", () => {
    const t = placeContent(3841, 2161, 1920, 1080, 2, 2, 0, 0);
    expect(t.x).toBe(Math.round(t.x));
    expect(t.y).toBe(Math.round(t.y));
  });

  it("keeps the exact centre at a fractional scale", () => {
    // Nothing to gain from snapping here, and a fit must stay centred.
    const t = placeContent(1000, 1000, 1920, 1080, 1000 / 1920, 1000 / 1920, 0, 0);
    expect(t.x).toBeCloseTo(0, 6);
    expect(t.y).toBeCloseTo((1000 - 1080 * (1000 / 1920)) / 2, 6);
  });

  it("applies the pan before snapping", () => {
    const t = placeContent(1000, 1000, 2000, 2000, 1, 1, 12.4, -7.6);
    expect(t.x).toBe(Math.round(-500 - 12.4));
    expect(t.y).toBe(Math.round(-500 + 7.6));
  });
});

describe("isIntegerScale", () => {
  it("accepts 1, 2 and float noise around them", () => {
    expect(isIntegerScale(1)).toBe(true);
    expect(isIntegerScale(2)).toBe(true);
    expect(isIntegerScale(1.9999999)).toBe(true);
  });
  it("rejects fractional magnification and any shrink", () => {
    expect(isIntegerScale(1.25)).toBe(false);
    expect(isIntegerScale(1.5)).toBe(false);
    expect(isIntegerScale(0.5)).toBe(false);
    // 1:1 is the smallest integer scale; a shrink to exactly half is not one.
    expect(isIntegerScale(0.9999999)).toBe(false);
  });
});

describe("usesNearest", () => {
  it("auto: nearest only at a whole-number scale", () => {
    expect(usesNearest("auto", 1, 1)).toBe(true);
    expect(usesNearest("auto", 2, 2)).toBe(true);
    expect(usesNearest("auto", 1.25, 1.25)).toBe(false);
    expect(usesNearest("auto", 0.8, 0.8)).toBe(false);
    // A "fit" that stretches one axis only is not exact on either.
    expect(usesNearest("auto", 1, 1.1)).toBe(false);
  });
  it("sharp: nearest whenever magnified, never when shrinking", () => {
    expect(usesNearest("sharp", 1.25, 1.25)).toBe(true);
    expect(usesNearest("sharp", 1, 1)).toBe(true);
    expect(usesNearest("sharp", 0.8, 0.8)).toBe(false);
    expect(usesNearest("sharp", 1.5, 0.9)).toBe(false);
  });
  it("smooth: never", () => {
    expect(usesNearest("smooth", 1, 1)).toBe(false);
    expect(usesNearest("smooth", 3, 3)).toBe(false);
  });
});
