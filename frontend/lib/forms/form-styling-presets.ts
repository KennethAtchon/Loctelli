import type { FormStyling } from "./types";

export interface StylingPreset {
  id: string;
  name: string;
  description: string;
  styling: FormStyling;
}

/**
 * Theme presets admins can apply in the form Appearance section.
 *
 * To add a preset: push a new object into the array below with id, name, description,
 * and styling (FormStyling from types.ts: fontFamily, colors, card, buttons, progress,
 * resultScreen — all optional). Use hex colors for colors.*. Font names must be in
 * the Google Fonts safe list (see form-styling-utils.ts). No other files need changes;
 * the Appearance UI reads this array and lists them in the Theme preset dropdown.
 */
export const STYLING_PRESETS: StylingPreset[] = [
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean, light theme with subtle borders",
    styling: {
      fontFamily: { heading: "Inter", body: "Inter" },
      colors: {
        primary: "#18181b",
        primaryForeground: "#fafafa",
        background: "#ffffff",
        foreground: "#18181b",
        card: "#ffffff",
        border: "#e4e4e7",
        muted: "#f4f4f5",
        mutedForeground: "#71717a",
      },
      card: { borderRadius: 8, shadow: "sm" },
      buttons: { borderRadius: 6, style: "solid" },
    },
  },
  {
    id: "dark",
    name: "Dark",
    description: "Dark background, light text",
    styling: {
      fontFamily: { heading: "Inter", body: "Inter" },
      colors: {
        primary: "#3b82f6",
        primaryForeground: "#ffffff",
        background: "#0f172a",
        foreground: "#f1f5f9",
        card: "#1e293b",
        cardForeground: "#f1f5f9",
        border: "#334155",
        muted: "#334155",
        mutedForeground: "#94a3b8",
      },
      card: { borderRadius: 12, shadow: "md" },
      buttons: { borderRadius: 8, style: "solid" },
    },
  },
  {
    id: "light",
    name: "Light (warm)",
    description: "Warm off-white and soft primary",
    styling: {
      fontFamily: { heading: "Source Sans 3", body: "Source Sans 3" },
      colors: {
        primary: "#0d9488",
        primaryForeground: "#ffffff",
        background: "#fafaf9",
        foreground: "#1c1917",
        card: "#ffffff",
        border: "#e7e5e4",
        muted: "#f5f5f4",
        mutedForeground: "#78716c",
      },
      card: { borderRadius: 12, shadow: "md" },
      buttons: { borderRadius: 8, style: "solid" },
    },
  },
  {
    id: "brand",
    name: "Brand (accent)",
    description: "Strong accent with neutral base",
    styling: {
      fontFamily: { heading: "Playfair Display", body: "Open Sans" },
      colors: {
        primary: "#7c3aed",
        primaryForeground: "#ffffff",
        accent: "#a78bfa",
        background: "#fafafa",
        foreground: "#1f2937",
        card: "#ffffff",
        border: "#e5e7eb",
        muted: "#f3f4f6",
        mutedForeground: "#6b7280",
      },
      card: { borderRadius: 16, shadow: "lg" },
      buttons: { borderRadius: 8, style: "solid" },
    },
  },
];

export function getPresetById(id: string): StylingPreset | undefined {
  return STYLING_PRESETS.find((p) => p.id === id);
}
