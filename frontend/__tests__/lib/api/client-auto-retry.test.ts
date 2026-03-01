import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { ApiClient } from "@/lib/api/client";
import { AuthManager } from "@/lib/api/auth-manager";
import { emitSessionExpired } from "@/lib/session-expiration";
import logger from "@/lib/logger";

// Mock dependencies
const mockFetch = Bun.mock("globalThis", "fetch", () =>
  jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: "success" }),
    } as Response)
  )
);

const mockLogger = Bun.mock("@/lib/logger", "default", () => ({
  debug: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
}));

const mockAuthManager = Bun.mock(
  "@/lib/api/auth-manager",
  "AuthManager",
  jest.fn().mockImplementation(() => ({
    getAuthHeaders: () => ({ Authorization: "Bearer test-token" }),
    refreshToken: jest.fn().mockResolvedValue(undefined),
    isAuthEndpoint: jest.fn(() => false),
  }))
);

const mockEmitSessionExpired = Bun.mock(
  "@/lib/session-expiration",
  "emitSessionExpired",
  jest.fn()
);

describe("ApiClient auto-retry", () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    mockFetch.mockClear();
    mockLogger.debug.mockClear();
    mockEmitSessionExpired.mockClear();
    apiClient = new ApiClient("http://test.com");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("stores last failed request on 401", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: "Unauthorized" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: "success" }),
      } as Response);

    await expect(apiClient.get("/test")).rejects.toThrow(
      "Session expired. Please refresh your session."
    );

    expect(mockEmitSessionExpired).toHaveBeenCalledWith({
      source: "api-client-retry-401",
      reason: "Session expired after token refresh.",
    });
  });

  it("retries last failed request after manual refresh", async () => {
    // First call fails with 401
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: "Unauthorized" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: "success" }),
      } as Response);

    await expect(apiClient.get("/test")).rejects.toThrow();

    // Now retry after manual refresh
    const result = await apiClient.retryLastFailedRequest();
    expect(result).toEqual({ data: "success" });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("returns null if no failed request to retry", async () => {
    const result = await apiClient.retryLastFailedRequest();
    expect(result).toBeNull();
  });

  it("clears last failed request on successful retry", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: "Unauthorized" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: "success" }),
      } as Response);

    await expect(apiClient.get("/test")).rejects.toThrow();

    await apiClient.retryLastFailedRequest();

    // Second retry attempt should return null
    const result = await apiClient.retryLastFailedRequest();
    expect(result).toBeNull();
  });
});
