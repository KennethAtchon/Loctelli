"use client";

import { useFormContext } from "react-hook-form";
import { ExternalLink, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FormStyling } from "@/lib/forms/types";
import type { FormTemplateFormValues } from "@/app/admin/(main)/forms/hooks/use-form-template-form-state";
import { STYLING_PRESETS } from "@/lib/forms/form-styling-presets";
import { getContrastResult } from "@/lib/forms/contrast-utils";

/** Sentinel for "system default" — Radix Select disallows SelectItem value="". */
const FONT_SYSTEM_DEFAULT = "__system__";

const FONT_OPTIONS = [
  { value: FONT_SYSTEM_DEFAULT, label: "System default" },
  { value: "Inter", label: "Inter" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Lato", label: "Lato" },
  { value: "Roboto", label: "Roboto" },
  { value: "Source Sans 3", label: "Source Sans 3" },
  { value: "Merriweather", label: "Merriweather" },
];

const SHADOW_OPTIONS: { value: "none" | "sm" | "md" | "lg"; label: string }[] =
  [
    { value: "none", label: "None" },
    { value: "sm", label: "Small" },
    { value: "md", label: "Medium" },
    { value: "lg", label: "Large" },
  ];

const BUTTON_STYLE_OPTIONS: {
  value: "solid" | "outline" | "ghost";
  label: string;
}[] = [
  { value: "solid", label: "Solid" },
  { value: "outline", label: "Outline" },
  { value: "ghost", label: "Ghost" },
];

const RESULT_LAYOUT_OPTIONS: { value: "centered" | "full"; label: string }[] = [
  { value: "centered", label: "Centered" },
  { value: "full", label: "Full width" },
];

function ensureStyling(s: FormStyling | null | undefined): FormStyling {
  return s && typeof s === "object" ? s : {};
}

interface FormAppearanceSectionProps {
  /** When provided (e.g. on edit page), show Preview button that opens public form in new tab. */
  formSlug?: string | null;
}

/**
 * Appearance / Theme section for card forms. Must be rendered inside the parent form's FormProvider.
 * Only show when formType === "CARD".
 */
export function FormAppearanceSection(props?: FormAppearanceSectionProps) {
  const { formSlug } = props ?? {};
  const form = useFormContext<FormTemplateFormValues>();
  const styling = form.watch("styling");
  const current = ensureStyling(styling);

  const updateNested = <K extends keyof FormStyling>(
    path: K,
    key: string,
    value: unknown
  ) => {
    const obj = (current[path] as Record<string, unknown>) ?? {};
    form.setValue("styling", {
      ...current,
      [path]: { ...obj, [key]: value === "" ? undefined : value },
    });
  };

  const previewUrl = formSlug ? `/forms/card/${formSlug}` : null;

  const applyPreset = (presetId: string) => {
    const preset = STYLING_PRESETS.find((p) => p.id === presetId);
    if (preset) form.setValue("styling", { ...preset.styling });
  };

  const primaryHex = (current.colors?.primary ?? "").trim().replace(/^#/, "")
    ? (current.colors?.primary ?? "").trim()
    : null;
  const primaryFgHex = (current.colors?.primaryForeground ?? "")
    .trim()
    .replace(/^#/, "")
    ? (current.colors?.primaryForeground ?? "").trim()
    : null;
  const contrastPrimaryFg =
    primaryHex && primaryFgHex
      ? getContrastResult(
          primaryFgHex.startsWith("#") ? primaryFgHex : `#${primaryFgHex}`,
          primaryHex.startsWith("#") ? primaryHex : `#${primaryHex}`
        )
      : null;
  const bgHex = (current.colors?.background ?? "").trim().replace(/^#/, "")
    ? (current.colors?.background ?? "").trim()
    : null;
  const contrastPrimaryBg =
    primaryHex && bgHex
      ? getContrastResult(
          primaryHex.startsWith("#") ? primaryHex : `#${primaryHex}`,
          bgHex.startsWith("#") ? bgHex : `#${bgHex}`
        )
      : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize fonts, colors, and card style for this form. Leave empty
            to use defaults.
          </CardDescription>
        </div>
        {previewUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(previewUrl, "_blank", "noopener,noreferrer")
            }
            className="shrink-0 gap-1.5"
          >
            <ExternalLink className="h-4 w-4" />
            Preview
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Theme preset</Label>
          <Select
            value=""
            onValueChange={(v) => {
              if (v) applyPreset(v);
            }}
          >
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Apply a starting theme…" />
            </SelectTrigger>
            <SelectContent>
              {STYLING_PRESETS.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} — {p.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Typography</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="styling-font-heading"
                className="text-muted-foreground text-xs"
              >
                Heading font
              </Label>
              <Select
                value={current.fontFamily?.heading ?? FONT_SYSTEM_DEFAULT}
                onValueChange={(v) =>
                  updateNested(
                    "fontFamily",
                    "heading",
                    v === FONT_SYSTEM_DEFAULT ? undefined : v
                  )
                }
              >
                <SelectTrigger id="styling-font-heading" className="mt-1">
                  <SelectValue placeholder="System default" />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label
                htmlFor="styling-font-body"
                className="text-muted-foreground text-xs"
              >
                Body font
              </Label>
              <Select
                value={current.fontFamily?.body ?? FONT_SYSTEM_DEFAULT}
                onValueChange={(v) =>
                  updateNested(
                    "fontFamily",
                    "body",
                    v === FONT_SYSTEM_DEFAULT ? undefined : v
                  )
                }
              >
                <SelectTrigger id="styling-font-body" className="mt-1">
                  <SelectValue placeholder="System default" />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label
                htmlFor="styling-base-font-size"
                className="text-muted-foreground text-xs"
              >
                Base font size (px)
              </Label>
              <Input
                id="styling-base-font-size"
                type="number"
                min={14}
                max={24}
                placeholder="16"
                value={
                  current.baseFontSize === undefined
                    ? ""
                    : String(current.baseFontSize)
                }
                onChange={(e) => {
                  const v = e.target.value;
                  form.setValue("styling", {
                    ...current,
                    baseFontSize: v === "" ? undefined : Number(v),
                  });
                }}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Recommended 16–18 for body text. Leave empty for default.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Colors</Label>
          {(contrastPrimaryFg || contrastPrimaryBg) && (
            <div className="space-y-1.5">
              {contrastPrimaryFg && (
                <div className="flex items-center gap-2 text-sm">
                  {contrastPrimaryFg.passesAA ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  )}
                  <span
                    className={
                      contrastPrimaryFg.passesAA
                        ? "text-muted-foreground"
                        : "text-amber-700 dark:text-amber-400"
                    }
                  >
                    Primary vs primary text: {contrastPrimaryFg.ratio}:1
                    {contrastPrimaryFg.passesAA
                      ? " — passes WCAG AA"
                      : " — aim for 4.5:1+ for readability"}
                  </span>
                </div>
              )}
              {contrastPrimaryBg && (
                <div className="flex items-center gap-2 text-sm">
                  {contrastPrimaryBg.passesAA ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  )}
                  <span
                    className={
                      contrastPrimaryBg.passesAA
                        ? "text-muted-foreground"
                        : "text-amber-700 dark:text-amber-400"
                    }
                  >
                    Primary vs background: {contrastPrimaryBg.ratio}:1
                    {contrastPrimaryBg.passesAA
                      ? " — passes WCAG AA"
                      : " — consider a stronger primary for visibility"}
                  </span>
                </div>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="styling-primary"
                className="text-muted-foreground text-xs"
              >
                Primary (buttons, progress)
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="styling-primary"
                  type="color"
                  className="h-10 w-14 p-1 cursor-pointer"
                  value={current.colors?.primary ?? "#000000"}
                  onChange={(e) =>
                    updateNested("colors", "primary", e.target.value)
                  }
                />
                <Input
                  type="text"
                  placeholder="#000000"
                  value={current.colors?.primary ?? ""}
                  onChange={(e) =>
                    updateNested("colors", "primary", e.target.value)
                  }
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <Label
                htmlFor="styling-primary-fg"
                className="text-muted-foreground text-xs"
              >
                Primary text (on primary)
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="styling-primary-fg"
                  type="color"
                  className="h-10 w-14 p-1 cursor-pointer"
                  value={current.colors?.primaryForeground ?? "#ffffff"}
                  onChange={(e) =>
                    updateNested("colors", "primaryForeground", e.target.value)
                  }
                />
                <Input
                  type="text"
                  placeholder="#ffffff"
                  value={current.colors?.primaryForeground ?? ""}
                  onChange={(e) =>
                    updateNested("colors", "primaryForeground", e.target.value)
                  }
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <Label
                htmlFor="styling-bg"
                className="text-muted-foreground text-xs"
              >
                Page background
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="styling-bg"
                  type="color"
                  className="h-10 w-14 p-1 cursor-pointer"
                  value={current.colors?.background ?? "#f9fafb"}
                  onChange={(e) =>
                    updateNested("colors", "background", e.target.value)
                  }
                />
                <Input
                  type="text"
                  placeholder="e.g. #f9fafb"
                  value={current.colors?.background ?? ""}
                  onChange={(e) =>
                    updateNested("colors", "background", e.target.value)
                  }
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <Label
                htmlFor="styling-fg"
                className="text-muted-foreground text-xs"
              >
                Text color
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="styling-fg"
                  type="color"
                  className="h-10 w-14 p-1 cursor-pointer"
                  value={current.colors?.foreground ?? "#111827"}
                  onChange={(e) =>
                    updateNested("colors", "foreground", e.target.value)
                  }
                />
                <Input
                  type="text"
                  placeholder="e.g. #111827"
                  value={current.colors?.foreground ?? ""}
                  onChange={(e) =>
                    updateNested("colors", "foreground", e.target.value)
                  }
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <Label
                htmlFor="styling-card"
                className="text-muted-foreground text-xs"
              >
                Card background
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="styling-card"
                  type="color"
                  className="h-10 w-14 p-1 cursor-pointer"
                  value={current.colors?.card ?? "#ffffff"}
                  onChange={(e) =>
                    updateNested("colors", "card", e.target.value)
                  }
                />
                <Input
                  type="text"
                  placeholder="#ffffff"
                  value={current.colors?.card ?? ""}
                  onChange={(e) =>
                    updateNested("colors", "card", e.target.value)
                  }
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <Label
                htmlFor="styling-border"
                className="text-muted-foreground text-xs"
              >
                Border color
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="styling-border"
                  type="color"
                  className="h-10 w-14 p-1 cursor-pointer"
                  value={current.colors?.border ?? "#e5e7eb"}
                  onChange={(e) =>
                    updateNested("colors", "border", e.target.value)
                  }
                />
                <Input
                  type="text"
                  placeholder="#e5e7eb"
                  value={current.colors?.border ?? ""}
                  onChange={(e) =>
                    updateNested("colors", "border", e.target.value)
                  }
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <Label
                htmlFor="styling-accent"
                className="text-muted-foreground text-xs"
              >
                Accent (highlights)
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="styling-accent"
                  type="color"
                  className="h-10 w-14 p-1 cursor-pointer"
                  value={current.colors?.accent ?? "#0ea5e9"}
                  onChange={(e) =>
                    updateNested("colors", "accent", e.target.value)
                  }
                />
                <Input
                  type="text"
                  placeholder="#0ea5e9"
                  value={current.colors?.accent ?? ""}
                  onChange={(e) =>
                    updateNested("colors", "accent", e.target.value)
                  }
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <Label
                htmlFor="styling-muted"
                className="text-muted-foreground text-xs"
              >
                Muted background
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="styling-muted"
                  type="color"
                  className="h-10 w-14 p-1 cursor-pointer"
                  value={current.colors?.muted ?? "#f3f4f6"}
                  onChange={(e) =>
                    updateNested("colors", "muted", e.target.value)
                  }
                />
                <Input
                  type="text"
                  placeholder="#f3f4f6"
                  value={current.colors?.muted ?? ""}
                  onChange={(e) =>
                    updateNested("colors", "muted", e.target.value)
                  }
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <Label
                htmlFor="styling-muted-fg"
                className="text-muted-foreground text-xs"
              >
                Muted text
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="styling-muted-fg"
                  type="color"
                  className="h-10 w-14 p-1 cursor-pointer"
                  value={current.colors?.mutedForeground ?? "#6b7280"}
                  onChange={(e) =>
                    updateNested("colors", "mutedForeground", e.target.value)
                  }
                />
                <Input
                  type="text"
                  placeholder="#6b7280"
                  value={current.colors?.mutedForeground ?? ""}
                  onChange={(e) =>
                    updateNested("colors", "mutedForeground", e.target.value)
                  }
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Progress bar</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="styling-progress-color"
                className="text-muted-foreground text-xs"
              >
                Bar color
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="styling-progress-color"
                  type="color"
                  className="h-10 w-14 p-1 cursor-pointer"
                  value={current.progress?.color ?? "#0d9488"}
                  onChange={(e) =>
                    updateNested("progress", "color", e.target.value)
                  }
                />
                <Input
                  type="text"
                  placeholder="#0d9488"
                  value={current.progress?.color ?? ""}
                  onChange={(e) =>
                    updateNested("progress", "color", e.target.value)
                  }
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <Label
                htmlFor="styling-progress-height"
                className="text-muted-foreground text-xs"
              >
                Bar height (px)
              </Label>
              <Input
                id="styling-progress-height"
                type="number"
                min={2}
                max={24}
                placeholder="8"
                value={
                  current.progress?.barHeight === undefined
                    ? ""
                    : String(current.progress.barHeight)
                }
                onChange={(e) => {
                  const v = e.target.value;
                  updateNested(
                    "progress",
                    "barHeight",
                    v === "" ? undefined : Number(v)
                  );
                }}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Card style</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="styling-card-radius"
                className="text-muted-foreground text-xs"
              >
                Border radius (px)
              </Label>
              <Input
                id="styling-card-radius"
                type="number"
                min={0}
                max={24}
                placeholder="8"
                value={
                  current.card?.borderRadius === undefined
                    ? ""
                    : String(current.card.borderRadius)
                }
                onChange={(e) => {
                  const v = e.target.value;
                  updateNested(
                    "card",
                    "borderRadius",
                    v === "" ? undefined : Number(v)
                  );
                }}
                className="mt-1"
              />
            </div>
            <div>
              <Label
                htmlFor="styling-card-shadow"
                className="text-muted-foreground text-xs"
              >
                Shadow
              </Label>
              <Select
                value={current.card?.shadow ?? "default"}
                onValueChange={(v) =>
                  updateNested(
                    "card",
                    "shadow",
                    v === "default" ? undefined : v
                  )
                }
              >
                <SelectTrigger id="styling-card-shadow" className="mt-1">
                  <SelectValue placeholder="Default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  {SHADOW_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label
                htmlFor="styling-card-height-mobile"
                className="text-muted-foreground text-xs"
              >
                Card height - mobile (px or rem)
              </Label>
              <Input
                id="styling-card-height-mobile"
                type="text"
                placeholder="400px"
                value={current.card?.height?.mobile ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (v === "") {
                    updateNested("card", "height", {
                      ...current.card?.height,
                      mobile: undefined,
                    });
                    return;
                  }
                  updateNested("card", "height", {
                    ...current.card?.height,
                    mobile: v,
                  });
                }}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Height for mobile screens. Default: 400px
              </p>
            </div>
            <div>
              <Label
                htmlFor="styling-card-height-tablet"
                className="text-muted-foreground text-xs"
              >
                Card height - tablet (px or rem)
              </Label>
              <Input
                id="styling-card-height-tablet"
                type="text"
                placeholder="600px"
                value={current.card?.height?.tablet ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (v === "") {
                    updateNested("card", "height", {
                      ...current.card?.height,
                      tablet: undefined,
                    });
                    return;
                  }
                  updateNested("card", "height", {
                    ...current.card?.height,
                    tablet: v,
                  });
                }}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Height for tablet screens (md:). Default: 600px
              </p>
            </div>
            <div>
              <Label
                htmlFor="styling-card-height-desktop"
                className="text-muted-foreground text-xs"
              >
                Card height - desktop (px or rem)
              </Label>
              <Input
                id="styling-card-height-desktop"
                type="text"
                placeholder="700px"
                value={current.card?.height?.desktop ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (v === "") {
                    updateNested("card", "height", {
                      ...current.card?.height,
                      desktop: undefined,
                    });
                    return;
                  }
                  updateNested("card", "height", {
                    ...current.card?.height,
                    desktop: v,
                  });
                }}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Height for desktop screens (lg:). Default: 700px
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Buttons</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="styling-btn-radius"
                className="text-muted-foreground text-xs"
              >
                Border radius (px)
              </Label>
              <Input
                id="styling-btn-radius"
                type="number"
                min={0}
                max={24}
                placeholder="6"
                value={
                  current.buttons?.borderRadius === undefined
                    ? ""
                    : String(current.buttons.borderRadius)
                }
                onChange={(e) => {
                  const v = e.target.value;
                  updateNested(
                    "buttons",
                    "borderRadius",
                    v === "" ? undefined : Number(v)
                  );
                }}
                className="mt-1"
              />
            </div>
            <div>
              <Label
                htmlFor="styling-btn-style"
                className="text-muted-foreground text-xs"
              >
                Button style
              </Label>
              <Select
                value={current.buttons?.style ?? "solid"}
                onValueChange={(v) => updateNested("buttons", "style", v)}
              >
                <SelectTrigger id="styling-btn-style" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUTTON_STYLE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Result screen</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="styling-result-layout"
                className="text-muted-foreground text-xs"
              >
                Layout
              </Label>
              <Select
                value={current.resultScreen?.layout ?? "default"}
                onValueChange={(v) =>
                  updateNested(
                    "resultScreen",
                    "layout",
                    v === "default" ? undefined : v
                  )
                }
              >
                <SelectTrigger id="styling-result-layout" className="mt-1">
                  <SelectValue placeholder="Default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  {RESULT_LAYOUT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label
                htmlFor="styling-result-title-size"
                className="text-muted-foreground text-xs"
              >
                Result title size (px or e.g. 1.5rem)
              </Label>
              <Input
                id="styling-result-title-size"
                type="text"
                placeholder="e.g. 24 or 1.5rem"
                value={
                  current.resultScreen?.titleFontSize === undefined
                    ? ""
                    : String(current.resultScreen.titleFontSize)
                }
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (v === "") {
                    updateNested("resultScreen", "titleFontSize", undefined);
                    return;
                  }
                  const num = Number(v);
                  updateNested(
                    "resultScreen",
                    "titleFontSize",
                    Number.isNaN(num) ? v : num
                  );
                }}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
