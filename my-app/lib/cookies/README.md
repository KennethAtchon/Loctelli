# Cookie-Based Authentication System

This document describes the cookie-based authentication system implemented in the Loctelli application.

## Overview

The application uses secure HTTP cookies for authentication token storage, providing automatic login functionality and enhanced security compared to localStorage.

## Features

### Automatic Login
- Users are automatically logged in when they visit the application if they have valid authentication cookies
- No need to re-enter credentials on each visit
- Seamless user experience

### Secure Token Storage
- Tokens are stored in HTTP cookies with secure settings
- `httpOnly` flag prevents XSS attacks
- `secure` flag ensures cookies are only sent over HTTPS in production
- `sameSite: 'strict'` prevents CSRF attacks

### Automatic Token Refresh
- Access tokens are automatically refreshed when they expire
- Users stay logged in without interruption
- Failed refresh attempts redirect to login page

### API Key Authorization
- All requests include API key in `x-api-key` header
- Server-side API key validation via middleware
- Required for all backend communication

## Cookie Structure

### Regular User Tokens
- `access_token`: Short-lived token (1 hour) for API requests
- `refresh_token`: Long-lived token (7 days) for refreshing access tokens

### Admin Tokens
- `admin_access_token`: Short-lived token (1 hour) for admin API requests
- `admin_refresh_token`: Long-lived token (7 days) for refreshing admin access tokens

## Request Headers

All API requests include the following headers:

```typescript
{
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,                    // Required for all requests
  'X-User-Token': userAccessToken,         // If user is logged in
}
```

## Usage

### Setting Tokens
```typescript
import { AuthCookies } from '@/lib/cookies';

// Regular user tokens
AuthCookies.setAccessToken(token);
AuthCookies.setRefreshToken(token);

// Admin tokens
AuthCookies.setAdminAccessToken(token);
AuthCookies.setAdminRefreshToken(token);
```

### Getting Tokens
```typescript
// Regular user tokens
const accessToken = AuthCookies.getAccessToken();
const refreshToken = AuthCookies.getRefreshToken();

// Admin tokens
const adminAccessToken = AuthCookies.getAdminAccessToken();
const adminRefreshToken = AuthCookies.getAdminRefreshToken();
```

### Checking Authentication Status
```typescript
// Check if user has tokens
const hasUserTokens = AuthCookies.hasUserTokens();

// Check if admin has tokens
const hasAdminTokens = AuthCookies.hasAdminTokens();
```

### Clearing Tokens
```typescript
// Clear all authentication tokens
AuthCookies.clearAll();
```

## API Client Integration

The API client automatically:
1. Includes API key in `x-api-key` header for all requests
2. Includes authentication headers from cookies
3. Handles 401 responses by attempting token refresh
4. Retries failed requests with new tokens
5. Redirects to login on refresh failure

## Security Considerations

### Cookie Security
- Cookies are set with `secure: true` in production
- `sameSite: 'strict'` prevents CSRF attacks
- `httpOnly: true` prevents XSS attacks (when supported by server)

### API Key Security
- API key is server-side only (not exposed to browser)
- Required for all backend communication
- Validated by backend middleware on every request

### Token Management
- Access tokens expire after 1 hour
- Refresh tokens expire after 7 days
- Invalid tokens are automatically cleared
- Failed authentication redirects to appropriate login page

### Admin vs User Authentication
- Admin tokens take precedence over user tokens
- Separate token storage prevents conflicts
- Clear separation of admin and user authentication flows

## Backend Middleware

The backend uses `ApiKeyMiddleware` to validate API keys:

```typescript
// Backend middleware checks for:
req.headers['x-api-key'] || req.query.api_key
```

The middleware is applied to all routes except:
- `GET /status/health` - Health check endpoint
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Token refresh
- `POST /admin/auth/login` - Admin login
- `POST /admin/auth/register` - Admin registration
- `POST /admin/auth/refresh` - Admin token refresh

## Migration from localStorage

The application has been migrated from localStorage to cookies. Key changes:

1. **Token Storage**: Tokens are now stored in HTTP cookies instead of localStorage
2. **Automatic Login**: Users are automatically logged in if valid cookies exist
3. **Token Refresh**: Automatic token refresh handles expired tokens
4. **Security**: Better security with httpOnly and secure cookie flags
5. **API Key**: Added server-side API key validation

## Browser Compatibility

The cookie system works in all modern browsers. The `httpOnly` flag requires server-side support for maximum security, but the client-side implementation works regardless.

## Troubleshooting

### Common Issues

1. **Tokens not persisting**: Check if cookies are enabled in the browser
2. **Automatic login not working**: Verify cookie settings and domain configuration
3. **Token refresh failing**: Check network connectivity and server status
4. **API key errors**: Ensure `API_KEY` is set in `.env.local` file

### Debugging

Use browser developer tools to inspect cookies:
1. Open Developer Tools (F12)
2. Go to Application/Storage tab
3. Check Cookies section for authentication tokens

### Testing API Key

Use the test functions in browser console:
```javascript
// Test API key configuration
window.testApiKey.testHeaders();

// Test API request with key
window.testApiKey.testRequest();
```

## Future Enhancements

- Server-side cookie validation
- Enhanced CSRF protection
- Token rotation for improved security
- Session management improvements
- API key rotation mechanisms 