import { mock } from "bun:test";
import {
  AdminAuthApi,
  AdminLoginDto,
  AdminRegisterDto,
  AdminProfile,
  AdminAuthResponse,
  UserProfile,
  CreateUserDto,
  UpdateUserDto,
  DashboardStats,
  SystemStatus,
  DetailedUser,
  DetailedLead,
  UpdateAdminProfileDto,
  ChangeAdminPasswordDto,
} from "@/lib/api/endpoints/admin-auth";
import { ApiClient } from "@/lib/api/client";

// Mock the logger
// Mock removed - use Bun mocks instead

const mockGet = mock();
const mockPost = mock();
const mockPut = mock();
const mockPatch = mock();
const mockDelete = mock();

let mockClient: ApiClient;

beforeAll(() => {
  mockClient = {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    patch: mockPatch,
    delete: mockDelete,
  } as unknown as ApiClient;
});

beforeEach(() => {
  // Bun mocks cleared automatically
});

describe("AdminAuthApi", () => {
  let adminAuthApi: AdminAuthApi;

  beforeEach(() => {
    // Create a new instance
    adminAuthApi = new AdminAuthApi(mockClient);
  });

  describe("adminLogin", () => {
    it("should call admin login endpoint with correct data", async () => {
      const loginData: AdminLoginDto = {
        email: "admin@example.com",
        password: "adminpassword123",
      };

      const mockResponse: AdminAuthResponse = {
        access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        refresh_token: "refresh_token_123",
        admin: {
          id: 1,
          name: "Admin User",
          email: "admin@example.com",
          role: "SUPER_ADMIN",
          permissions: {
            users: "read_write",
            strategies: "read_write",
          },
          isActive: true,
          lastLoginAt: "2024-01-01T12:00:00Z",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      };

      mockPost.mockResolvedValue(mockResponse);

      const result = await adminAuthApi.adminLogin(loginData);

      expect(mockPost).toHaveBeenCalledWith("/admin/auth/login", loginData);
      expect(result).toEqual(mockResponse);
      expect(result.access_token).toBeDefined();
      expect(result.refresh_token).toBeDefined();
      expect(result.admin).toBeDefined();
    });

    it("should handle admin login error", async () => {
      const loginData: AdminLoginDto = {
        email: "invalid@example.com",
        password: "wrongpassword",
      };

      const error = new Error("Invalid credentials");
      mockPost.mockRejectedValue(error);

      await expect(adminAuthApi.adminLogin(loginData)).rejects.toThrow(
        "Invalid credentials"
      );
      expect(mockPost).toHaveBeenCalledWith("/admin/auth/login", loginData);
    });
  });

  describe("adminRegister", () => {
    it("should call admin register endpoint with correct data", async () => {
      const registerData: AdminRegisterDto = {
        name: "New Admin",
        email: "newadmin@example.com",
        password: "newpassword123",
        role: "ADMIN",
        permissions: { users: "read", strategies: "read_write" },
        authCode: "AUTH123",
      };

      const mockResponse: Omit<
        AdminProfile,
        "lastLoginAt" | "createdAt" | "updatedAt"
      > = {
        id: 2,
        name: "New Admin",
        email: "newadmin@example.com",
        role: "ADMIN",
        permissions: { users: "read", strategies: "read_write" },
        isActive: true,
      };

      mockPost.mockResolvedValue(mockResponse);

      const result = await adminAuthApi.adminRegister(registerData);

      expect(mockPost).toHaveBeenCalledWith(
        "/admin/auth/register",
        registerData
      );
      expect(result).toEqual(mockResponse);
      expect(result.id).toBe(2);
      expect(result.isActive).toBe(true);
    });

    it("should handle admin register error", async () => {
      const registerData: AdminRegisterDto = {
        name: "New Admin",
        email: "existing@example.com",
        password: "password123",
        authCode: "INVALID_CODE",
      };

      const error = new Error("Invalid auth code");
      mockPost.mockRejectedValue(error);

      await expect(adminAuthApi.adminRegister(registerData)).rejects.toThrow(
        "Invalid auth code"
      );
      expect(mockPost).toHaveBeenCalledWith(
        "/admin/auth/register",
        registerData
      );
    });
  });

  describe("adminRefreshToken", () => {
    it("should call admin refresh token endpoint", async () => {
      const refreshToken = "refresh_token_123";
      const mockResponse = {
        access_token: "new_access_token_456",
        refresh_token: "new_refresh_token_456",
      };

      mockPost.mockResolvedValue(mockResponse);

      const result = await adminAuthApi.adminRefreshToken(refreshToken);

      expect(mockPost).toHaveBeenCalledWith("/admin/auth/refresh", {
        refresh_token: refreshToken,
      });
      expect(result).toEqual(mockResponse);
      expect(result.access_token).toBeDefined();
      expect(result.refresh_token).toBeDefined();
    });

    it("should handle refresh token error", async () => {
      const refreshToken = "invalid_refresh_token";
      const error = new Error("Invalid refresh token");
      mockPost.mockRejectedValue(error);

      await expect(
        adminAuthApi.adminRefreshToken(refreshToken)
      ).rejects.toThrow("Invalid refresh token");
      expect(mockPost).toHaveBeenCalledWith("/admin/auth/refresh", {
        refresh_token: refreshToken,
      });
    });
  });

  describe("adminLogout", () => {
    it("should call admin logout endpoint", async () => {
      const mockResponse = { message: "Successfully logged out" };
      mockPost.mockResolvedValue(mockResponse);

      const result = await adminAuthApi.adminLogout();

      expect(mockPost).toHaveBeenCalledWith("/admin/auth/logout");
      expect(result).toEqual(mockResponse);
      expect(result.message).toBe("Successfully logged out");
    });

    it("should handle logout error", async () => {
      const error = new Error("Logout failed");
      mockPost.mockRejectedValue(error);

      await expect(adminAuthApi.adminLogout()).rejects.toThrow("Logout failed");
      expect(mockPost).toHaveBeenCalledWith("/admin/auth/logout");
    });
  });

  describe("getAdminProfile", () => {
    it("should call get admin profile endpoint", async () => {
      const mockProfile: AdminProfile = {
        id: 1,
        name: "Admin User",
        email: "admin@example.com",
        role: "SUPER_ADMIN",
        permissions: {
          users: "read_write",
          strategies: "read_write",
        },
        isActive: true,
        lastLoginAt: "2024-01-01T12:00:00Z",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockGet.mockResolvedValue(mockProfile);

      const result = await adminAuthApi.getAdminProfile();

      expect(mockGet).toHaveBeenCalledWith("/admin/auth/profile");
      expect(result).toEqual(mockProfile);
      expect(result.id).toBe(1);
      expect(result.isActive).toBe(true);
    });

    it("should handle get admin profile error", async () => {
      const error = new Error("Profile not found");
      mockGet.mockRejectedValue(error);

      await expect(adminAuthApi.getAdminProfile()).rejects.toThrow(
        "Profile not found"
      );
      expect(mockGet).toHaveBeenCalledWith("/admin/auth/profile");
    });
  });

  describe("updateAdminProfile", () => {
    it("should call update admin profile endpoint", async () => {
      const updateData: UpdateAdminProfileDto = {
        name: "Updated Admin Name",
        email: "updated@example.com",
      };

      const mockUpdatedProfile: AdminProfile = {
        id: 1,
        name: "Updated Admin Name",
        email: "updated@example.com",
        role: "SUPER_ADMIN",
        permissions: {
          users: "read_write",
          strategies: "read_write",
        },
        isActive: true,
        lastLoginAt: "2024-01-01T12:00:00Z",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockPut.mockResolvedValue(mockUpdatedProfile);

      const result = await adminAuthApi.updateAdminProfile(updateData);

      expect(mockPut).toHaveBeenCalledWith("/admin/auth/profile", updateData);
      expect(result).toEqual(mockUpdatedProfile);
      expect(result.name).toBe("Updated Admin Name");
      expect(result.email).toBe("updated@example.com");
    });

    it("should handle update admin profile error", async () => {
      const updateData: UpdateAdminProfileDto = {
        email: "invalid-email",
      };

      const error = new Error("Invalid email format");
      mockPut.mockRejectedValue(error);

      await expect(adminAuthApi.updateAdminProfile(updateData)).rejects.toThrow(
        "Invalid email format"
      );
      expect(mockPut).toHaveBeenCalledWith("/admin/auth/profile", updateData);
    });
  });

  describe("changeAdminPassword", () => {
    it("should call change admin password endpoint", async () => {
      const passwordData: ChangeAdminPasswordDto = {
        oldPassword: "oldpassword123",
        newPassword: "newpassword123",
      };

      const mockResponse = {
        message: "Password changed successfully",
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await adminAuthApi.changeAdminPassword(passwordData);

      expect(mockPost).toHaveBeenCalledWith(
        "/admin/auth/change-password",
        passwordData
      );
      expect(result).toEqual(mockResponse);
      expect(result.message).toBe("Password changed successfully");
    });

    it("should handle change password error", async () => {
      const passwordData: ChangeAdminPasswordDto = {
        oldPassword: "wrongpassword",
        newPassword: "newpassword123",
      };

      const error = new Error("Invalid old password");
      mockPost.mockRejectedValue(error);

      await expect(
        adminAuthApi.changeAdminPassword(passwordData)
      ).rejects.toThrow("Invalid old password");
      expect(mockPost).toHaveBeenCalledWith(
        "/admin/auth/change-password",
        passwordData
      );
    });
  });

  describe("getAllUsers", () => {
    it("should call get all users endpoint", async () => {
      const mockUsers: UserProfile[] = [
        {
          id: 1,
          name: "User One",
          email: "user1@example.com",
          role: "USER",
          company: "Company A",
          isActive: true,
          bookingEnabled: 1,
          lastLoginAt: "2024-01-01T12:00:00Z",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          createdByAdmin: {
            id: 1,
            name: "Admin User",
            email: "admin@example.com",
          },
        },
        {
          id: 2,
          name: "User Two",
          email: "user2@example.com",
          role: "USER",
          company: "Company B",
          isActive: false,
          bookingEnabled: 0,
          lastLoginAt: null,
          createdAt: "2024-01-02T00:00:00Z",
          updatedAt: "2024-01-02T00:00:00Z",
          createdByAdmin: null,
        },
      ];

      mockGet.mockResolvedValue(mockUsers);

      const result = await adminAuthApi.getAllUsers();

      expect(mockGet).toHaveBeenCalledWith("/admin/auth/users");
      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });

    it("should handle get all users error", async () => {
      const error = new Error("Failed to fetch users");
      mockGet.mockRejectedValue(error);

      await expect(adminAuthApi.getAllUsers()).rejects.toThrow(
        "Failed to fetch users"
      );
      expect(mockGet).toHaveBeenCalledWith("/admin/auth/users");
    });
  });

  describe("createUser", () => {
    it("should call create user endpoint", async () => {
      const createData: CreateUserDto = {
        name: "New User",
        email: "newuser@example.com",
        password: "password123",
        company: "New Company",
        role: "USER",
        bookingEnabled: 1,
      };

      const mockResponse: Omit<
        UserProfile,
        "lastLoginAt" | "createdAt" | "updatedAt" | "createdByAdmin"
      > = {
        id: 3,
        name: "New User",
        email: "newuser@example.com",
        role: "USER",
        company: "New Company",
        isActive: true,
        bookingEnabled: 1,
      };

      mockPost.mockResolvedValue(mockResponse);

      const result = await adminAuthApi.createUser(createData);

      expect(mockPost).toHaveBeenCalledWith("/admin/auth/users", createData);
      expect(result).toEqual(mockResponse);
      expect(result.id).toBe(3);
      expect(result.isActive).toBe(true);
    });

    it("should handle create user error", async () => {
      const createData: CreateUserDto = {
        name: "New User",
        email: "existing@example.com",
        password: "password123",
      };

      const error = new Error("Email already exists");
      mockPost.mockRejectedValue(error);

      await expect(adminAuthApi.createUser(createData)).rejects.toThrow(
        "Email already exists"
      );
      expect(mockPost).toHaveBeenCalledWith("/admin/auth/users", createData);
    });
  });

  describe("updateUser", () => {
    it("should call update user endpoint", async () => {
      const userId = 1;
      const updateData: UpdateUserDto = {
        name: "Updated User Name",
        email: "updated@example.com",
        company: "Updated Company",
        isActive: false,
        bookingEnabled: 0,
      };

      const mockResponse: Omit<UserProfile, "createdByAdmin"> = {
        id: 1,
        name: "Updated User Name",
        email: "updated@example.com",
        role: "USER",
        company: "Updated Company",
        isActive: false,
        bookingEnabled: 0,
        lastLoginAt: "2024-01-01T12:00:00Z",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockPut.mockResolvedValue(mockResponse);

      const result = await adminAuthApi.updateUser(userId, updateData);

      expect(mockPut).toHaveBeenCalledWith(
        `/admin/auth/users/${userId}`,
        updateData
      );
      expect(result).toEqual(mockResponse);
      expect(result.name).toBe("Updated User Name");
      expect(result.isActive).toBe(false);
    });

    it("should handle update user error", async () => {
      const userId = 999;
      const updateData: UpdateUserDto = {
        name: "Updated User Name",
      };

      const error = new Error("User not found");
      mockPut.mockRejectedValue(error);

      await expect(adminAuthApi.updateUser(userId, updateData)).rejects.toThrow(
        "User not found"
      );
      expect(mockPut).toHaveBeenCalledWith(
        `/admin/auth/users/${userId}`,
        updateData
      );
    });
  });

  describe("deleteUser", () => {
    it("should call delete user endpoint", async () => {
      const userId = 1;
      const mockResponse = { message: "User deleted successfully" };
      mockDelete.mockResolvedValue(mockResponse);

      const result = await adminAuthApi.deleteUser(userId);

      expect(mockDelete).toHaveBeenCalledWith(`/admin/auth/users/${userId}`);
      expect(result).toEqual(mockResponse);
      expect(result.message).toBe("User deleted successfully");
    });

    it("should handle delete user error", async () => {
      const userId = 999;
      const error = new Error("User not found");
      mockDelete.mockRejectedValue(error);

      await expect(adminAuthApi.deleteUser(userId)).rejects.toThrow(
        "User not found"
      );
      expect(mockDelete).toHaveBeenCalledWith(`/admin/auth/users/${userId}`);
    });
  });

  describe("generateAuthCode", () => {
    it("should call generate auth code endpoint", async () => {
      const mockResponse = {
        authCode: "AUTH123456",
        message: "Auth code generated successfully",
        expiresIn: "1 hour",
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await adminAuthApi.generateAuthCode();

      expect(mockPost).toHaveBeenCalledWith("/admin/auth/generate-auth-code");
      expect(result).toEqual(mockResponse);
      expect(result.authCode).toBeDefined();
      expect(result.message).toBe("Auth code generated successfully");
    });

    it("should handle generate auth code error", async () => {
      const error = new Error("Failed to generate auth code");
      mockPost.mockRejectedValue(error);

      await expect(adminAuthApi.generateAuthCode()).rejects.toThrow(
        "Failed to generate auth code"
      );
      expect(mockPost).toHaveBeenCalledWith("/admin/auth/generate-auth-code");
    });
  });

  describe("getCurrentAuthCode", () => {
    it("should call get current auth code endpoint", async () => {
      const mockResponse = {
        authCode: "CURRENT123",
        message: "Current auth code retrieved",
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await adminAuthApi.getCurrentAuthCode();

      expect(mockGet).toHaveBeenCalledWith("/admin/auth/current-auth-code");
      expect(result).toEqual(mockResponse);
      expect(result.authCode).toBeDefined();
      expect(result.message).toBe("Current auth code retrieved");
    });

    it("should handle get current auth code error", async () => {
      const error = new Error("No auth code available");
      mockGet.mockRejectedValue(error);

      await expect(adminAuthApi.getCurrentAuthCode()).rejects.toThrow(
        "No auth code available"
      );
      expect(mockGet).toHaveBeenCalledWith("/admin/auth/current-auth-code");
    });
  });

  describe("getAllAdminAccounts", () => {
    it("should call get all admin accounts endpoint", async () => {
      const mockAdmins: AdminProfile[] = [
        {
          id: 1,
          name: "Super Admin",
          email: "superadmin@example.com",
          role: "SUPER_ADMIN",
          permissions: {
            users: "read_write",
            strategies: "read_write",
            admin: "read_write",
          },
          isActive: true,
          lastLoginAt: "2024-01-01T12:00:00Z",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          name: "Regular Admin",
          email: "admin@example.com",
          role: "ADMIN",
          permissions: {
            users: "read_write",
            strategies: "read_write",
          },
          isActive: true,
          lastLoginAt: "2024-01-02T12:00:00Z",
          createdAt: "2024-01-02T00:00:00Z",
          updatedAt: "2024-01-02T00:00:00Z",
        },
      ];

      mockGet.mockResolvedValue(mockAdmins);

      const result = await adminAuthApi.getAllAdminAccounts();

      expect(mockGet).toHaveBeenCalledWith("/admin/auth/accounts");
      expect(result).toEqual(mockAdmins);
      expect(result).toHaveLength(2);
      expect(result[0].role).toBe("SUPER_ADMIN");
      expect(result[1].role).toBe("ADMIN");
    });

    it("should handle get all admin accounts error", async () => {
      const error = new Error("Failed to fetch admin accounts");
      mockGet.mockRejectedValue(error);

      await expect(adminAuthApi.getAllAdminAccounts()).rejects.toThrow(
        "Failed to fetch admin accounts"
      );
      expect(mockGet).toHaveBeenCalledWith("/admin/auth/accounts");
    });
  });

  describe("deleteAdminAccount", () => {
    it("should call delete admin account endpoint", async () => {
      const adminId = 2;
      const mockResponse = {
        message: "Admin account deleted successfully",
      };
      mockDelete.mockResolvedValue(mockResponse);

      const result = await adminAuthApi.deleteAdminAccount(adminId);

      expect(mockDelete).toHaveBeenCalledWith(
        `/admin/auth/accounts/${adminId}`
      );
      expect(result).toEqual(mockResponse);
      expect(result.message).toBe("Admin account deleted successfully");
    });

    it("should handle delete admin account error", async () => {
      const adminId = 1;
      const error = new Error("Cannot delete super admin account");
      mockDelete.mockRejectedValue(error);

      await expect(adminAuthApi.deleteAdminAccount(adminId)).rejects.toThrow(
        "Cannot delete super admin account"
      );
      expect(mockDelete).toHaveBeenCalledWith(
        `/admin/auth/accounts/${adminId}`
      );
    });
  });

  describe("getDashboardStats", () => {
    it("should call get dashboard stats endpoint", async () => {
      const mockStats: DashboardStats = {
        totalUsers: 150,
        activeUsers: 120,
        totalStrategies: 45,
        totalBookings: 89,
        totalLeads: 234,
        recentUsers: [
          {
            id: 1,
            name: "Recent User 1",
            email: "recent1@example.com",
            isActive: true,
            createdAt: "2024-01-01T00:00:00Z",
            company: "Company A",
          },
          {
            id: 2,
            name: "Recent User 2",
            email: "recent2@example.com",
            isActive: false,
            createdAt: "2024-01-02T00:00:00Z",
            company: null,
          },
        ],
        growthRates: {
          users: 15.5,
          activeUsers: 12.3,
          strategies: 8.7,
          bookings: 22.1,
        },
      };

      mockGet.mockResolvedValue(mockStats);

      const result = await adminAuthApi.getDashboardStats();

      expect(mockGet).toHaveBeenCalledWith("/general/dashboard-stats");
      expect(result).toEqual(mockStats);
      expect(result.totalUsers).toBe(150);
      expect(result.recentUsers).toHaveLength(2);
      expect(result.growthRates.users).toBe(15.5);
    });

    it("should handle get dashboard stats error", async () => {
      const error = new Error("Failed to fetch dashboard stats");
      mockGet.mockRejectedValue(error);

      await expect(adminAuthApi.getDashboardStats()).rejects.toThrow(
        "Failed to fetch dashboard stats"
      );
      expect(mockGet).toHaveBeenCalledWith("/general/dashboard-stats");
    });
  });

  describe("getSystemStatus", () => {
    it("should call get system status endpoint", async () => {
      const mockSystemStatus: SystemStatus = {
        database: "healthy",
        apiServer: "healthy",
        redisCache: "healthy",
        fileStorage: "healthy",
      };

      mockGet.mockResolvedValue(mockSystemStatus);

      const result = await adminAuthApi.getSystemStatus();

      expect(mockGet).toHaveBeenCalledWith("/general/system-status");
      expect(result).toEqual(mockSystemStatus);
      expect(result.database).toBe("healthy");
      expect(result.apiServer).toBe("healthy");
    });

    it("should handle system status with issues", async () => {
      const mockSystemStatus: SystemStatus = {
        database: "healthy",
        apiServer: "degraded",
        redisCache: "down",
        fileStorage: "healthy",
      };

      mockGet.mockResolvedValue(mockSystemStatus);

      const result = await adminAuthApi.getSystemStatus();

      expect(mockGet).toHaveBeenCalledWith("/general/system-status");
      expect(result).toEqual(mockSystemStatus);
      expect(result.apiServer).toBe("degraded");
      expect(result.redisCache).toBe("down");
    });

    it("should handle get system status error", async () => {
      const error = new Error("Failed to fetch system status");
      mockGet.mockRejectedValue(error);

      await expect(adminAuthApi.getSystemStatus()).rejects.toThrow(
        "Failed to fetch system status"
      );
      expect(mockGet).toHaveBeenCalledWith("/general/system-status");
    });
  });

  describe("getRecentLeads", () => {
    it("should call get recent leads endpoint", async () => {
      const mockLeads: DetailedLead[] = [
        {
          id: 1,
          name: "Lead One",
          email: "lead1@example.com",
          phone: "+1234567890",
          company: "Company A",
          position: "Manager",
          customId: "LEAD001",
          status: "active",
          notes: "Interested in our services",
          lastMessage: "Hello, I would like to learn more",
          lastMessageDate: "2024-01-01T12:00:00Z",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          user: {
            id: 1,
            name: "User One",
            email: "user1@example.com",
          },
          strategy: {
            id: 1,
            name: "Strategy A",
            tag: "sales",
          },
          bookings: [
            {
              id: 1,
              bookingType: "consultation",
              status: "confirmed",
              createdAt: "2024-01-01T10:00:00Z",
            },
          ],
        },
        {
          id: 2,
          name: "Lead Two",
          email: "lead2@example.com",
          status: "inactive",
          createdAt: "2024-01-02T00:00:00Z",
          updatedAt: "2024-01-02T00:00:00Z",
        },
      ];

      mockGet.mockResolvedValue(mockLeads);

      const result = await adminAuthApi.getRecentLeads();

      expect(mockGet).toHaveBeenCalledWith("/general/recent-leads");
      expect(result).toEqual(mockLeads);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });

    it("should handle get recent leads error", async () => {
      const error = new Error("Failed to fetch recent leads");
      mockGet.mockRejectedValue(error);

      await expect(adminAuthApi.getRecentLeads()).rejects.toThrow(
        "Failed to fetch recent leads"
      );
      expect(mockGet).toHaveBeenCalledWith("/general/recent-leads");
    });
  });

  describe("getDetailedUser", () => {
    it("should call get detailed user endpoint", async () => {
      const userId = 1;
      const mockUser: DetailedUser = {
        id: 1,
        name: "User One",
        email: "user1@example.com",
        role: "USER",
        isActive: true,
        company: "Company A",
        budget: "$5000",
        bookingsTime: { timezone: "UTC" },
        bookingEnabled: 1,
        calendarId: "calendar123",
        locationId: "location456",
        assignedUserId: "user789",
        lastLoginAt: "2024-01-01T12:00:00Z",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        createdByAdminId: 1,
        createdByAdmin: {
          id: 1,
          name: "Admin User",
          email: "admin@example.com",
        },
        strategies: [
          {
            id: 1,
            name: "Strategy A",
            tag: "sales",
            tone: "professional",
          },
        ],
        leads: [
          {
            id: 1,
            name: "Lead One",
            email: "lead1@example.com",
            status: "active",
          },
        ],
        bookings: [
          {
            id: 1,
            bookingType: "consultation",
            status: "confirmed",
            createdAt: "2024-01-01T10:00:00Z",
          },
        ],
      };

      mockGet.mockResolvedValue(mockUser);

      const result = await adminAuthApi.getDetailedUser(userId);

      expect(mockGet).toHaveBeenCalledWith(`/general/users/${userId}/detailed`);
      expect(result).toEqual(mockUser);
      expect(result.id).toBe(1);
      expect(result.strategies).toHaveLength(1);
      expect(result.leads).toHaveLength(1);
      expect(result.bookings).toHaveLength(1);
    });

    it("should handle get detailed user error", async () => {
      const userId = 999;
      const error = new Error("User not found");
      mockGet.mockRejectedValue(error);

      await expect(adminAuthApi.getDetailedUser(userId)).rejects.toThrow(
        "User not found"
      );
      expect(mockGet).toHaveBeenCalledWith(`/general/users/${userId}/detailed`);
    });
  });

  describe("getDetailedLead", () => {
    it("should call get detailed lead endpoint", async () => {
      const leadId = 1;
      const mockLead: DetailedLead = {
        id: 1,
        name: "Lead One",
        email: "lead1@example.com",
        phone: "+1234567890",
        company: "Company A",
        position: "Manager",
        customId: "LEAD001",
        status: "active",
        notes: "Interested in our services",
        lastMessage: "Hello, I would like to learn more",
        lastMessageDate: "2024-01-01T12:00:00Z",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        user: {
          id: 1,
          name: "User One",
          email: "user1@example.com",
        },
        strategy: {
          id: 1,
          name: "Strategy A",
          tag: "sales",
        },
        bookings: [
          {
            id: 1,
            bookingType: "consultation",
            status: "confirmed",
            createdAt: "2024-01-01T10:00:00Z",
          },
        ],
      };

      mockGet.mockResolvedValue(mockLead);

      const result = await adminAuthApi.getDetailedLead(leadId);

      expect(mockGet).toHaveBeenCalledWith(`/general/leads/${leadId}/detailed`);
      expect(result).toEqual(mockLead);
      expect(result.id).toBe(1);
      expect(result.user).toBeDefined();
      expect(result.strategy).toBeDefined();
      expect(result.bookings).toHaveLength(1);
    });

    it("should handle get detailed lead error", async () => {
      const leadId = 999;
      const error = new Error("Lead not found");
      mockGet.mockRejectedValue(error);

      await expect(adminAuthApi.getDetailedLead(leadId)).rejects.toThrow(
        "Lead not found"
      );
      expect(mockGet).toHaveBeenCalledWith(`/general/leads/${leadId}/detailed`);
    });
  });

  describe("Type Safety", () => {
    it("should enforce correct AdminLoginDto structure", () => {
      const validLoginData: AdminLoginDto = {
        email: "admin@example.com",
        password: "password123",
      };

      expect(validLoginData.email).toBe("admin@example.com");
      expect(validLoginData.password).toBe("password123");
    });

    it("should enforce correct AdminRegisterDto structure", () => {
      const validRegisterData: AdminRegisterDto = {
        name: "Admin User",
        email: "admin@example.com",
        password: "password123",
        role: "ADMIN",
        permissions: { users: "read_write" },
        authCode: "AUTH123",
      };

      expect(validRegisterData.name).toBe("Admin User");
      expect(validRegisterData.authCode).toBe("AUTH123");
    });

    it("should enforce correct AdminProfile structure", () => {
      const validProfile: AdminProfile = {
        id: 1,
        name: "Admin User",
        email: "admin@example.com",
        role: "SUPER_ADMIN",
        permissions: { users: "read_write" },
        isActive: true,
        lastLoginAt: "2024-01-01T12:00:00Z",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      expect(validProfile.id).toBe(1);
      expect(validProfile.isActive).toBe(true);
    });

    it("should enforce correct UserProfile structure", () => {
      const validUserProfile: UserProfile = {
        id: 1,
        name: "User One",
        email: "user@example.com",
        role: "USER",
        company: "Company A",
        isActive: true,
        bookingEnabled: 1,
        lastLoginAt: "2024-01-01T12:00:00Z",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        createdByAdmin: {
          id: 1,
          name: "Admin User",
          email: "admin@example.com",
        },
      };

      expect(validUserProfile.id).toBe(1);
      expect(validUserProfile.bookingEnabled).toBe(1);
    });
  });
});
