"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingsTimeEditor } from "@/components/admin/bookings-time-editor";
import { toast } from "sonner";
import type { UpdateUserDto } from "@/lib/api";
import type { UserProfile } from "@/lib/api/endpoints/admin-auth";

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
  onSubmit: (id: number, data: UpdateUserDto) => Promise<void>;
}

export function EditUserDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
}: EditUserDialogProps) {
  const [formData, setFormData] = useState<UpdateUserDto>({
    name: "",
    email: "",
    role: "user",
    company: "",
    isActive: true,
    bookingEnabled: 1,
    bookingsTime: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company || "",
        isActive: user.isActive,
        bookingEnabled: user.bookingEnabled || 1,
        bookingsTime:
          (
            user as UserProfile & {
              bookingsTime?: Array<{
                date: string;
                slots: string[];
              }> | null;
            }
          ).bookingsTime || null,
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (!formData.name?.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!formData.email?.trim()) {
      toast.error("Email is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(user.id, formData);
    } catch {
      // Error is handled by the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    field: keyof UpdateUserDto,
    value: string | boolean | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and booking availability
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="availability">
                Booking Availability
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter user name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter user email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-company">Company</Label>
                <Input
                  id="edit-company"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  placeholder="Enter company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleInputChange("role", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    handleInputChange("isActive", checked)
                  }
                />
                <Label htmlFor="edit-active">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-booking-enabled"
                  checked={formData.bookingEnabled === 1}
                  onCheckedChange={(checked) =>
                    handleInputChange("bookingEnabled", checked ? 1 : 0)
                  }
                />
                <Label htmlFor="edit-booking-enabled">
                  Enable Booking Functionality
                </Label>
              </div>
            </TabsContent>

            <TabsContent value="availability" className="space-y-4 mt-4">
              {formData.bookingEnabled === 1 ? (
                <BookingsTimeEditor
                  value={formData.bookingsTime}
                  onChange={(value) =>
                    handleInputChange(
                      "bookingsTime",
                      value as unknown as string | number | boolean
                    )
                  }
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Enable booking functionality to manage availability</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
