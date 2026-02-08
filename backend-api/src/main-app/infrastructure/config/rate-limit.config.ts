import { Request } from 'express';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Skip counting successful requests
  skipFailedRequests?: boolean; // Skip counting failed requests
  description?: string; // Human-readable description for logging
}

export type RouteMatcher = {
  method?: string | string[]; // HTTP method(s) to match
  path?: string | RegExp | ((path: string) => boolean); // Path matcher
  priority?: number; // Higher priority matches first (default: 0)
};

export interface RateLimitRule {
  matcher: RouteMatcher;
  config: RateLimitConfig;
  name: string; // Rule name for logging
}

/**
 * Default rate limit configuration
 */
export const defaultRateLimitConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  description: 'Default rate limit',
};

/**
 * Normalize request path for matching.
 * When req.path is "/" (common behind proxy/Nest), use originalUrl so we get the real path (e.g. /auth/login).
 */
function getRequestPath(req: Request): string {
  const fromPath = req.path ?? '';
  const fromOriginal = req.originalUrl ? req.originalUrl.split('?')[0] : '';
  if (!fromPath || fromPath === '/') return fromOriginal || fromPath;
  return fromPath || fromOriginal || '';
}

/**
 * Helper function to create a route matcher
 */
export function matchRoute(matcher: RouteMatcher, req: Request): boolean {
  const { method, path } = matcher;
  const reqMethod = req.method;
  const reqPath = getRequestPath(req);

  // Check method match
  if (method) {
    const methods = Array.isArray(method) ? method : [method];
    if (!methods.includes(reqMethod)) {
      return false;
    }
  }

  // Check path match
  if (path) {
    if (typeof path === 'string') {
      // Exact match or includes check
      if (path.startsWith('/') && path === reqPath) {
        return true;
      }
      return reqPath.includes(path);
    } else if (path instanceof RegExp) {
      return path.test(reqPath);
    } else if (typeof path === 'function') {
      return path(reqPath);
    }
  }

  // If no path specified, match all paths (for this method)
  return true;
}

/**
 * Redis key patterns for monitor (admin) to list all rate limit keys.
 * Must match every key prefix used by keyGenerators in rateLimitRules + default.
 * When adding a new rule with a new key prefix, add its pattern here (e.g. 'my_limit:*').
 */
export const RATE_LIMIT_MONITOR_PATTERNS: string[] = [
  'auth_rate_limit:*',
  'track_time_rate_limit:*',
  'form_submit_rate_limit:*',
  'form_upload_rate_limit:*',
  'status_rate_limit:*',
  'api_rate_limit:*',
  'rate_limit:*', // default when no rule keyGenerator
];

/**
 * [prefix, display type] for monitor table. Order matters (first match wins).
 * For auth_rate_limit, the last segment of the key (login, register, etc.) is used as type when present.
 */
export const RATE_LIMIT_MONITOR_PREFIX_TYPES: [string, string][] = [
  ['auth_rate_limit:', 'auth'],
  ['track_time_rate_limit:', 'track-time'],
  ['form_submit_rate_limit:', 'form-submit'],
  ['form_upload_rate_limit:', 'form-upload'],
  ['api_rate_limit:', 'api'],
  ['status_rate_limit:', 'status'],
  ['rate_limit:', 'default'],
];

/**
 * Rate limit rules - ordered by priority (higher priority first)
 * Rules are evaluated in order, first match wins
 *
 * To add a new rate limit rule:
 * 1. Add a new object to the rateLimitRules array
 * 2. Set a unique `name` for the rule
 * 3. Define a `matcher` with method/path conditions
 * 4. Set `priority` (higher = checked first, default: 0)
 * 5. Define the `config` with windowMs, maxRequests, and optional keyGenerator
 * 6. If the key prefix is new, add it to RATE_LIMIT_MONITOR_PATTERNS above
 *
 * Example:
 * ```typescript
 * {
 *   name: 'my-endpoint',
 *   matcher: {
 *     method: 'POST',
 *     path: '/api/my-endpoint',
 *     priority: 50,
 *   },
 *   config: {
 *     windowMs: 60 * 1000, // 1 minute
 *     maxRequests: 10,
 *     keyGenerator: (req) => `my_limit:${req.ip}`,
 *     description: 'My custom endpoint',
 *   },
 * }
 * ```
 */
