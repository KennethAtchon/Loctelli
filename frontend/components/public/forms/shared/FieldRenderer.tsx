"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle } from "lucide-react";
import Image from "next/image";
import type { FormField, CardMedia } from "@/lib/forms/types";
import { applyPiping, getDynamicLabel } from "@/lib/forms/conditional-logic";

export interface FieldRendererProps {
  field: FormField;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
  mode: "simple" | "card";
  onCheckboxChange?: (option: string, checked: boolean) => void;
  onFileUpload?: (file: File) => Promise<void>;
  uploading?: boolean;
  uploadedFile?: { url: string; originalName: string } | File[];
  disabled?: boolean;
  error?: string;
  /** All form fields (for piping) */
  allFields?: FormField[];
  /** Current form data (for piping) */
  formData?: Record<string, unknown>;
}

function MediaRenderer({ media }: { media: CardMedia }) {
  if (!media.url && !media.videoId) return null;

  const mediaContent = (() => {
    if (media.type === "image" || media.type === "gif") {
      return (
        <div className="w-full aspect-video rounded-lg overflow-hidden mb-4 flex items-center justify-center">
          <img
            src={media.url!}
            alt={media.altText || ""}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      );
    }
    if (media.type === "video") {
      if (media.videoType === "youtube" && media.videoId) {
        return (
          <div className="w-full aspect-video rounded-lg overflow-hidden mb-4">
            <iframe
              src={`https://www.youtube.com/embed/${media.videoId}`}
              className="w-full h-full"
              allowFullScreen
            />
          </div>
        );
      }
      if (media.videoType === "vimeo" && media.videoId) {
        return (
          <div className="w-full aspect-video rounded-lg overflow-hidden mb-4">
            <iframe
              src={`https://player.vimeo.com/video/${media.videoId}`}
              className="w-full h-full"
              allowFullScreen
            />
          </div>
        );
      }
      if (media.videoType === "upload" && media.url) {
        return (
          <div className="w-full aspect-video rounded-lg overflow-hidden mb-4">
            <video src={media.url} controls className="w-full h-full" />
          </div>
        );
      }
    }
    if (media.type === "icon" && media.url) {
      return (
        <div className="w-full flex justify-center mb-4">
          <img
            src={media.url}
            alt={media.altText || ""}
            className="h-24 w-24 object-contain"
          />
        </div>
      );
    }
    return null;
  })();

  if (!mediaContent) return null;

  if (media.position === "background") {
    return (
      <div className="absolute inset-0 -z-10 opacity-20">{mediaContent}</div>
    );
  }

  return mediaContent;
}

function QuestionLabel({
  htmlFor,
  children,
  mode,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  mode: "simple" | "card";
}) {
  if (mode === "card") {
    return (
      <Label
        htmlFor={htmlFor}
        className="text-2xl font-medium text-center block"
      >
        {children}
      </Label>
    );
  }
  return (
    <Label htmlFor={htmlFor} className="text-sm font-medium">
      {children}
    </Label>
  );
}

