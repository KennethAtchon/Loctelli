"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2, X, Loader2 } from "lucide-react";
import type {
  FlowchartNode,
  FlowchartNodeData,
} from "@/lib/forms/flowchart-types";
import type { CardMedia } from "@/lib/forms/types";
import type { FormField, ConditionalLogic } from "@/lib/forms/types";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { LogicBuilder } from "./logic-builder";

const fieldTypes = [
  { value: "text", label: "Text Input" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "textarea", label: "Text Area" },
  { value: "select", label: "Select Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "radio", label: "Radio Buttons" },
  { value: "file", label: "File Upload" },
  { value: "image", label: "Image Upload" },
];

export interface CardSettingsPanelProps {
  node: FlowchartNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (nodeId: string, updates: Partial<FlowchartNodeData>) => void;
  onDelete?: (nodeId: string) => void;
  formSlug?: string;
  /** All fields in the form (for conditional logic reference) */
  allFields?: FormField[];
}

export function CardSettingsPanel({
  node,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  formSlug,
  allFields = [],
}: CardSettingsPanelProps) {
  const { toast } = useToast();
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState<string>("text");
  const [required, setRequired] = useState(false);
  const [placeholder, setPlaceholder] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");
  const [statementText, setStatementText] = useState("");
  const [media, setMedia] = useState<CardMedia | undefined>(undefined);
  const [mediaType, setMediaType] = useState<
    "image" | "video" | "gif" | "icon"
  >("image");
  const [mediaPosition, setMediaPosition] = useState<
    "above" | "below" | "background" | "left" | "right"
  >("above");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaAltText, setMediaAltText] = useState("");
  const [videoType, setVideoType] = useState<"youtube" | "vimeo" | "upload">(
    "youtube"
  );
  const [videoId, setVideoId] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [enablePiping, setEnablePiping] = useState(false);
  const [conditionalLogic, setConditionalLogic] = useState<
    ConditionalLogic | undefined
  >(undefined);
  const [isSuccessCard, setIsSuccessCard] = useState(false);

  useEffect(() => {
    if (!node) return;
    const data = node.data ?? {};
    if (node.type === "statement") {
      setStatementText(data.statementText || data.label || "");
      setIsSuccessCard(data.isSuccessCard ?? false);
    } else if (node.type === "question") {
      const field = data.field;
      setLabel(field?.label || data.label || "");
      setFieldType(field?.type || data.fieldType || "text");
      setRequired(field?.required || false);
      setPlaceholder(field?.placeholder || "");
      setOptions(field?.options || []);
      setEnablePiping(field?.enablePiping || false);
      setConditionalLogic(field?.conditionalLogic);
    }
    // Load media settings
    if (data.media) {
      setMedia(data.media);
      setMediaType(data.media.type);
      setMediaPosition(data.media.position);
      setMediaUrl(data.media.url || "");
      setMediaAltText(data.media.altText || "");
      setVideoType(data.media.videoType || "youtube");
      setVideoId(data.media.videoId || "");
    } else {
      setMedia(undefined);
      setMediaUrl("");
      setMediaAltText("");
    }
  }, [node]);

  const handleMediaUpload = async (file: File) => {
    if (!formSlug) {
      toast({
        title: "Form Not Saved",
        description:
          "Please save the form first before uploading files. You can use a URL instead, or save the form and try again.",
        variant: "destructive",
      });
      return;
    }
    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fieldId", `media_${node?.id || Date.now()}`);
      const result = await api.forms.uploadAdminFile(formSlug, formData);
      setMediaUrl(result.url);
      toast({
        title: "Success",
        description: "Media uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to upload media",
        variant: "destructive",
      });
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleSave = () => {
    if (!node) return;
    const updates: Partial<FlowchartNodeData> = {};
    if (node.type === "statement") {
      updates.statementText = statementText;
      updates.label = statementText;
      updates.isSuccessCard = isSuccessCard;
    } else if (node.type === "question") {
      const field: FormField = {
        id: node.data?.fieldId || node.id,
        type: fieldType as FormField["type"],
        label,
        required,
        placeholder: placeholder || undefined,
        options: ["select", "radio", "checkbox"].includes(fieldType)
          ? options
          : undefined,
        enablePiping,
        conditionalLogic: conditionalLogic,
      };
      updates.field = field;
      updates.label = label;
      updates.fieldType = fieldType;
      updates.fieldId = field.id;
    }
    // Save media if configured
    if (mediaUrl || (mediaType === "video" && videoId)) {
      updates.media = {
        type: mediaType,
        url: mediaUrl || undefined,
        altText: mediaAltText || undefined,
        position: mediaPosition,
        videoType: mediaType === "video" ? videoType : undefined,
        videoId: mediaType === "video" && videoId ? videoId : undefined,
      };
    } else if (!mediaUrl && !videoId) {
      updates.media = undefined;
    }
    onUpdate(node.id, updates);
  };

  const addOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions([...options, newOption.trim()]);
      setNewOption("");
    }
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  if (!node) return null;

  const isQuestion = node.type === "question";
  const isStatement = node.type === "statement";
  const needsOptions = ["select", "radio", "checkbox"].includes(fieldType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>
            {isStatement ? "Statement Settings" : "Question Settings"}
          </DialogTitle>
          <DialogDescription>
            Configure this card's content and behavior
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6 p-6 pt-4">
          {isStatement ? (
            <>
              <div>
                <Label htmlFor="statement-text">Statement Text</Label>
                <Textarea
                  id="statement-text"
                  value={statementText}
                  onChange={(e) => setStatementText(e.target.value)}
                  placeholder="Enter the statement text..."
                  rows={4}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-success-card"
                  checked={isSuccessCard}
                  onCheckedChange={setIsSuccessCard}
                />
                <Label htmlFor="is-success-card">
                  Show this card after form submission
                </Label>
              </div>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="field-type">Field Type</Label>
                <Select value={fieldType} onValueChange={setFieldType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="label">Question Label *</Label>
                <Input
                  id="label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="What is your name?"
                />
              </div>

              {fieldType !== "checkbox" && (
                <div>
                  <Label htmlFor="placeholder">Placeholder</Label>
                  <Input
                    id="placeholder"
                    value={placeholder}
                    onChange={(e) => setPlaceholder(e.target.value)}
                    placeholder="Enter placeholder text..."
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="required"
                  checked={required}
                  onCheckedChange={setRequired}
                />
                <Label htmlFor="required">Required field</Label>
              </div>

              {needsOptions && (
                <div>
                  <Label>Options</Label>
                  <div className="space-y-2 mt-2">
                    {options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input value={opt} readOnly />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <Input
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addOption();
                          }
                        }}
                        placeholder="Add option..."
                      />
                      <Button type="button" onClick={addOption}>
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Conditional Logic & Piping Section */}
          {isQuestion && (
            <div className="pt-4 border-t space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enable-piping"
                  checked={enablePiping}
                  onCheckedChange={setEnablePiping}
                />
                <Label htmlFor="enable-piping">
                  Enable piping (use {"{{fieldId}}"} in labels to insert
                  previous answers)
                </Label>
              </div>

              <div className="space-y-4">
                <Label>Conditional Logic</Label>
                <LogicBuilder
                  fields={allFields.filter(
                    (f) => f.id !== (node.data?.fieldId || node.id)
                  )}
                  value={conditionalLogic?.showIf}
                  onChange={(showIf) =>
                    setConditionalLogic({
                      ...conditionalLogic,
                      showIf,
                    })
                  }
                  label="Show this field if"
                />
              </div>
            </div>
          )}

          {/* Media Section */}
          <div className="pt-4 border-t space-y-4">
            <div className="flex items-center justify-between">
              <Label>Card Media</Label>
              {media && mediaUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMedia(undefined);
                    setMediaUrl("");
                    setMediaAltText("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Position selector - always visible */}
            <div>
              <Label htmlFor="media-position">Position</Label>
              <Select
                value={mediaPosition}
                onValueChange={(v) =>
                  setMediaPosition(v as typeof mediaPosition)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">Above Question</SelectItem>
                  <SelectItem value="below">Below Question</SelectItem>
                  <SelectItem value="background">Background</SelectItem>
                  <SelectItem value="left">Left Side</SelectItem>
                  <SelectItem value="right">Right Side</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!mediaUrl ? (
              <>
                <div>
                  <Label htmlFor="media-type">Media Type</Label>
                  <Select
                    value={mediaType}
                    onValueChange={(v) => setMediaType(v as typeof mediaType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="gif">GIF</SelectItem>
                      <SelectItem value="icon">Icon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {mediaType === "image" || mediaType === "gif" ? (
                  <div>
                    <Label htmlFor="media-upload">
                      Upload {mediaType === "gif" ? "GIF" : "Image"}
                    </Label>
                    {!formSlug && (
                      <p className="text-sm text-muted-foreground mt-1 mb-2">
                        Please save the form first to enable file uploads. You
                        can also enter a URL below instead.
                      </p>
                    )}
                    <div className="mt-2">
                      <Input
                        id="media-upload"
                        type="file"
                        accept={mediaType === "gif" ? "image/gif" : "image/*"}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleMediaUpload(file);
                        }}
                        disabled={uploadingMedia || !formSlug}
                      />
                      {uploadingMedia && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading...
                        </div>
                      )}
                      {!formSlug && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          File upload disabled: Form must be saved first
                        </p>
                      )}
                    </div>
                    <div className="mt-2">
                      <Label htmlFor="media-url">Or enter URL</Label>
                      <Input
                        id="media-url"
                        type="url"
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                ) : mediaType === "video" ? (
                  <>
                    <div>
                      <Label htmlFor="video-type">Video Source</Label>
                      <Select
                        value={videoType}
                        onValueChange={(v) =>
                          setVideoType(v as typeof videoType)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="youtube">YouTube</SelectItem>
                          <SelectItem value="vimeo">Vimeo</SelectItem>
                          <SelectItem value="upload">Upload Video</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {videoType === "upload" ? (
                      <div>
                        <Label htmlFor="video-upload">Upload Video</Label>
                        {!formSlug && (
                          <p className="text-sm text-muted-foreground mt-1 mb-2">
                            Please save the form first to enable file uploads.
                          </p>
                        )}
                        <Input
                          id="video-upload"
                          type="file"
                          accept="video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleMediaUpload(file);
                          }}
                          disabled={uploadingMedia || !formSlug}
                        />
                        {!formSlug && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            File upload disabled: Form must be saved first
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <Label htmlFor="video-id">
                          {videoType === "youtube"
                            ? "YouTube Video ID"
                            : "Vimeo Video ID"}
                        </Label>
                        <Input
                          id="video-id"
                          value={videoId}
                          onChange={(e) => setVideoId(e.target.value)}
                          placeholder={
                            videoType === "youtube"
                              ? "dQw4w9WgXcQ"
                              : "123456789"
                          }
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {videoType === "youtube"
                            ? "Enter the video ID from the YouTube URL (e.g., dQw4w9WgXcQ from youtube.com/watch?v=dQw4w9WgXcQ)"
                            : "Enter the video ID from the Vimeo URL"}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <Label htmlFor="icon-url">Icon URL</Label>
                    <Input
                      id="icon-url"
                      type="url"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="https://example.com/icon.svg"
                    />
                  </div>
                )}

                {mediaUrl && (
                  <>
                    {(mediaType === "image" || mediaType === "gif") && (
                      <div>
                        <Label htmlFor="media-alt">Alt Text</Label>
                        <Input
                          id="media-alt"
                          value={mediaAltText}
                          onChange={(e) => setMediaAltText(e.target.value)}
                          placeholder="Describe the image for accessibility"
                        />
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="space-y-2">
                {mediaType === "image" || mediaType === "gif" ? (
                  <div className="w-full h-48 border rounded-lg overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                    <img
                      src={mediaUrl}
                      alt={mediaAltText || "Card media"}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : mediaType === "video" &&
                  videoType === "youtube" &&
                  videoId ? (
                  <div className="aspect-video border rounded-lg overflow-hidden">
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                ) : mediaType === "video" &&
                  videoType === "vimeo" &&
                  videoId ? (
                  <div className="aspect-video border rounded-lg overflow-hidden">
                    <iframe
                      src={`https://player.vimeo.com/video/${videoId}`}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                ) : mediaType === "video" && videoType === "upload" ? (
                  <div className="aspect-video border rounded-lg overflow-hidden">
                    <video src={mediaUrl} controls className="w-full h-full" />
                  </div>
                ) : null}
                <p className="text-sm text-muted-foreground">
                  Position: {mediaPosition}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-4 border-t">
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
            {onDelete && node.type !== "start" && node.type !== "end" && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  onDelete(node.id);
                  onOpenChange(false);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