export const rateLimitRules: RateLimitRule[] = [
  // Track-time endpoint - high frequency analytics
  // Increased limit to handle rapid card navigation
  // Frontend now filters out requests < 1 second to reduce spam
  {
    name: 'track-time',
    matcher: {
      method: 'POST',
      path: (p) => p.includes('/forms/public/') && p.includes('/track-time'),
      priority: 100,
    },
    config: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 200, // 200 requests per minute (increased from 100)
      keyGenerator: (req) => {
        const ip = req.ip || req.connection?.remoteAddress || 'unknown';
        const path = req.path;
        return `track_time_rate_limit:${ip}:${path}`;
      },
      description:
        'Form card time tracking (analytics) - increased limit with frontend filtering',
    },
  },

  // Auth endpoints - strict limits
  // Match any path containing auth segment (handles /auth/login, auth/login, /api/auth/login, etc.)
  {
    name: 'auth-login',
    matcher: {
      method: 'POST',
      path: (p) => typeof p === 'string' && p.includes('auth/login'),
      priority: 90,
    },
    config: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 login attempts per 15 minutes
      keyGenerator: (req) => {
        const ip = req.ip || req.connection?.remoteAddress || 'unknown';
        return `auth_rate_limit:${ip}:login`;
      },
      description: 'User/Admin login',
    },
  },

  {
    name: 'auth-register',
    matcher: {
      method: 'POST',
      path: (p) => typeof p === 'string' && p.includes('auth/register'),
      priority: 90,
    },
    config: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 15, // 15 registration attempts per 15 minutes
      keyGenerator: (req) => {
        const ip = req.ip || req.connection?.remoteAddress || 'unknown';
        return `auth_rate_limit:${ip}:register`;
      },
      description: 'User/Admin registration',
    },
  },

  {
    name: 'admin-auth-login',
    matcher: {
      method: 'POST',
      path: (p) => typeof p === 'string' && p.includes('admin/auth/login'),
      priority: 90,
    },
    config: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 15, // 5 login attempts per 15 minutes
      keyGenerator: (req) => {
        const ip = req.ip || req.connection?.remoteAddress || 'unknown';
        return `auth_rate_limit:${ip}:admin-login`;
      },
      description: 'Admin login',
    },
  },

  {
    name: 'admin-auth-register',
    matcher: {
      method: 'POST',
      path: (p) => typeof p === 'string' && p.includes('admin/auth/register'),
      priority: 90,
    },
    config: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 registration attempts per 15 minutes
      keyGenerator: (req) => {
        const ip = req.ip || req.connection?.remoteAddress || 'unknown';
        return `auth_rate_limit:${ip}:admin-register`;
      },
      description: 'Admin registration',
    },
  },

  // Public form endpoints - moderate limits
  {
    name: 'public-form-submit',
    matcher: {
      method: 'POST',
      path: (p) => p.includes('/forms/public/') && p.includes('/submit'),
      priority: 80,
    },
    config: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 20, // 20 submissions per 15 minutes
      keyGenerator: (req) => {
        const ip = req.ip || req.connection?.remoteAddress || 'unknown';
        return `form_submit_rate_limit:${ip}`;
      },
      description: 'Public form submission',
    },
  },

  {
    name: 'public-form-upload',
    matcher: {
      method: 'POST',
      path: (p) => p.includes('/forms/public/') && p.includes('/upload'),
      priority: 80,
    },
    config: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 30, // 30 uploads per 15 minutes
      keyGenerator: (req) => {
        const ip = req.ip || req.connection?.remoteAddress || 'unknown';
        return `form_upload_rate_limit:${ip}`;
      },
      description: 'Public form file upload',
    },
  },

  // Status/health endpoints - very permissive
  {
    name: 'status-endpoints',
    matcher: {
      path: (p) => p.startsWith('/status/'),
      priority: 10,
    },
    config: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 1000, // Very high limit for health checks
      keyGenerator: (req) => {
        const ip = req.ip || req.connection?.remoteAddress || 'unknown';
        return `status_rate_limit:${ip}`;
      },
      description: 'Status/health check endpoints',
    },
  },

  // General API endpoints - default high limit (exclude auth so auth rules always win)
  {
    name: 'api-endpoints',
    matcher: {
      path: (p) => {
        if (typeof p !== 'string') return true;
        const lower = p.toLowerCase();
        return (
          !lower.includes('auth/register') &&
          !lower.includes('auth/login') &&
          !lower.includes('admin/auth')
        );
      },
      priority: 1,
    },
    config: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 1000, // 1000 requests per 15 minutes
      keyGenerator: (req) => {
        const ip = req.ip || req.connection?.remoteAddress || 'unknown';
        const userId = (req.user as any)?.userId || 'anonymous';
        return `api_rate_limit:${ip}:${userId}`;
      },
      description: 'General API endpoints',
    },
  },
];

/**
 * Find the matching rate limit rule for a request
 * Returns the first matching rule (highest priority first)
 */
export function findRateLimitRule(req: Request): RateLimitRule | null {
  // Sort rules by priority (descending) to check highest priority first
  const sortedRules = [...rateLimitRules].sort(
    (a, b) => (b.matcher.priority || 0) - (a.matcher.priority || 0),
  );

  for (const rule of sortedRules) {
    if (matchRoute(rule.matcher, req)) {
      return rule;
    }
  }

  return null;
}

/**
 * Get rate limit config for a request
 * Returns the matched rule's config or the default config
 */
export function getRateLimitConfig(req: Request): RateLimitConfig {
  const rule = findRateLimitRule(req);

  if (rule) {
    return {
      ...defaultRateLimitConfig,
      ...rule.config,
    };
  }

  return defaultRateLimitConfig;
}
