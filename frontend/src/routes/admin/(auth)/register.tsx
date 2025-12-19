import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAdminAuth } from "@/contexts/unified-auth-context";
import type { AdminRegisterDto } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Shield,
  UserPlus,
  ChevronRight,
  Building2,
  Loader2,
} from "lucide-react";
import logger from "@/lib/logger";
import { ROUTES } from "@/lib/routes";

export const Route = createFileRoute(ROUTES.ADMIN.ADMIN_REGISTER)({
  component: AdminRegisterPage,
});

function AdminRegisterPage() {
  const navigate = useNavigate();
  const { adminRegister } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });
  const [formData, setFormData] = useState<AdminRegisterDto>({
    name: "",
    email: "",
    password: "",
    authCode: "",
    role: "admin",
  });

  // Real-time password validation
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setFormData({ ...formData, password });

    setPasswordValidation({
      hasMinLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    logger.debug("🔐 Admin register form submitted:", {
      email: formData.email,
    });

    // Prevent multiple submissions
    if (isLoading) {
      logger.debug("🚫 Form already submitting, ignoring");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await adminRegister(formData);
      logger.debug("✅ Admin registration successful");
      setSuccess(
        "Admin registration successful! You have been automatically logged in.",
      );

      // Clear form
      setFormData({
        name: "",
        email: "",
        password: "",
        authCode: "",
        role: "admin",
      });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate({ to: "/admin/dashboard" });
      }, 2000);
    } catch (error) {
      logger.error("❌ Admin registration failed:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.";
      setError(errorMessage);
      logger.debug("📝 Set error message:", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 dark:from-slate-950 dark:via-blue-950 dark:to-slate-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgo8cGF0aCBkPSJNIDEwIDAgTCAwIDAgMCAxMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiIG9wYWNpdHk9IjAuMSIvPgo8L3BhdHRlcm4+CjwvZGVmcz4KPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPgo8L3N2Zz4=")`,
        }}
      ></div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Logo and Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Admin Registration
            </h1>
            <p className="text-blue-200/80 text-sm">
              Create your admin account
            </p>
          </div>
        </div>

        <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl w-full">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <UserPlus className="w-5 h-5 text-blue-400" />
              <CardTitle className="text-white text-center">
                Create Admin Account
              </CardTitle>
            </div>
            <CardDescription className="text-blue-200/70 text-center">
              Enter your details to register
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {error && (
                <Alert
                  variant="destructive"
                  className="border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
                >
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-white text-sm font-medium"
                >
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter your full name"
                  disabled={isLoading}
                  className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/60"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-white text-sm font-medium"
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="admin@example.com"
                  disabled={isLoading}
                  className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/60"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-white text-sm font-medium"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handlePasswordChange}
                    placeholder="Enter your password"
                    disabled={isLoading}
                    className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/60"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-200/60 hover:text-blue-200"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Password Validation */}
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-blue-200/80 mb-2">
                      Password Requirements:
                    </p>
                    <div className="space-y-1">
                      {[
                        {
                          key: "hasMinLength",
                          label: "At least 8 characters",
                          valid: passwordValidation.hasMinLength,
                        },
                        {
                          key: "hasUppercase",
                          label: "At least one uppercase letter",
                          valid: passwordValidation.hasUppercase,
                        },
                        {
                          key: "hasLowercase",
                          label: "At least one lowercase letter",
                          valid: passwordValidation.hasLowercase,
                        },
                        {
                          key: "hasNumber",
                          label: "At least one number",
                          valid: passwordValidation.hasNumber,
                        },
                        {
                          key: "hasSpecialChar",
                          label: "At least one special character",
                          valid: passwordValidation.hasSpecialChar,
                        },
                      ].map((req) => (
                        <div
                          key={req.key}
                          className={`flex items-center text-xs ${
                            req.valid ? "text-green-400" : "text-blue-200/60"
                          }`}
                        >
                          {req.valid ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {req.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="authCode"
                  className="text-white text-sm font-medium"
                >
                  Authorization Code
                </Label>
                <Input
                  id="authCode"
                  name="authCode"
                  type="text"
                  required
                  value={formData.authCode}
                  onChange={(e) =>
                    setFormData({ ...formData, authCode: e.target.value })
                  }
                  placeholder="Enter authorization code"
                  disabled={isLoading}
                  className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/60"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="role"
                  className="text-white text-sm font-medium"
                >
                  Role
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value as any })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Admin Account
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/admin/login"
                className="text-sm text-blue-300 hover:text-blue-200 transition-colors"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
