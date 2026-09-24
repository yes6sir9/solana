import { describe, expect, it } from "vitest";
import { generatePalette } from "../src/services/colorService";

const HEX_RE = /^#[0-9a-f]{6}$/i;

describe("colorService — harmony-based palette generation", () => {
  it("returns valid hex colors for every harmony type", () => {
    for (const harmony of ["analogous", "complementary", "triadic", "splitComplementary"] as const) {
      const palette = generatePalette(210, harmony, 60, 60);
      expect(palette.primary).toMatch(HEX_RE);
      expect(palette.secondary).toMatch(HEX_RE);
      expect(palette.patternColor).toMatch(HEX_RE);
      expect(palette.accent).toMatch(HEX_RE);
      expect(palette.outline).toMatch(HEX_RE);
    }
  });

  it("is a pure, deterministic function of its inputs", () => {
    const a = generatePalette(45, "triadic", 70, 55);
    const b = generatePalette(45, "triadic", 70, 55);
    expect(a).toEqual(b);
  });

  it("produces a different secondary hue depending on the harmony rule", () => {
    const comp = generatePalette(100, "complementary", 60, 60);
    const analog = generatePalette(100, "analogous", 60, 60);
    expect(comp.secondary).not.toBe(analog.secondary);
  });
});
