# Simple Form AI Integration Test

This document demonstrates how to test the new Simple Form AI integration.

## Endpoint
```
POST /forms/ai-simple-form-chat
```

## Request Body
```json
{
  "message": "Create a contact form with name, email, and message fields",
  "conversationHistory": []
}
```

## Expected Response
```json
{
  "content": "I'll create a contact form for you. Here's the complete JSON:\n\n```json\n{\n  \"name\": \"Contact Form\",\n  \"slug\": \"contact\",\n  \"title\": \"Get in Touch\",\n  \"subtitle\": \"We'll respond within 24 hours\",\n  \"formType\": \"SIMPLE\",\n  \"schema\": [\n    {\n      \"id\": \"name\",\n      \"type\": \"text\",\n      \"label\": \"Your Name\",\n      \"placeholder\": \"Enter your full name\",\n      \"required\": true\n    },\n    {\n      \"id\": \"email\",\n      \"type\": \"text\",\n      \"label\": \"Email Address\",\n      \"placeholder\": \"your@email.com\",\n      \"required\": true\n    },\n    {\n      \"id\": \"message\",\n      \"type\": \"textarea\",\n      \"label\": \"Message\",\n      \"placeholder\": \"Tell us more...\",\n      \"required\": true\n    }\n  ],\n  \"styling\": {\n    \"fontFamily\": { \"heading\": \"Inter\", \"body\": \"Inter\" },\n    \"baseFontSize\": 16,\n    \"colors\": {\n      \"primary\": \"#0d9488\",\n      \"primaryForeground\": \"#ffffff\",\n      \"background\": \"#f9fafb\",\n      \"foreground\": \"#111827\",\n      \"card\": \"#ffffff\",\n      \"border\": \"#e5e7eb\"\n    },\n    \"form\": { \"borderRadius\": 12, \"shadow\": \"md\", \"maxWidth\": \"28rem\" },\n    \"buttons\": { \"borderRadius\": 8, \"style\": \"solid\" },\n    \"fields\": { \"borderRadius\": 6, \"borderWidth\": 1, \"focusRing\": \"md\" }\n  }\n}\n```\n\nThis contact form includes the essential fields you requested and is ready to use!"
}
```

## Testing with curl
```bash
curl -X POST http://localhost:3001/forms/ai-simple-form-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "message": "Create a simple registration form with name, email, and password",
    "conversationHistory": []
  }'
```

## Features Supported
- All basic field types: text, textarea, select, checkbox, radio, file, image, statement
- Form styling with colors, fonts, and layout options
- Required field validation
- Form metadata (title, subtitle, descriptions)
- Conversation history for multi-turn editing

## Differences from Card Forms
- No flowchartGraph (simple forms are single-page)
- No cardSettings or profileEstimation
- No branching or conditional logic
- Focus on straightforward data collection
- All fields visible at once
