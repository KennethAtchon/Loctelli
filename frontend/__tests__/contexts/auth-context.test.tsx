import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  test,
  expect,
  describe,
  beforeEach,
  afterEach,
  beforeAll,
  mock,
  spyOn,
} from "bun:test";
import { UnifiedAuthProvider, useAuth } from "@/contexts/unified-auth-context";
import { api } from "@/lib/api";
import { AuthCookies } from "@/lib/cookies";
import { ApiClient } from "@/lib/api/client";

// Mock the logger
mock.module("@/lib/logger", () => ({
  __esModule: true,
  default: {
    debug: mock(() => {}),
    info: mock(() => {}),
    warn: mock(() => {}),
    error: mock(() => {}),
  },
}));

const mockGet = mock(() => {});
const mockPost = mock(() => {});
const mockPut = mock(() => {});
const mockPatch = mock(() => {});
const mockDelete = mock(() => {});

beforeAll(() => {
  (ApiClient.prototype as any).get = mockGet;
  (ApiClient.prototype as any).post = mockPost;
  (ApiClient.prototype as any).put = mockPut;
  (ApiClient.prototype as any).patch = mockPatch;
  (ApiClient.prototype as any).delete = mockDelete;
});

beforeEach(() => {
  mockGet.mockClear();
  mockPost.mockClear();
  mockPut.mockClear();
  mockPatch.mockClear();
  mockDelete.mockClear();
});

// Mock the API
const mockLogin = mock(() => {});
const mockRegister = mock(() => {});
const mockLogout = mock(() => {});
const mockGetProfile = mock(() => {});

mock.module("@/lib/api", () => ({
  api: {
    auth: {
      login: mockLogin,
      register: mockRegister,
      logout: mockLogout,
      getProfile: mockGetProfile,
    },
  },
}));

// Mock the cookies
const mockHasUserTokens = mock(() => {});
const mockSetAccessToken = mock(() => {});
const mockSetRefreshToken = mock(() => {});
const mockClearUserTokens = mock(() => {});
const mockClearAll = mock(() => {});

mock.module("@/lib/cookies", () => ({
  AuthCookies: {
    hasUserTokens: mockHasUserTokens,
    setAccessToken: mockSetAccessToken,
    setRefreshToken: mockSetRefreshToken,
    clearUserTokens: mockClearUserTokens,
    clearAll: mockClearAll,
  },
}));

