import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
  consumeReturnToPath,
  getLoginPathForCurrentRoute,
  persistReturnToPath,
  resolvePostLoginRedirect,
} from "@/lib/session-expiration";

type MockWindow = {
  location: {
    pathname: string;
    search: string;
    hash: string;
  };
  sessionStorage: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
  };
};

const originalWindow = globalThis.window;

function createMockWindow(pathname: string, search = "", hash = ""): MockWindow {
  const storage = new Map<string, string>();

  return {
    location: {
      pathname,
      search,
      hash,
    },
    sessionStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
    },
  };
}

describe("session-expiration helpers", () => {
  beforeEach(() => {
    delete (globalThis as Record<string, unknown>).window;
  });

  afterEach(() => {
    if (originalWindow) {
      (globalThis as Record<string, unknown>).window = originalWindow;
    } else {
      delete (globalThis as Record<string, unknown>).window;
    }
  });

  it("stores and consumes a safe return path", () => {
    (globalThis as Record<string, unknown>).window = createMockWindow(
      "/account/leads",
      "?page=2"
    );

    const persisted = persistReturnToPath();
    expect(persisted).toBe("/account/leads?page=2");

    const consumed = consumeReturnToPath();
    expect(consumed).toBe("/account/leads?page=2");
    expect(consumeReturnToPath()).toBe(null);
  });

  it("rejects unsafe returnTo query values and falls back", () => {
    (globalThis as Record<string, unknown>).window = createMockWindow(
      "/auth/login",
      "?returnTo=https://evil.example"
    );

    expect(resolvePostLoginRedirect("/account")).toBe("/account");
  });

  it("prefers safe returnTo query values", () => {
    (globalThis as Record<string, unknown>).window = createMockWindow(
      "/auth/login",
      "?returnTo=%2Faccount%2Fpipeline"
    );

    expect(resolvePostLoginRedirect("/account")).toBe("/account/pipeline");
  });

  it("routes admin paths to admin login", () => {
    expect(getLoginPathForCurrentRoute("/admin/users")).toBe("/admin/login");
    expect(getLoginPathForCurrentRoute("/account")).toBe("/auth/login");
  });
});
