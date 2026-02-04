import { mock } from "bun:test";
import { UsersApi } from "@/lib/api/endpoints/users";
import { User, CreateUserDto } from "@/types";
import { ApiClient } from "@/lib/api/client";

// Mock removed - use Bun mocks instead"@/lib/logger", () => ({
  default: {
    debug: mock(),
    info: mock(),
    warn: mock(),
    error: mock(),
  },
}));

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

describe("UsersApi", () => {
  let usersApi: UsersApi;

  beforeEach(() => {
    usersApi = new UsersApi(mockClient);
  });

  describe("getUsers", () => {
    it("should call get users endpoint", async () => {
      const mockUsers: User[] = [
        {
          id: 1,
          name: "Test User",
          email: "test@example.com",
          role: "USER",
          isActive: true,
          bookingEnabled: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: "Another User",
          email: "another@example.com",
          role: "USER",
          isActive: true,
          bookingEnabled: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockGet.mockResolvedValue(mockUsers);

      const result = await usersApi.getUsers();

      expect(mockGet).toHaveBeenCalledWith("/user");
      expect(result).toEqual(mockUsers);
    });

    it("should handle get users error", async () => {
      const error = new Error("Failed to fetch users");
      mockGet.mockRejectedValue(error);

      await expect(usersApi.getUsers()).rejects.toThrow(
        "Failed to fetch users"
      );
      expect(mockGet).toHaveBeenCalledWith("/user");
    });
  });

  describe("getUser", () => {
    it("should call get user by id endpoint", async () => {
      const mockUser: User = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        role: "USER",
        isActive: true,
        bookingEnabled: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGet.mockResolvedValue(mockUser);

      const result = await usersApi.getUser(1);

      expect(mockGet).toHaveBeenCalledWith("/user/1");
      expect(result).toEqual(mockUser);
    });

    it("should handle get user error", async () => {
      const error = new Error("User not found");
      mockGet.mockRejectedValue(error);

      await expect(usersApi.getUser(999)).rejects.toThrow("User not found");
      expect(mockGet).toHaveBeenCalledWith("/user/999");
    });
  });

  describe("createUser", () => {
    it("should call create user endpoint with correct data", async () => {
      const createUserData: CreateUserDto = {
        name: "New User",
        email: "newuser@example.com",
        password: "password123",
      };

      const mockCreatedUser: User = {
        id: 3,
        name: "New User",
        email: "newuser@example.com",
        role: "USER",
        isActive: true,
        bookingEnabled: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPost.mockResolvedValue(mockCreatedUser);

      const result = await usersApi.createUser(createUserData);

      expect(mockPost).toHaveBeenCalledWith("/user", createUserData);
      expect(result).toEqual(mockCreatedUser);
    });

    it("should handle create user error", async () => {
      const createUserData: CreateUserDto = {
        name: "New User",
        email: "existing@example.com",
        password: "password123",
      };

      const error = new Error("Email already exists");
      mockPost.mockRejectedValue(error);

      await expect(usersApi.createUser(createUserData)).rejects.toThrow(
        "Email already exists"
      );
      expect(mockPost).toHaveBeenCalledWith("/user", createUserData);
    });
  });

  describe("updateUser", () => {
    it("should call update user endpoint with correct data", async () => {
      const updateData = {
        name: "Updated User",
        email: "updated@example.com",
      };

      const mockUpdatedUser: User = {
        id: 1,
        name: "Updated User",
        email: "updated@example.com",
        role: "USER",
        isActive: true,
        bookingEnabled: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPatch.mockResolvedValue(mockUpdatedUser);

      const result = await usersApi.updateUser(1, updateData);

      expect(mockPatch).toHaveBeenCalledWith("/user/1", updateData);
      expect(result).toEqual(mockUpdatedUser);
    });

    it("should handle update user error", async () => {
      const updateData = {
        email: "invalid-email",
      };

      const error = new Error("Invalid email format");
      mockPatch.mockRejectedValue(error);

      await expect(usersApi.updateUser(1, updateData)).rejects.toThrow(
        "Invalid email format"
      );
      expect(mockPatch).toHaveBeenCalledWith("/user/1", updateData);
    });

    it("should handle partial updates", async () => {
      const updateData = {
        name: "Only Name Update",
      };

      const mockUpdatedUser: User = {
        id: 1,
        name: "Only Name Update",
        email: "test@example.com",
        role: "USER",
        isActive: true,
        bookingEnabled: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPatch.mockResolvedValue(mockUpdatedUser);

      const result = await usersApi.updateUser(1, updateData);

      expect(mockPatch).toHaveBeenCalledWith("/user/1", updateData);
      expect(result).toEqual(mockUpdatedUser);
    });
  });

  describe("deleteUser", () => {
    it("should call delete user endpoint", async () => {
      mockDelete.mockResolvedValue(undefined);

      await usersApi.deleteUser(1);

      expect(mockDelete).toHaveBeenCalledWith("/user/1");
    });

    it("should handle delete user error", async () => {
      const error = new Error("User not found");
      mockDelete.mockRejectedValue(error);

      await expect(usersApi.deleteUser(999)).rejects.toThrow("User not found");
      expect(mockDelete).toHaveBeenCalledWith("/user/999");
    });
  });

  describe("Type Safety", () => {
    it("should enforce correct User structure", () => {
      const validUser: User = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        role: "USER",
        isActive: true,
        bookingEnabled: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(validUser).toHaveProperty("id");
      expect(validUser).toHaveProperty("name");
      expect(validUser).toHaveProperty("email");
      expect(validUser).toHaveProperty("role");
      expect(validUser).toHaveProperty("isActive");
      expect(validUser).toHaveProperty("bookingEnabled");
      expect(validUser).toHaveProperty("createdAt");
      expect(validUser).toHaveProperty("updatedAt");
    });

    it("should enforce correct CreateUserDto structure", () => {
      const validCreateUserDto: CreateUserDto = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      expect(validCreateUserDto).toHaveProperty("name");
      expect(validCreateUserDto).toHaveProperty("email");
      expect(validCreateUserDto).toHaveProperty("password");
    });
  });
});