export function FieldRenderer({
  field,
  value,
  onChange,
  mode,
  onCheckboxChange,
  onFileUpload,
  uploading = false,
  uploadedFile,
  disabled,
  error,
  allFields = [],
  formData = {},
}: FieldRendererProps) {
  const stringValue = (value as string | undefined) ?? "";
  const requiredMark = field.required ? (
    <span className="text-destructive ml-0.5">*</span>
  ) : null;

  // Get dynamic label if conditional logic is set (card mode only)
  const baseLabel =
    mode === "card" && formData && Object.keys(formData).length > 0
      ? getDynamicLabel(field, formData)
      : field.label;

  // Apply piping if enabled (card mode only)
  const displayLabel =
    mode === "card" && field.enablePiping && formData && allFields.length > 0
      ? applyPiping(baseLabel, formData, allFields)
      : baseLabel;
  const displayPlaceholder =
    mode === "card" &&
    field.enablePiping &&
    field.placeholder &&
    formData &&
    allFields.length > 0
      ? applyPiping(field.placeholder, formData, allFields)
      : field.placeholder;

  const media = field.media;
  const showMediaAbove = media && media.position === "above";
  const showMediaBelow = media && media.position === "below";
  const showMediaLeft = media && media.position === "left";
  const showMediaRight = media && media.position === "right";
  const showMediaBackground = media && media.position === "background";

  const renderFieldContent = () => {
    switch (field.type) {
      case "text":
      case "email":
      case "phone":
        return (
          <div className={mode === "card" ? "space-y-6" : "space-y-2"}>
            <QuestionLabel htmlFor={field.id} mode={mode}>
              {displayLabel}
              {requiredMark}
            </QuestionLabel>
            <Input
              id={field.id}
              type={
                field.type === "email"
                  ? "email"
                  : field.type === "phone"
                    ? "tel"
                    : "text"
              }
              placeholder={displayPlaceholder}
              value={stringValue}
              onChange={(e) => onChange(e.target.value)}
              required={field.required}
              disabled={disabled}
              className={
                mode === "card"
                  ? "h-12 text-base"
                  : error
                    ? "border-destructive"
                    : ""
              }
              autoFocus={mode === "card"}
              aria-invalid={!!error}
              aria-describedby={error ? `${field.id}-error` : undefined}
            />
            {error && (
              <div
                id={`${field.id}-error`}
                className="text-sm text-destructive"
                role="alert"
              >
                {error}
              </div>
            )}
          </div>
        );

      case "textarea":
        return (
          <div className={mode === "card" ? "space-y-6" : "space-y-2"}>
            <QuestionLabel htmlFor={field.id} mode={mode}>
              {displayLabel}
              {requiredMark}
            </QuestionLabel>
            <Textarea
              id={field.id}
              placeholder={displayPlaceholder}
              value={stringValue}
              onChange={(e) => onChange(e.target.value)}
              required={field.required}
              disabled={disabled}
              rows={mode === "card" ? 4 : 3}
              className={
                mode === "card"
                  ? "text-base resize-none"
                  : error
                    ? "border-destructive"
                    : ""
              }
              autoFocus={mode === "card"}
              aria-invalid={!!error}
              aria-describedby={error ? `${field.id}-error` : undefined}
            />
            {error && (
              <div
                id={`${field.id}-error`}
                className="text-sm text-destructive"
                role="alert"
              >
                {error}
              </div>
            )}
          </div>
        );

      case "select":
        return (
          <div className={mode === "card" ? "space-y-6" : "space-y-2"}>
            <QuestionLabel htmlFor={field.id} mode={mode}>
              {displayLabel}
              {requiredMark}
            </QuestionLabel>
            <Select
              value={stringValue}
              onValueChange={(val) => onChange(val)}
              disabled={disabled}
            >
              <SelectTrigger
                className={mode === "card" ? "h-12 text-base" : ""}
                aria-invalid={!!error}
                aria-describedby={error ? `${field.id}-error` : undefined}
              >
                <SelectValue
                  placeholder={displayPlaceholder || "Select an option"}
                />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && (
              <div
                id={`${field.id}-error`}
                className="text-sm text-destructive"
                role="alert"
              >
                {error}
              </div>
            )}
          </div>
        );

      case "radio":
        return (
          <div className={mode === "card" ? "space-y-6" : "space-y-2"}>
            <QuestionLabel mode={mode}>
              {displayLabel}
              {requiredMark}
            </QuestionLabel>
            <RadioGroup
              value={stringValue}
              onValueChange={(val) => onChange(val)}
              disabled={disabled}
              className={
                mode === "card"
                  ? "grid grid-cols-2 gap-3"
                  : "flex flex-col gap-2"
              }
              aria-invalid={!!error}
              aria-describedby={error ? `${field.id}-error` : undefined}
            >
              {field.options?.map((option) => (
                <div
                  key={option}
                  className={
                    mode === "card"
                      ? "flex items-center space-x-3 rounded-lg border p-4 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 transition-colors"
                      : "flex items-center space-x-2"
                  }
                >
                  <RadioGroupItem
                    value={option}
                    id={`${field.id}-${option}`}
                    className="flex-shrink-0"
                  />
                  <Label
                    htmlFor={`${field.id}-${option}`}
                    className={
                      mode === "card"
                        ? "flex-1 cursor-pointer font-normal text-base"
                        : "flex-1 cursor-pointer font-normal text-sm"
                    }
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {error && (
              <div
                id={`${field.id}-error`}
                className="text-sm text-destructive"
                role="alert"
              >
                {error}
              </div>
            )}
          </div>
        );

      case "checkbox": {
        const selectedValues = (value as string[] | undefined) || [];
        return (
          <div className={mode === "card" ? "space-y-6" : "space-y-2"}>
            <Label
              className={
                mode === "card"
                  ? "text-xl font-medium text-center block"
                  : "text-sm font-medium"
              }
            >
              {displayLabel}
              {requiredMark}
            </Label>
            <div
              className={
                mode === "card" ? "flex flex-col gap-3" : "flex flex-col gap-2"
              }
            >
              {field.options?.map((option) => (
                <div
                  key={option}
                  className={
                    mode === "card"
                      ? "flex items-center space-x-3 rounded-lg border p-4 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 transition-colors"
                      : "flex items-center space-x-2"
                  }
                >
                  <Checkbox
                    id={`${field.id}-${option}`}
                    checked={selectedValues.includes(option)}
                    onCheckedChange={(checked) =>
                      onCheckboxChange?.(option, checked === true)
                    }
                    disabled={disabled}
                    className="flex-shrink-0"
                  />
                  <Label
                    htmlFor={`${field.id}-${option}`}
                    className={
                      mode === "card"
                        ? "flex-1 cursor-pointer font-normal text-base"
                        : "flex-1 cursor-pointer font-normal text-sm"
                    }
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </div>
            {error && (
              <div
                id={`${field.id}-error`}
                className="text-sm text-destructive"
                role="alert"
              >
                {error}
              </div>
            )}
          </div>
        );
      }

      case "file":
      case "image":
        return (
          <div className={mode === "card" ? "space-y-6" : "space-y-2"}>
            <QuestionLabel htmlFor={field.id} mode={mode}>
              {displayLabel}
              {requiredMark}
            </QuestionLabel>
            <Input
              id={field.id}
              type="file"
              accept={field.type === "image" ? "image/*" : undefined}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && onFileUpload) {
                  onFileUpload(file);
                }
              }}
              required={field.required && !uploadedFile}
              disabled={disabled || uploading}
              className={
                mode === "card"
                  ? "h-12 text-base file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium"
                  : error
                    ? "border-destructive"
                    : ""
              }
              aria-invalid={!!error}
              aria-describedby={error ? `${field.id}-error` : undefined}
            />
            {uploading && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Uploading...
              </div>
            )}
            {uploadedFile && (
              <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">
                  {Array.isArray(uploadedFile)
                    ? uploadedFile.map((f) => f.name).join(", ")
                    : uploadedFile.originalName}
                </span>
                {field.type === "image" &&
                  !Array.isArray(uploadedFile) &&
                  uploadedFile.url && (
                    <div className="mt-2 w-full">
                      <Image
                        src={uploadedFile.url}
                        alt="Uploaded"
                        width={320}
                        height={128}
                        className="max-w-full h-auto max-h-32 object-contain rounded border"
                      />
                    </div>
                  )}
              </div>
            )}
            {error && (
              <div
                id={`${field.id}-error`}
                className="text-sm text-destructive"
                role="alert"
              >
                {error}
              </div>
            )}
          </div>
        );

      case "statement":
        return (
          <div className={mode === "card" ? "text-center" : ""}>
            <div
              className={
                mode === "card"
                  ? "text-xl md:text-2xl font-medium"
                  : "text-base font-medium"
              }
            >
              {displayLabel}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const fieldContent = renderFieldContent();

  if (!fieldContent) return null;

  // Media rendering (card mode only)
  if (mode === "card") {
    if (showMediaBackground) {
      return (
        <div className="relative">
          {media && <MediaRenderer media={media} />}
          <div className="relative z-10">{fieldContent}</div>
        </div>
      );
    }

    if (showMediaLeft || showMediaRight) {
      return (
        <div
          className={`flex gap-4 items-start ${
            showMediaLeft ? "flex-row" : "flex-row-reverse"
          }`}
        >
          {media && (
            <div className="flex-shrink-0">
              <MediaRenderer media={media} />
            </div>
          )}
          <div className="flex-1">{fieldContent}</div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {showMediaAbove && media && <MediaRenderer media={media} />}
        {fieldContent}
        {showMediaBelow && media && <MediaRenderer media={media} />}
      </div>
    );
  }

  // Simple mode - no media support
  return <div className="space-y-2">{fieldContent}</div>;
}
