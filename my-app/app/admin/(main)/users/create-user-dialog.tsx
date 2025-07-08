'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { CreateUserDto } from '@/lib/api';
import type { SubAccount } from '@/lib/api/endpoints/admin-subaccounts';

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateUserDto) => Promise<void>;
  availableSubaccounts: SubAccount[];
}

export function CreateUserDialog({ open, onOpenChange, onSubmit, availableSubaccounts }: CreateUserDialogProps) {
  const [formData, setFormData] = useState<CreateUserDto>({
    name: '',
    email: '',
    password: '',
    company: '',
    role: 'user',
    bookingEnabled: 1,
    subAccountId: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    if (!formData.password.trim()) {
      toast.error('Password is required');
      return;
    }

    if (!formData.subAccountId || formData.subAccountId === 0) {
      toast.error('Please select a SubAccount');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({ name: '', email: '', password: '', company: '', role: 'user', bookingEnabled: 1, subAccountId: 0 });
    } catch (error) {
      // Error is handled by the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateUserDto, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user to the system
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter user name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter user email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              placeholder="Enter company name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
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
                          <div className="space-y-2">
                  <Label htmlFor="subaccount">SubAccount *</Label>
                  <Select 
                    value={formData.subAccountId?.toString() || ''} 
                    onValueChange={(value) => handleInputChange('subAccountId', parseInt(value) || 0)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a SubAccount" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubaccounts.map((subaccount) => (
                        <SelectItem key={subaccount.id} value={subaccount.id.toString()}>
                          {subaccount.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="booking-enabled"
              checked={formData.bookingEnabled === 1}
              onCheckedChange={(checked) => handleInputChange('bookingEnabled', checked ? 1 : 0)}
            />
            <Label htmlFor="booking-enabled">Enable Booking Functionality</Label>
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
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 