import type { ColorHarmony } from "../constants/dna";

export interface Palette {
  baseHue: number;
  harmony: ColorHarmony;
  primary: string;
  secondary: string;
  patternColor: string;
  accent: string;
  outline: string;
}

function hslToHex(h: number, s: number, v: number): string {
  h = ((h % 360) + 360) % 360;
  const c = (v / 100) * (s / 100);
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v / 100 - c;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Darkens a base HSL color for use as an outline. */
function darken(h: number, s: number, v: number, amount = 30): string {
  return hslToHex(h, Math.min(100, s + 10), Math.max(10, v - amount));
}

/**
 * Builds a small, cohesive color palette from a random base hue using
 * standard color-harmony rules, rather than picking every color fully
 * independently (brief section 11).
 */
export function generatePalette(baseHue: number, harmony: ColorHarmony, saturation: number, value: number): Palette {
  let secondaryHue: number;
  let accentHue: number;

  switch (harmony) {
    case "complementary":
      secondaryHue = baseHue + 180;
      accentHue = baseHue + 150;
      break;
    case "triadic":
      secondaryHue = baseHue + 120;
      accentHue = baseHue + 240;
      break;
    case "splitComplementary":
      secondaryHue = baseHue + 150;
      accentHue = baseHue + 210;
      break;
    case "analogous":
    default:
      secondaryHue = baseHue + 30;
      accentHue = baseHue - 30;
      break;
  }

  const primary = hslToHex(baseHue, saturation, value);
  const secondary = hslToHex(secondaryHue, saturation, value);
  const patternColor = hslToHex(secondaryHue, Math.max(20, saturation - 15), Math.min(95, value + 10));
  const accent = hslToHex(accentHue, Math.min(100, saturation + 10), value);
  const outline = darken(baseHue, saturation, value);

  return { baseHue, harmony, primary, secondary, patternColor, accent, outline };
}
