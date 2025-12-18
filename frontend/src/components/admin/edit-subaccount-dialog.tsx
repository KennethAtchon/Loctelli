import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { SubAccount, UpdateSubAccountDto } from "@/lib/api";

interface EditSubAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subAccount: SubAccount | null;
  onSubmit: (id: number, data: UpdateSubAccountDto) => Promise<void>;
}

export function EditSubAccountDialog({
  open,
  onOpenChange,
  subAccount,
  onSubmit,
}: EditSubAccountDialogProps) {
  const [formData, setFormData] = useState<UpdateSubAccountDto>({
    name: "",
    description: "",
    isActive: true,
    settings: {},
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (subAccount) {
      setFormData({
        name: subAccount.name,
        description: subAccount.description || "",
        isActive: subAccount.isActive,
        settings: subAccount.settings || {},
      });
    }
  }, [subAccount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subAccount) return;

    if (!formData.name?.trim()) {
      toast.error("SubAccount name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(subAccount.id, formData);
    } catch {
      // Error is handled by the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    field: keyof UpdateSubAccountDto,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!subAccount) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit SubAccount</DialogTitle>
          <DialogDescription>
            Update SubAccount information and settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name || ""}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter SubAccount name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter description (optional)"
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive || false}
              onCheckedChange={(checked) =>
                handleInputChange("isActive", checked)
              }
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update SubAccount"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

