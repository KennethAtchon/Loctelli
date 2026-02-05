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
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle } from "lucide-react";
import Image from "next/image";
import type { FormField, CardMedia } from "@/lib/forms/types";
import { applyPiping } from "@/lib/forms/conditional-logic";

export interface CardFieldRendererProps {
  field: FormField;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
  onCheckboxChange?: (option: string, checked: boolean) => void;
  onFileUpload?: (fieldId: string, file: File) => Promise<void>;
  uploading?: boolean;
  uploadedFile?: { url: string; originalName: string };
  disabled?: boolean;
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
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <Label htmlFor={htmlFor} className="text-2xl font-medium text-center block">
      {children}
    </Label>
  );
}

export function CardFieldRenderer({
  field,
  value,
  onChange,
  onCheckboxChange,
  onFileUpload,
  uploading = false,
  uploadedFile,
  disabled,
  allFields = [],
  formData = {},
}: CardFieldRendererProps) {
  const stringValue = (value as string | undefined) ?? "";
  const requiredMark = field.required ? (
    <span className="text-destructive ml-0.5">*</span>
  ) : null;

  // Apply piping if enabled
  const displayLabel = field.enablePiping
    ? applyPiping(field.label, formData, allFields)
    : field.label;
  const displayPlaceholder =
    field.enablePiping && field.placeholder
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
          <div className="space-y-6">
            <QuestionLabel htmlFor={field.id}>
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
              className="h-12 text-base"
              autoFocus
            />
          </div>
        );

      case "textarea":
        return (
          <div className="space-y-6">
            <QuestionLabel htmlFor={field.id}>
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
              rows={4}
              className="text-base resize-none"
              autoFocus
            />
          </div>
        );

      case "select":
        return (
          <div className="space-y-6">
            <QuestionLabel htmlFor={field.id}>
              {displayLabel}
              {requiredMark}
            </QuestionLabel>
            <Select
              value={stringValue}
              onValueChange={(val) => onChange(val)}
              disabled={disabled}
            >
              <SelectTrigger className="h-12 text-base">
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
          </div>
        );

      case "radio":
        return (
          <div className="space-y-6">
            <QuestionLabel>
              {displayLabel}
              {requiredMark}
            </QuestionLabel>
            <RadioGroup
              value={stringValue}
              onValueChange={(val) => onChange(val)}
              disabled={disabled}
              className="grid grid-cols-2 gap-3"
            >
              {field.options?.map((option) => (
                <div
                  key={option}
                  className="flex items-center space-x-3 rounded-lg border p-4 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 transition-colors"
                >
                  <RadioGroupItem
                    value={option}
                    id={`${field.id}-${option}`}
                    className="flex-shrink-0"
                  />
                  <Label
                    htmlFor={`${field.id}-${option}`}
                    className="flex-1 cursor-pointer font-normal text-base"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case "checkbox": {
        const selectedValues = (value as string[] | undefined) || [];
        return (
          <div className="space-y-6">
            <Label className="text-xl font-medium text-center block">
              {displayLabel}
              {requiredMark}
            </Label>
            <div className="flex flex-col gap-3">
              {field.options?.map((option) => (
                <div
                  key={option}
                  className="flex items-center space-x-3 rounded-lg border p-4 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 transition-colors"
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
                    className="flex-1 cursor-pointer font-normal text-base"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "file":
      case "image":
        return (
          <div className="space-y-6">
            <QuestionLabel htmlFor={field.id}>
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
                  onFileUpload(field.id, file);
                }
              }}
              required={field.required && !uploadedFile}
              disabled={disabled || uploading}
              className="h-12 text-base file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium"
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
                <span className="truncate">{uploadedFile.originalName}</span>
                {field.type === "image" && uploadedFile.url && (
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
          </div>
        );

      case "statement":
        return (
          <div className="text-center">
            <div className="text-xl md:text-2xl font-medium">{displayLabel}</div>
          </div>
        );

      default:
        return null;
    }
  };

  const fieldContent = renderFieldContent();

  if (!fieldContent) return null;

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
        className={`flex gap-4 items-start ${showMediaLeft ? "flex-row" : "flex-row-reverse"}`}
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