// Test component to access auth context
const TestComponent = () => {
  const { user, isLoading, isAuthenticated, login, register, logout } =
    useAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="user-email">{user?.email || "no-user"}</div>
      <button
        onClick={() =>
          login({ email: "test@example.com", password: "password" })
        }
      >
        Login
      </button>
      <button
        onClick={() =>
          register({
            email: "new@example.com",
            password: "password",
            name: "Test User",
          })
        }
      >
        Register
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    mockLogin.mockClear();
    mockRegister.mockClear();
    mockLogout.mockClear();
    mockGetProfile.mockClear();
    mockHasUserTokens.mockClear();
    mockSetAccessToken.mockClear();
    mockSetRefreshToken.mockClear();
    mockClearUserTokens.mockClear();
    mockClearAll.mockClear();
  });

  describe("Initial State", () => {
    test("should start with loading state", async () => {
      mockHasUserTokens.mockReturnValue(false);

      render(
        <UnifiedAuthProvider>
          <TestComponent />
        </UnifiedAuthProvider>
      );

      // Wait for the auth check to complete
      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });
      expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    });

    test("should check for existing tokens on mount", async () => {
      mockHasUserTokens.mockReturnValue(false);

      render(
        <UnifiedAuthProvider>
          <TestComponent />
        </UnifiedAuthProvider>
      );

      await waitFor(() => {
        expect(mockHasUserTokens).toHaveBeenCalled();
      });
    });

    test("should auto-login if tokens exist", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        name: "Test User",
        role: "USER",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockHasUserTokens.mockReturnValue(true);
      mockGetProfile.mockResolvedValue(mockUser);

      render(
        <UnifiedAuthProvider>
          <TestComponent />
        </UnifiedAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
        expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
        expect(screen.getByTestId("user-email")).toHaveTextContent(
          "test@example.com"
        );
      });
    });

    test("should handle auth check timeout", async () => {
      mockHasUserTokens.mockReturnValue(true);
      mockGetProfile.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(
        <UnifiedAuthProvider>
          <TestComponent />
        </UnifiedAuthProvider>
      );

      // Wait for timeout (11 seconds)
      await new Promise((resolve) => setTimeout(resolve, 11000));

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
        expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
      });
    });
  });

  describe("Login", () => {
    test("should login successfully", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        name: "Test User",
        role: "USER",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const mockAuthResponse = {
        access_token: "access-token",
        refresh_token: "refresh-token",
        user: mockUser,
      };
      mockHasUserTokens.mockReturnValue(false);
      mockLogin.mockResolvedValue(mockAuthResponse);
      let authContext: any = null;
      const TestComponentWithRef = () => {
        const auth = useAuth();
        authContext = auth;
        return (
          <div>
            <div data-testid="loading">{auth.isLoading.toString()}</div>
            <div data-testid="authenticated">
              {auth.isAuthenticated.toString()}
            </div>
            <div data-testid="user-email">{auth.user?.email || "no-user"}</div>
          </div>
        );
      };
      render(
        <UnifiedAuthProvider>
          <TestComponentWithRef />
        </UnifiedAuthProvider>
      );
      await act(async () => {
        await authContext.login({
          email: "test@example.com",
          password: "password",
        });
      });
      expect(mockLogin).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password",
      });
      expect(mockSetAccessToken).toHaveBeenCalledWith("access-token");
      expect(mockSetRefreshToken).toHaveBeenCalledWith("refresh-token");
      expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
      expect(screen.getByTestId("user-email")).toHaveTextContent(
        "test@example.com"
      );
    });

    test("should handle login failure", async () => {
      const loginError = new Error("Invalid credentials");
      mockHasUserTokens.mockReturnValue(false);
      mockLogin.mockRejectedValue(loginError);
      let authContext: any = null;
      const TestComponentWithRef = () => {
        const auth = useAuth();
        authContext = auth;
        return <div />;
      };
      render(
        <UnifiedAuthProvider>
          <TestComponentWithRef />
        </UnifiedAuthProvider>
      );
      await expect(
        act(async () => {
          await authContext.login({
            email: "fail@example.com",
            password: "bad",
          });
        })
      ).rejects.toThrow("Invalid credentials");
      expect(mockLogin).toHaveBeenCalledWith({
        email: "fail@example.com",
        password: "bad",
      });
    });
  });

  describe("Register", () => {
    test("should register and auto-login successfully", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        name: "Test User",
        role: "USER",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const mockAuthResponse = {
        access_token: "access-token",
        refresh_token: "refresh-token",
        user: mockUser,
      };
      mockHasUserTokens.mockReturnValue(false);
      mockRegister.mockResolvedValue(undefined);
      mockLogin.mockResolvedValue(mockAuthResponse);
      let authContext: any = null;
      const TestComponentWithRef = () => {
        const auth = useAuth();
        authContext = auth;
        return (
          <div>
            <div data-testid="loading">{auth.isLoading.toString()}</div>
            <div data-testid="authenticated">
              {auth.isAuthenticated.toString()}
            </div>
            <div data-testid="user-email">{auth.user?.email || "no-user"}</div>
          </div>
        );
      };
      render(
        <UnifiedAuthProvider>
          <TestComponentWithRef />
        </UnifiedAuthProvider>
      );
      await act(async () => {
        await authContext.register({
          email: "test@example.com",
          password: "password",
          name: "Test User",
        });
      });
      expect(mockRegister).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password",
        name: "Test User",
      });
      expect(mockLogin).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password",
      });
      expect(mockSetAccessToken).toHaveBeenCalledWith("access-token");
      expect(mockSetRefreshToken).toHaveBeenCalledWith("refresh-token");
      expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
      expect(screen.getByTestId("user-email")).toHaveTextContent(
        "test@example.com"
      );
    });

    test("should handle registration failure", async () => {
      const registerError = new Error("Email already exists");
      mockHasUserTokens.mockReturnValue(false);
      mockRegister.mockRejectedValue(registerError);
      let authContext: any = null;
      const TestComponentWithRef = () => {
        const auth = useAuth();
        authContext = auth;
        return <div />;
      };
      render(
        <UnifiedAuthProvider>
          <TestComponentWithRef />
        </UnifiedAuthProvider>
      );
      await expect(
        act(async () => {
          await authContext.register({
            email: "fail@example.com",
            password: "bad",
            name: "Fail",
          });
        })
      ).rejects.toThrow("Email already exists");
      expect(mockRegister).toHaveBeenCalledWith({
        email: "fail@example.com",
        password: "bad",
        name: "Fail",
      });
    });
  });

  describe("Logout", () => {
    test("should logout successfully", async () => {
      mockHasUserTokens.mockReturnValue(false);
      mockLogout.mockResolvedValue(undefined);
      let authContext: any = null;
      const TestComponentWithRef = () => {
        const auth = useAuth();
        authContext = auth;
        return (
          <div>
            <div data-testid="loading">{auth.isLoading.toString()}</div>
            <div data-testid="authenticated">
              {auth.isAuthenticated.toString()}
            </div>
            <div data-testid="user-email">{auth.user?.email || "no-user"}</div>
          </div>
        );
      };
      render(
        <UnifiedAuthProvider>
          <TestComponentWithRef />
        </UnifiedAuthProvider>
      );
      await act(async () => {
        await authContext.logout();
      });
      expect(mockLogout).toHaveBeenCalled();
      expect(mockClearAll).toHaveBeenCalled();
      expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
      expect(screen.getByTestId("user-email")).toHaveTextContent("no-user");
    });

    test("should logout even if API call fails", async () => {
      mockHasUserTokens.mockReturnValue(false);
      mockLogout.mockRejectedValue(new Error("Logout failed"));
      let authContext: any = null;
      const TestComponentWithRef = () => {
        const auth = useAuth();
        authContext = auth;
        return <div />;
      };
      render(
        <UnifiedAuthProvider>
          <TestComponentWithRef />
        </UnifiedAuthProvider>
      );
      await act(async () => {
        await authContext.logout();
      });
      expect(mockLogout).toHaveBeenCalled();
      expect(mockClearAll).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    test("should clear tokens on auth errors", async () => {
      const authError = new Error("401 Unauthorized");
      mockHasUserTokens.mockReturnValue(true);
      mockGetProfile.mockRejectedValue(authError);

      render(
        <UnifiedAuthProvider>
          <TestComponent />
        </UnifiedAuthProvider>
      );

      await waitFor(() => {
        expect(mockClearUserTokens).toHaveBeenCalled();
        expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
      });
    });

    test("should keep tokens on network errors", async () => {
      const networkError = new Error("Failed to fetch");
      mockHasUserTokens.mockReturnValue(true);
      mockGetProfile.mockRejectedValue(networkError);

      render(
        <UnifiedAuthProvider>
          <TestComponent />
        </UnifiedAuthProvider>
      );

      await waitFor(() => {
        expect(mockClearUserTokens).not.toHaveBeenCalled();
        expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
      });
    });
  });

  describe("useAuth Hook", () => {
    test("should throw error when used outside provider", () => {
      // Suppress console.error for this test
      const consoleSpy = spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow("useAuth must be used within an UnifiedAuthProvider");

      consoleSpy.mockRestore();
    });
  });
});
