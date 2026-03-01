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
  getRefreshToken: mockGetRefreshToken,
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

mock.module("@/lib/logger", () => ({
  default: {
    debug: mockLoggerDebug,
    error: mockLoggerError,
    log: mock(() => {}),
    warn: mock(() => {}),
  },
}));

mock.module("@/lib/utils/envUtils", () => ({
  API_CONFIG: { BASE_URL: "http://localhost:3000/api" },
}));

beforeAll(() => {
  (globalThis as { fetch: typeof fetch }).fetch = mock(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          access_token: "new_access",
          refresh_token: "new_refresh",
        }),
    } as Response)
  );
});

beforeEach(() => {
  mockGetAdminRefreshToken.mockReturnValue(null);
  mockGetRefreshToken.mockReturnValue("refresh-token");
  mockSetAdminAccessToken.mockClear();
  mockSetAdminRefreshToken.mockClear();
  mockSetAccessToken.mockClear();
  mockSetRefreshToken.mockClear();
  mockClearAdminTokens.mockClear();
  mockClearUserTokens.mockClear();
  mockLoggerDebug.mockClear();
  mockLoggerError.mockClear();
});

describe("AuthManager", () => {
  describe("refreshToken", () => {
    it("deduplicates concurrent refresh calls across AuthManager instances", async () => {
      const { AuthManager } = await import("@/lib/api/auth-manager");
      const authManager1 = new AuthManager();
      const authManager2 = new AuthManager();

      const refreshPromise1 = authManager1.refreshToken();
      const refreshPromise2 = authManager2.refreshToken();

      await Promise.all([refreshPromise1, refreshPromise2]);

      expect(mockGetRefreshToken).toHaveBeenCalledTimes(1);
      expect(mockSetAccessToken).toHaveBeenCalledTimes(1);
      expect(mockSetRefreshToken).toHaveBeenCalledTimes(1);
    });

    it("allows a new refresh attempt after the in-flight one completes", async () => {
      const { AuthManager } = await import("@/lib/api/auth-manager");
      const authManager = new AuthManager();

      await authManager.refreshToken();
      await authManager.refreshToken();

      expect(mockGetRefreshToken).toHaveBeenCalledTimes(2);
      expect(mockSetAccessToken).toHaveBeenCalledTimes(2);
      expect(mockSetRefreshToken).toHaveBeenCalledTimes(2);
    });
  });
});
