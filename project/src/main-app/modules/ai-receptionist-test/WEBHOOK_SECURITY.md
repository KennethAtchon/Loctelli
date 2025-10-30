# AI Receptionist Webhook Security

This module has lightweight security for publicly accessible webhook endpoints.

## Security Features

### 1. Basic HTTP Authentication (Optional)

Configure your webhook URLs in Postmark/Twilio with credentials:

```
https://username:password@api.loctelli.com/ai-receptionist/webhooks/email
```

**Environment Variables:**
```bash
WEBHOOK_USERNAME=your-secure-username
WEBHOOK_PASSWORD=your-secure-password
```

### 2. IP Whitelist for Postmark (Optional)

Restrict email webhooks to Postmark's IP addresses only.

**Environment Variable:**
```bash
ENABLE_WEBHOOK_IP_WHITELIST=true  # Set to 'true' to enable
```

**Postmark IPs (auto-configured):**
- 3.134.147.250
- 50.31.156.6
- 50.31.156.77
- 18.217.206.57

Reference: https://postmarkapp.com/support/article/800-ips-for-firewalls

## Security Modes

### Development (No Auth)
```bash
# No env vars needed - all webhooks accepted
# Good for local testing
```

### Production with Basic Auth (Recommended)
```bash
WEBHOOK_USERNAME=myuser
WEBHOOK_PASSWORD=supersecurepassword123
```

Configure in Postmark:
```
https://myuser:supersecurepassword123@api.loctelli.com/ai-receptionist/webhooks/email
```

### Production with IP Whitelist + Basic Auth (Maximum Security)
```bash
WEBHOOK_USERNAME=myuser
WEBHOOK_PASSWORD=supersecurepassword123
ENABLE_WEBHOOK_IP_WHITELIST=true
```

## Testing

### Test without auth (development):
```bash
curl -X POST https://api.loctelli.com/ai-receptionist/webhooks/email \
  -H "Content-Type: application/json" \
  -d '{"From": "test@example.com"}'
```

### Test with basic auth:
```bash
curl -X POST https://api.loctelli.com/ai-receptionist/webhooks/email \
  -u "username:password" \
  -H "Content-Type: application/json" \
  -d '{"From": "test@example.com"}'
```

## Implementation

The security is **isolated** to this module only:
- Does not affect other routes
- Lightweight middleware in `webhook-security.middleware.ts`
- Applied only to `/ai-receptionist/webhooks/*` routes
- Zero impact on the rest of the codebase
