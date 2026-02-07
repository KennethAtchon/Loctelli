"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import {
  profileSchema,
  passwordSchema,
  type ProfileFormValues,
  type PasswordFormValues,
} from "@/lib/forms/schemas";
import { useAdminAuth } from "@/contexts/unified-auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { User, Lock, Save, Shield, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AdminAccount {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export default function AdminSettingsPage() {
  const { admin, refreshAdmin } = useAdminAuth();

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", email: "" },
  });
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  // Admin accounts management state
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [isDeletingAdmin, setIsDeletingAdmin] = useState<number | null>(null);

  useEffect(() => {
    if (admin) {
      profileForm.reset({
        name: admin.name || "",
        email: admin.email || "",
      });
    }

    if (admin?.role === "super_admin") {
      loadAdminAccounts();
    }
  }, [admin, profileForm]);

  const loadAdminAccounts = async () => {
    try {
      setIsLoadingAdmins(true);
      const accounts = await api.adminAuth.getAllAdminAccounts();
      setAdminAccounts(accounts);
    } catch {
      toast.error("Failed to load admin accounts");
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  const onProfileSubmit = profileForm.handleSubmit(async (data) => {
    try {
      await api.adminAuth.updateAdminProfile(data);
      await refreshAdmin();
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    }
  });

  const onPasswordSubmit = passwordForm.handleSubmit(async (data) => {
    try {
      await api.adminAuth.changeAdminPassword({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      passwordForm.reset({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Password changed successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to change password"
      );
    }
  });

  const handleDeleteAdmin = async (adminId: number) => {
    if (adminId === admin?.id) {
      toast.error("You cannot delete your own account");
      return;
    }

    try {
      setIsDeletingAdmin(adminId);
      await api.adminAuth.deleteAdminAccount(adminId);
      toast.success("Admin account deleted successfully");
      loadAdminAccounts(); // Refresh the list
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete admin account"
      );
    } finally {
      setIsDeletingAdmin(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";

    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Settings</h1>
        <p className="text-gray-600">
          Manage admin settings and configurations
        </p>
        {admin && (
          <div className="mt-2 flex items-center gap-2">
            <Badge
              variant={admin.role === "super_admin" ? "default" : "secondary"}
            >
              {admin.role === "super_admin" ? "Super Admin" : "Admin"}
            </Badge>
            <span className="text-sm text-gray-500">
              {admin.role === "super_admin"
                ? "Full system access"
                : "Standard admin access"}
            </span>
          </div>
        )}
      </div>

      {/* Profile Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Settings
          </CardTitle>
          <CardDescription>
            Update your personal information and account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...profileForm}>
            <form onSubmit={onProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                {profileForm.formState.isSubmitting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Update Profile
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your account password for enhanced security
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={onPasswordSubmit} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="oldPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPasswords.old ? "text" : "password"}
                          placeholder="Enter current password"
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() =>
                            setShowPasswords((prev) => ({ ...prev, old: !prev.old }))
                          }
                        >
                          {showPasswords.old ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPasswords.new ? "text" : "password"}
                            placeholder="Enter new password"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            onClick={() =>
                              setShowPasswords((prev) => ({ ...prev, new: !prev.new }))
                            }
                          >
                            {showPasswords.new ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <p className="text-xs text-gray-500">
                        Must be at least 12 characters with uppercase, lowercase,
                        number, and special character
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPasswords.confirm ? "text" : "password"}
                            placeholder="Confirm new password"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            onClick={() =>
                              setShowPasswords((prev) => ({
                                ...prev,
                                confirm: !prev.confirm,
                              }))
                            }
                          >
                            {showPasswords.confirm ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
              {passwordForm.formState.isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
              ) : (
                <Lock className="h-4 w-4 mr-2" />
              )}
              Change Password
            </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Super Admin Only Section */}
      {admin?.role === "super_admin" && (
        <>
          <Separator />

          {/* Admin Accounts Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Admin Accounts
                <Badge variant="default">Super Admin Only</Badge>
              </CardTitle>
              <CardDescription>
                View and manage all admin accounts in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAdmins ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span className="ml-2">Loading admin accounts...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminAccounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">
                            {account.name}
                          </TableCell>
                          <TableCell>{account.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                account.role === "super_admin"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {account.role === "super_admin"
                                ? "Super Admin"
                                : "Admin"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                account.isActive ? "default" : "destructive"
                              }
                            >
                              {account.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDate(account.lastLoginAt)}
                          </TableCell>
                          <TableCell>{formatDate(account.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            {account.id !== admin?.id && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={isDeletingAdmin === account.id}
                                  >
                                    {isDeletingAdmin === account.id ? (
                                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Admin Account
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete the admin
                                      account for{" "}
                                      <strong>{account.name}</strong> (
                                      {account.email})?
                                      <br />
                                      <br />
                                      This action cannot be undone and will
                                      immediately revoke all access for this
                                      admin.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDeleteAdmin(account.id)
                                      }
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete Account
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {adminAccounts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No admin accounts found.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Regular Admin Information */}
      {admin?.role !== "super_admin" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              System Administration
            </CardTitle>
            <CardDescription>
              Information about admin privileges and system access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Your Access Level</h3>
              <p className="text-xs text-gray-600">
                As a regular admin, you have access to user management, system
                monitoring, and your own profile settings. System-level
                configurations and admin account management are restricted to
                super administrators.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Available Features</h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Manage user accounts and permissions</li>
                <li>• Monitor system activity and statistics</li>
                <li>• Update your profile information</li>
                <li>• Change your account password</li>
                <li>• Access lead and booking management</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Need More Access?</h3>
              <p className="text-xs text-gray-600">
                If you need access to system-level configurations or admin
                account management, please contact a super administrator. Super
                admins can manage admin accounts and perform system-wide
                administrative tasks.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
