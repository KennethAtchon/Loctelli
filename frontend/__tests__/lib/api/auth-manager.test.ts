import { beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";

const mockGetAdminRefreshToken = mock(() => null);
const mockGetRefreshToken = mock(() => "refresh-token");
const mockSetAdminAccessToken = mock(() => {});
const mockSetAdminRefreshToken = mock(() => {});
const mockSetAccessToken = mock(() => {});
const mockSetRefreshToken = mock(() => {});
const mockClearAdminTokens = mock(() => {});
const mockClearUserTokens = mock(() => {});

const mockLoggerDebug = mock(() => {});
const mockLoggerError = mock(() => {});

const mockAuthCookies = {
  getAccessToken: mock(() => "mock_access_token"),
  getRefreshToken: mock(() => "mock_refresh_token"),
  getAdminAccessToken: mock(() => null),
  getAdminRefreshToken: mockGetAdminRefreshToken,
  setAccessToken: mockSetAccessToken,
  setRefreshToken: mockSetRefreshToken,
  setAdminAccessToken: mockSetAdminAccessToken,
  setAdminRefreshToken: mockSetAdminRefreshToken,
  clearAll: mockClearAdminTokens,
  clearAdminTokens: mockClearAdminTokens,
  clearUserTokens: mockClearUserTokens,
  hasUserTokens: mock(() => true),
  hasAdminTokens: mock(() => false),
};

mock.module("@/lib/cookies", () => ({ AuthCookies: mockAuthCookies }));
    setAdminAccessToken: mockSetAdminAccessToken,
    setAdminRefreshToken: mockSetAdminRefreshToken,
    setAccessToken: mockSetAccessToken,
    setRefreshToken: mockSetRefreshToken,
    clearAdminTokens: mockClearAdminTokens,
    clearUserTokens: mockClearUserTokens,
  },
}));

mock.module("@/lib/logger", () => ({
  __esModule: true,
  default: {
    debug: mockLoggerDebug,
    error: mockLoggerError,
  },
}));

let AuthManager: (typeof import("@/lib/api/auth-manager"))["AuthManager"];
const mockFetch = mock();

beforeAll(async () => {
  ({ AuthManager } = await import("@/lib/api/auth-manager"));
});

beforeEach(() => {
  mockFetch.mockReset();
  (globalThis as { fetch: typeof fetch }).fetch =
    mockFetch as unknown as typeof fetch;

  mockGetAdminRefreshToken.mockReset();
  mockGetRefreshToken.mockReset();
  mockSetAdminAccessToken.mockReset();
  mockSetAdminRefreshToken.mockReset();
  mockSetAccessToken.mockReset();
  mockSetRefreshToken.mockReset();
  mockClearAdminTokens.mockReset();
  mockClearUserTokens.mockReset();

  mockLoggerDebug.mockReset();
  mockLoggerError.mockReset();

  mockGetAdminRefreshToken.mockReturnValue(null);
  mockGetRefreshToken.mockReturnValue("refresh-token");
});

describe("AuthManager", () => {
  describe("refreshToken", () => {
    it("deduplicates concurrent refresh calls across AuthManager instances", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: mock().mockResolvedValue({
          access_token: "new-access-token",
          refresh_token: "new-refresh-token",
        }),
      } as Response);

      const managerA = new AuthManager("http://localhost:3001");
      const managerB = new AuthManager("http://localhost:3001");

      await Promise.all([managerA.refreshToken(), managerB.refreshToken()]);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/auth/refresh",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: "refresh-token" }),
        })
      );
      expect(mockSetAccessToken).toHaveBeenCalledTimes(1);
      expect(mockSetRefreshToken).toHaveBeenCalledTimes(1);
    });

    it("allows a new refresh attempt after the in-flight one completes", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: mock().mockResolvedValue({
          access_token: "new-access-token",
          refresh_token: "new-refresh-token",
        }),
      } as Response);

      const manager = new AuthManager("http://localhost:3001");

      await manager.refreshToken();
      await manager.refreshToken();

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
