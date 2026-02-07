"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { SubAccount, UpdateSubAccountDto } from "@/lib/api";
import {
  editSubAccountFormSchema,
  type EditSubAccountFormValues,
} from "@/lib/forms/schemas";

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
  const form = useForm<EditSubAccountFormValues>({
    resolver: zodResolver(editSubAccountFormSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
      settings: {},
    },
  });

  useEffect(() => {
    if (subAccount) {
      form.reset({
        name: subAccount.name,
        description: subAccount.description || "",
        isActive: subAccount.isActive,
        settings: subAccount.settings || {},
      });
    }
  }, [subAccount, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!subAccount) return;
    try {
      await onSubmit(subAccount.id, data as UpdateSubAccountDto);
    } catch {
      // Error is handled by the parent component
    }
  });

  const isSubmitting = form.formState.isSubmitting;
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
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter SubAccount name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter description (optional)"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <FormLabel className="text-base">Active</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
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
        </Form>
      </DialogContent>
    </Dialog>
  );
}
