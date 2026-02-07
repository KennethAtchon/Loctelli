# 03 — Data Structures (With Real Examples)

This document shows you the actual shape of the data. No more "cardSettings contains the graph" without showing what that looks like.

---

## FormTemplate: Complete Example

Here's a real FormTemplate for a **Simple form**:

```json
{
  "id": "cm5abc123",
  "name": "GHL + Facebook Ads Onboarding",
  "slug": "ghl-facebook-onboarding",
  "description": "Onboarding form for new clients",
  "formType": "SIMPLE",
  "isActive": true,
  
  "title": "Business Setup - GHL & Facebook Ads Onboarding",
  "subtitle": "Help us set up your complete marketing automation system.",
  "submitButtonText": "Submit Onboarding Information",
  "successMessage": "Thank you! We've received your information.",
  
  "schema": [
    { "id": "business_name", "type": "text", "label": "Business Name", "required": true },
    { "id": "email", "type": "text", "label": "Business Email", "required": true },
    { "id": "budget", "type": "select", "label": "Monthly Budget", "options": ["$500-$1k", "$1k-$5k", "$5k+"], "required": true }
  ],
  
  "cardSettings": null,
  "profileEstimation": null,
  
  "analyticsEnabled": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

Note: Simple forms have `cardSettings: null` and `profileEstimation: null`.

---

## FormField: All Properties

Here's a FormField with every possible property (Card form):

```json
{
  "id": "user_name",
  "type": "text",
  "label": "What's your name?",
  "placeholder": "Enter your full name",
  "required": true,
  
  "options": null,
  
  "media": {
    "type": "image",
    "url": "https://example.com/welcome.jpg",
    "altText": "Welcome image",
    "position": "above"
  },
  
  "conditionalLogic": {
    "showIf": {
      "operator": "AND",
      "conditions": [
        { "fieldId": "has_account", "operator": "equals", "value": "yes" }
      ]
    },
    "jumpTo": [
      {
        "conditions": {
          "operator": "AND",
          "conditions": [
            { "fieldId": "user_type", "operator": "equals", "value": "business" }
          ]
        },
        "targetFieldId": "business_details"
      }
    ]
  },
  
  "enablePiping": true,
  "pipingKey": "name"
}
```

### Field Types

| type | What it renders | Uses `options`? |
|------|-----------------|-----------------|
| `text` | Single-line text input | No |
| `textarea` | Multi-line text input | No |
| `select` | Dropdown menu | Yes |
| `radio` | Radio buttons (single choice) | Yes |
| `checkbox` | Checkboxes (multiple choice) | Yes |
| `file` | File upload | No |
| `image` | Image upload | No |
| `statement` | Text display (no input) | No |

### Media Object

```json
{
  "type": "image",
  "url": "https://...",
  "altText": "Description",
  "position": "above"
}
```

| `type` | What it is |
|--------|-----------|
| `image` | Static image |
| `video` | Video (YouTube, Vimeo, or upload) |
| `gif` | Animated GIF |
| `icon` | Icon from icon library |

| `position` | Where it appears |
|------------|------------------|
| `above` | Above the question |
| `below` | Below the question |
| `left` | Left side |
| `right` | Right side |
| `background` | Behind everything |

For video, also include:
```json
{
  "type": "video",
  "videoType": "youtube",
  "videoId": "dQw4w9WgXcQ",
  "position": "above"
}
```

---

## cardSettings: The Card Form Configuration

This is what the docs kept hinting at. Here's the actual structure:

```json
{
  "cardSettings": {
    "flowchartGraph": {
      "nodes": [...],
      "edges": [...],
      "viewport": { "x": 0, "y": 0, "zoom": 1 }
    },
    "progressStyle": "bar",
    "showProgressText": true,
    "saveProgress": true,
    "animationStyle": "slide"
  }
}
```

### flowchartGraph

The visual representation of the form flow. Contains:

- **nodes**: The questions/statements (including start and end markers)
- **edges**: The connections between nodes
- **viewport**: Pan/zoom position of the canvas

This is the source of truth for Card forms. The `schema` is derived from this when saving.

### Other cardSettings Options

| Property | What it does |
|----------|--------------|
| `progressStyle` | `"bar"`, `"dots"`, `"fraction"`, `"none"` |
| `showProgressText` | Show "Question 3 of 10" |
| `saveProgress` | Enable save and continue later |
| `animationStyle` | `"slide"`, `"fade"`, `"none"` |

---

## FormStyling: Card Form Appearance (Theme)

Card forms can store optional theme/styling so the public form uses custom fonts, colors, and card/button style. All properties are optional; missing values fall back to app defaults.

```json
{
  "styling": {
    "fontFamily": {
      "heading": "Playfair Display",
      "body": "Inter"
    },
    "colors": {
      "primary": "#0d9488",
      "primaryForeground": "#ffffff",
      "background": "#f9fafb",
      "foreground": "#111827",
      "card": "#ffffff",
      "border": "#e5e7eb"
    },
    "card": {
      "borderRadius": 12,
      "shadow": "md"
    },
    "buttons": {
      "borderRadius": 8,
      "style": "solid"
    }
  }
}
```

| Area | Properties | Notes |
|------|------------|--------|
| `fontFamily` | `heading`, `body` | Font names (e.g. Inter, Open Sans) |
| `colors` | `primary`, `primaryForeground`, `background`, `foreground`, `card`, `cardForeground`, `border` | Hex or CSS color strings |
| `card` | `borderRadius` (number or string), `shadow` (`"none"` \| `"sm"` \| `"md"` \| `"lg"`) | Card container look |
| `buttons` | `borderRadius`, `style` (`"solid"` \| `"outline"` \| `"ghost"`) | Next/Back/Submit buttons |

The public card form page injects these as CSS variables (e.g. `--form-primary`, `--form-card-radius`) on a wrapper; components use them with fallbacks.

---

## FlowchartGraph: Nodes and Edges

Here's a real flowchartGraph for a 3-question form:

```json
{
  "flowchartGraph": {
    "nodes": [
      {
        "id": "start",
        "type": "start",
        "position": { "x": 250, "y": 0 },
        "data": { "label": "Start" }
      },
      {
        "id": "q1",
        "type": "question",
        "position": { "x": 250, "y": 100 },
        "data": {
          "label": "What's your name?",
          "fieldType": "text",
          "field": {
            "id": "q1",
            "type": "text",
            "label": "What's your name?",
            "required": true
          }
        }
      },
      {
        "id": "q2",
        "type": "question",
        "position": { "x": 250, "y": 200 },
        "data": {
          "label": "What's your email?",
          "fieldType": "text",
          "field": {
            "id": "q2",
            "type": "text",
            "label": "What's your email?",
            "required": true
          }
        }
      },
      {
        "id": "q3",
        "type": "question",
        "position": { "x": 250, "y": 300 },
        "data": {
          "label": "How can we help?",
          "fieldType": "textarea",
          "field": {
            "id": "q3",
            "type": "textarea",
            "label": "How can we help?",
            "required": false
          }
        }
      },
      {
        "id": "end",
        "type": "end",
        "position": { "x": 250, "y": 400 },
        "data": { "label": "End" }
      }
    ],
    "edges": [
      { "id": "e-start-q1", "source": "start", "target": "q1" },
      { "id": "e-q1-q2", "source": "q1", "target": "q2" },
      { "id": "e-q2-q3", "source": "q2", "target": "q3" },
      { "id": "e-q3-end", "source": "q3", "target": "end" }
    ],
    "viewport": { "x": 0, "y": 0, "zoom": 1 }
  }
}
```

### Node Types

| type | What it is |
|------|-----------|
| `start` | Entry point. Always id="start". Always exactly one. |
| `end` | Exit point. Always id="end". Always exactly one. |
| `question` | A form field. `data.field` contains the full FormField. |
| `statement` | Info card (no input). `data.statementText` is the content. |
| `result` | (Optional) Result display node. |

### Node Data

For question nodes:
```json
{
  "data": {
    "label": "Display label",
    "fieldType": "text",
    "field": { /* full FormField object */ },
    "media": { /* optional CardMedia */ }
  }
}
```

For statement nodes:
```json
{
  "data": {
    "label": "Statement title",
    "statementText": "The text to display",
    "isSuccessCard": false,
    "media": { /* optional */ }
  }
}
```

### Edges

Basic edge (linear flow):
```json
{
  "id": "e-q1-q2",
  "source": "q1",
  "target": "q2"
}
```

Conditional edge (branching):
```json
{
  "id": "e-q1-q3-conditional",
  "source": "q1",
  "target": "q3",
  "data": {
    "label": "If business",
    "condition": {
      "operator": "AND",
      "conditions": [
        { "fieldId": "user_type", "operator": "equals", "value": "business" }
      ]
    }
  }
}
```

---

## ProfileEstimation: Result Configuration

Card forms can show a result at the end. Here's the structure:

```json
{
  "profileEstimation": {
    "enabled": true,
    "type": "category",
    
    "categoryConfig": {
      "title": "Your Result",
      "categories": [
        {
          "id": "cat-a",
          "name": "Type A: The Achiever",
          "description": "You're driven by goals and results.",
          "image": "https://example.com/type-a.jpg",
          "matchingLogic": [
            { "fieldId": "q1", "operator": "equals", "value": "strongly_agree" },
            { "fieldId": "q2", "operator": "greater_than", "value": 7 }
          ]
        },
        {
          "id": "cat-b",
          "name": "Type B: The Collaborator",
          "description": "You thrive in team environments.",
          "image": "https://example.com/type-b.jpg",
          "matchingLogic": [
            { "fieldId": "q1", "operator": "equals", "value": "agree" }
          ]
        }
      ]
    }
  }
}
```

### Result Types

| type | What it shows |
|------|---------------|
| `percentage` | A score like "85%" with ranges (0-50 = Low, 51-80 = Medium, 81-100 = High) |
| `category` | One of several categories based on matching rules |
| `multi_dimension` | Multiple scores (like a radar chart) |
| `recommendation` | "We recommend X" based on answers |

---

## ConditionalLogic: Show/Hide/Jump

```json
{
  "conditionalLogic": {
    "showIf": {
      "operator": "AND",
      "conditions": [
        { "fieldId": "is_business", "operator": "equals", "value": true }
      ]
    },
    "hideIf": null,
    "jumpTo": [
      {
        "conditions": {
          "operator": "OR",
          "groups": [
            {
              "operator": "AND",
              "conditions": [
                { "fieldId": "budget", "operator": "greater_than", "value": 5000 }
              ]
            }
          ]
        },
        "targetFieldId": "premium_questions"
      }
    ],
    "dynamicLabel": [
      {
        "conditions": {
          "operator": "AND",
          "conditions": [
            { "fieldId": "user_type", "operator": "equals", "value": "business" }
          ]
        },
        "label": "What's your company's name?"
      }
    ]
  }
}
```

### Condition Operators

| Operator | What it checks |
|----------|----------------|
| `equals` | Exact match |
| `not_equals` | Not equal |
| `contains` | String/array contains value |
| `not_contains` | Doesn't contain |
| `greater_than` | Numeric comparison |
| `less_than` | Numeric comparison |
| `is_empty` | Field is empty/null |
| `is_not_empty` | Field has a value |
| `starts_with` | String starts with |
| `ends_with` | String ends with |

---

## FormSubmission: What Gets Stored

When a user submits:

```json
{
  "id": "sub_abc123",
  "formTemplateId": "cm5abc123",
  "data": {
    "business_name": "Acme Corp",
    "email": "contact@acme.com",
    "budget": "$1k-$5k"
  },
  "files": {
    "logo": {
      "url": "https://storage.example.com/uploads/logo.png",
      "originalName": "company-logo.png",
      "fieldId": "logo"
    }
  },
  "source": "direct",
  "status": "NEW",
  "priority": "MEDIUM",
  "submittedAt": "2024-01-15T14:30:00Z"
}
```

The `data` object is keyed by field ID. This is why field IDs must be unique within a form.

---

## FormSession: Card Form Progress

Card forms can save progress:

```json
{
  "sessionToken": "sess_xyz789",
  "formTemplateId": "cm5abc123",
  "currentCardIndex": 3,
  "partialData": {
    "q1": "John Doe",
    "q2": "john@example.com"
  }
}
```

Used for "save and continue later" and analytics (track where users drop off).

---

## Next

Now that you've seen the actual data, let's dive deep into how the flowchart system works: [04-the-flowchart.md](./04-the-flowchart.md)
