/**
 * Utilities for applying FormStyling to the public card form via CSS variables.
 * All variables use fallbacks so missing styling does not break layout.
 */

import type { FormStyling } from "./types";

/** Font names that are available via Google Fonts (safe list for Phase 2). */
const GOOGLE_FONT_NAMES = new Set([
  "Inter",
  "Open Sans",
  "Playfair Display",
  "Lato",
  "Roboto",
  "Source Sans 3",
  "Merriweather",
]);

/**
 * Returns a Google Fonts CSS2 URL for the given font names. Only includes names in the safe list.
 * Use with <link rel="stylesheet" href={url} /> to load fonts.
 */
export function getGoogleFontsStylesheetUrl(
  fontNames: (string | undefined)[]
): string | null {
  const names = fontNames.filter(
    (n): n is string =>
      typeof n === "string" && n.length > 0 && GOOGLE_FONT_NAMES.has(n)
  );
  if (names.length === 0) return null;
  const unique = [...new Set(names)];
  const params = unique
    .map(
      (name) =>
        `family=${encodeURIComponent(name).replace(/ /g, "+")}:wght@400;600;700`
    )
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

/** CSS variable names used by the card form theme. */
export const FORM_STYLING_VARS = {
  fontHeading: "--form-font-heading",
  fontBody: "--form-font-body",
  baseFontSize: "--form-base-font-size",
  primary: "--form-primary",
  primaryForeground: "--form-primary-foreground",
  accent: "--form-accent",
  background: "--form-background",
  foreground: "--form-foreground",
  card: "--form-card",
  cardForeground: "--form-card-foreground",
  border: "--form-border",
  muted: "--form-muted",
  mutedForeground: "--form-muted-foreground",
  cardRadius: "--form-card-radius",
  cardShadow: "--form-card-shadow",
  cardMaxWidth: "--form-card-max-width",
  buttonRadius: "--form-button-radius",
  buttonVariant: "--form-button-variant",
  progressColor: "--form-progress-color",
  progressBarHeight: "--form-progress-bar-height",
  resultLayout: "--form-result-layout",
  resultTitleFontSize: "--form-result-title-font-size",
} as const;

const defaultCardShadow =
  "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)";

/**
 * Maps FormStyling to a React.CSSProperties object that sets CSS variables.
 * Use as the style prop on a wrapper div so children can use var(--form-*).
 * Fallbacks are chosen to match typical app defaults (Tailwind/theme).
 */
export function formStylingToCssVars(
  styling: FormStyling | null | undefined
): React.CSSProperties {
  if (!styling || typeof styling !== "object") {
    return {};
  }

  const s = styling;
  const vars: Record<string, string> = {};

  if (s.fontFamily?.heading) {
    vars[FORM_STYLING_VARS.fontHeading] = s.fontFamily.heading;
  }
  if (s.fontFamily?.body) {
    vars[FORM_STYLING_VARS.fontBody] = s.fontFamily.body;
  }
  if (s.baseFontSize !== undefined && s.baseFontSize > 0) {
    vars[FORM_STYLING_VARS.baseFontSize] = `${s.baseFontSize}px`;
  }
  if (s.colors?.primary) {
    vars[FORM_STYLING_VARS.primary] = s.colors.primary;
    vars["--primary"] = s.colors.primary; // So Progress and default Button use form theme
  }
  if (s.colors?.primaryForeground) {
    vars[FORM_STYLING_VARS.primaryForeground] = s.colors.primaryForeground;
    vars["--primary-foreground"] = s.colors.primaryForeground;
  }
  if (s.colors?.background) {
    vars[FORM_STYLING_VARS.background] = s.colors.background;
    vars["--background"] = s.colors.background; // So theme-based classes (e.g. page area) use form theme
  }
  if (s.colors?.foreground) {
    vars[FORM_STYLING_VARS.foreground] = s.colors.foreground;
    vars["--foreground"] = s.colors.foreground;
  }
  if (s.colors?.card) {
    vars[FORM_STYLING_VARS.card] = s.colors.card;
    vars["--card"] = s.colors.card;
  }
  if (s.colors?.cardForeground) {
    vars[FORM_STYLING_VARS.cardForeground] = s.colors.cardForeground;
    vars["--card-foreground"] = s.colors.cardForeground;
  }
  if (s.colors?.border) {
    vars[FORM_STYLING_VARS.border] = s.colors.border;
    vars["--border"] = s.colors.border;
  }
  if (s.colors?.accent) {
    vars[FORM_STYLING_VARS.accent] = s.colors.accent;
    vars["--accent"] = s.colors.accent;
  }
  if (s.colors?.muted) {
    vars[FORM_STYLING_VARS.muted] = s.colors.muted;
    vars["--muted"] = s.colors.muted;
  }
  if (s.colors?.mutedForeground) {
    vars[FORM_STYLING_VARS.mutedForeground] = s.colors.mutedForeground;
    vars["--muted-foreground"] = s.colors.mutedForeground;
  }
  if (s.progress?.color) {
    vars[FORM_STYLING_VARS.progressColor] = s.progress.color;
  }
  if (s.progress?.barHeight !== undefined && s.progress.barHeight > 0) {
    vars[FORM_STYLING_VARS.progressBarHeight] = `${s.progress.barHeight}px`;
  }
  if (s.resultScreen?.layout) {
    vars[FORM_STYLING_VARS.resultLayout] = s.resultScreen.layout;
    vars["--form-result-max-width"] =
      s.resultScreen.layout === "full" ? "100%" : "48rem";
  }
  if (
    s.resultScreen?.titleFontSize !== undefined &&
    s.resultScreen.titleFontSize !== ""
  ) {
    const v = s.resultScreen.titleFontSize;
    vars[FORM_STYLING_VARS.resultTitleFontSize] =
      typeof v === "number" ? `${v}px` : String(v);
  }
  if (s.card?.borderRadius !== undefined && s.card.borderRadius !== "") {
    const v = s.card.borderRadius;
    vars[FORM_STYLING_VARS.cardRadius] =
      typeof v === "number" ? `${v}px` : String(v);
  }
  if (s.card?.maxWidth !== undefined && s.card.maxWidth !== "") {
    const v = s.card.maxWidth;
    vars[FORM_STYLING_VARS.cardMaxWidth] =
      typeof v === "number" ? `${v}px` : String(v);
  }
  if (s.card?.shadow) {
    if (s.card.shadow === "none") {
      vars[FORM_STYLING_VARS.cardShadow] = "none";
    } else if (s.card.shadow === "sm") {
      vars[FORM_STYLING_VARS.cardShadow] = "0 1px 2px 0 rgb(0 0 0 / 0.05)";
    } else if (s.card.shadow === "md") {
      vars[FORM_STYLING_VARS.cardShadow] = defaultCardShadow;
    } else if (s.card.shadow === "lg") {
      vars[FORM_STYLING_VARS.cardShadow] =
        "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)";
    }
  }
  if (s.buttons?.borderRadius !== undefined && s.buttons.borderRadius !== "") {
    const v = s.buttons.borderRadius;
    vars[FORM_STYLING_VARS.buttonRadius] =
      typeof v === "number" ? `${v}px` : String(v);
  }
  if (s.buttons?.style) {
    vars[FORM_STYLING_VARS.buttonVariant] = s.buttons.style;
  }

  return vars as React.CSSProperties;
}
