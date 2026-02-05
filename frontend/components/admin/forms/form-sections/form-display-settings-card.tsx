"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FormDisplaySettingsCardProps {
  title: string;
  subtitle: string;
  submitButtonText?: string;
  successMessage?: string;
  isCardForm: boolean;
  onTitleChange: (title: string) => void;
  onSubtitleChange: (subtitle: string) => void;
  onSubmitButtonTextChange?: (text: string) => void;
  onSuccessMessageChange?: (message: string) => void;
}

export function FormDisplaySettingsCard({
  title,
  subtitle,
  submitButtonText,
  successMessage,
  isCardForm,
  onTitleChange,
  onSubtitleChange,
  onSubmitButtonTextChange,
  onSuccessMessageChange,
}: FormDisplaySettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Display Settings</CardTitle>
        <CardDescription>How the form appears to users</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title">Form Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Title shown to users"
          />
        </div>
        <div>
          <Label htmlFor="subtitle">Subtitle</Label>
          <Input
            id="subtitle"
            value={subtitle}
            onChange={(e) => onSubtitleChange(e.target.value)}
            placeholder="Optional subtitle or description"
          />
        </div>
        {!isCardForm && onSubmitButtonTextChange && onSuccessMessageChange && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="submitButtonText">Submit Button Text</Label>
              <Input
                id="submitButtonText"
                value={submitButtonText || ""}
                onChange={(e) => onSubmitButtonTextChange(e.target.value)}
                placeholder="Submit"
              />
            </div>
            <div>
              <Label htmlFor="successMessage">Success Message</Label>
              <Input
                id="successMessage"
                value={successMessage || ""}
                onChange={(e) => onSuccessMessageChange(e.target.value)}
                placeholder="Thank you for your submission!"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
