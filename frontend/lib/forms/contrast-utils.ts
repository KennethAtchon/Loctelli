/**
 * Accessibility contrast utilities for form styling.
 * WCAG 2.1: AA requires 4.5:1 for normal text, 3:1 for large text; AAA requires 7:1 and 4.5:1.
 */

/** Parse hex color to RGB [0-255]. Returns null if invalid. */
export function hexToRgb(hex: string): [number, number, number] | null {
  const cleaned = hex.replace(/^#/, "").trim();
  if (cleaned.length !== 3 && cleaned.length !== 6) return null;
  let r: number, g: number, b: number;
  if (cleaned.length === 3) {
    r = parseInt(cleaned[0] + cleaned[0], 16);
    g = parseInt(cleaned[1] + cleaned[1], 16);
    b = parseInt(cleaned[2] + cleaned[2], 16);
  } else {
    r = parseInt(cleaned.slice(0, 2), 16);
    g = parseInt(cleaned.slice(2, 4), 16);
    b = parseInt(cleaned.slice(4, 6), 16);
  }
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return [r, g, b];
}

/** Relative luminance (WCAG formula). Input RGB 0-255. */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** Contrast ratio between two luminances (1 to 21). */
export function getContrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  if (darker === 0) return 21;
  return (lighter + 0.05) / (darker + 0.05);
}

export interface ContrastResult {
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
  /** For large text (e.g. 18px+ or 14px+ bold), AA is 3:1. */
  passesAALarge: boolean;
}

/**
 * Get contrast ratio and WCAG pass/fail for two hex colors.
 * foreground = text color, background = background color.
 */
export function getContrastResult(
  foregroundHex: string,
  backgroundHex: string
): ContrastResult | null {
  const fg = hexToRgb(foregroundHex);
  const bg = hexToRgb(backgroundHex);
  if (!fg || !bg) return null;
  const lumFg = getLuminance(...fg);
  const lumBg = getLuminance(...bg);
  const ratio = getContrastRatio(lumFg, lumBg);
  return {
    ratio: Math.round(ratio * 100) / 100,
    passesAA: ratio >= 4.5,
    passesAAA: ratio >= 7,
    passesAALarge: ratio >= 3,
  };
}

/** Minimum ratio for WCAG AA normal text. */
export const CONTRAST_AA_NORMAL = 4.5;
/** Minimum ratio for WCAG AA large text. */
export const CONTRAST_AA_LARGE = 3;
