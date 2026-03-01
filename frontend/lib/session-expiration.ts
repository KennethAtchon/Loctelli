const SESSION_EXPIRED_EVENT = "auth:session-expired";
const AUTH_RETURN_TO_KEY = "auth:return-to";

export interface SessionExpiredEventDetail {
  reason?: string;
  source?: string;
  returnTo: string;
}

function sanitizeReturnTo(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}

function getCurrentRelativeLocation(): string {
  if (typeof window === "undefined") {
    return "/";
  }

  const { pathname, search, hash } = window.location;
  return `${pathname}${search}${hash}`;
}

export function persistReturnToPath(path?: string): string {
  const fallbackPath = getCurrentRelativeLocation();
  const safePath = sanitizeReturnTo(path) ?? fallbackPath;

  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(AUTH_RETURN_TO_KEY, safePath);
  }

  return safePath;
}

export function consumeReturnToPath(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.sessionStorage.getItem(AUTH_RETURN_TO_KEY);
  window.sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
  return sanitizeReturnTo(stored);
}

export function emitSessionExpired(detail: {
  reason?: string;
  source?: string;
  returnTo?: string;
} = {}): void {
  if (typeof window === "undefined") {
    return;
  }

  const returnTo = persistReturnToPath(detail.returnTo);

  window.dispatchEvent(
    new CustomEvent<SessionExpiredEventDetail>(SESSION_EXPIRED_EVENT, {
      detail: {
        reason: detail.reason,
        source: detail.source,
        returnTo,
      },
    })
  );
}

export function subscribeToSessionExpired(
  callback: (detail: SessionExpiredEventDetail) => void
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<SessionExpiredEventDetail>;
    if (!customEvent.detail) {
      return;
    }

    callback(customEvent.detail);
  };

  window.addEventListener(SESSION_EXPIRED_EVENT, handler as EventListener);
  return () => {
    window.removeEventListener(SESSION_EXPIRED_EVENT, handler as EventListener);
  };
}

export function getLoginPathForCurrentRoute(pathname?: string): string {
  const currentPath = pathname ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  return currentPath.startsWith("/admin") ? "/admin/login" : "/auth/login";
}

export function redirectToLoginWithReturnTo(path?: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const returnTo = persistReturnToPath(path);
  const loginPath = getLoginPathForCurrentRoute(path ?? window.location.pathname);
  const nextUrl = `${loginPath}?returnTo=${encodeURIComponent(returnTo)}`;
  window.location.href = nextUrl;
}

export function resolvePostLoginRedirect(defaultPath: string): string {
  if (typeof window === "undefined") {
    return defaultPath;
  }

  const queryParam = new URLSearchParams(window.location.search).get("returnTo");
  const returnToFromQuery = sanitizeReturnTo(queryParam);

  if (returnToFromQuery) {
    window.sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
    return returnToFromQuery;
  }

  const returnToFromStorage = consumeReturnToPath();
  return returnToFromStorage ?? defaultPath;
}
