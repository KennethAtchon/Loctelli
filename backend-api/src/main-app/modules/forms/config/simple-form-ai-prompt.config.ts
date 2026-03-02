/**
 * Simple Form Builder AI – prompt, schema reference, and examples.
 * Edit this file to tune the AI behavior or add new example shapes.
 */

/** Full schema reference for simple form structure and styling. */
export const SIMPLE_FORM_SCHEMA_REFERENCE = `
=== SIMPLE FORM STRUCTURE ===
Simple forms display all fields on a single page. No flowchart, no branching, no results screen.

Basic properties:
- name: string - Internal form name (for admin)
- slug: string - URL-friendly identifier (e.g. "contact-us")
- title: string - Public form title shown to users
- subtitle?: string - Optional descriptive text under title
- description?: string - Admin description of form purpose
- submitButtonText?: string - Default "Submit"
- successMessage?: string - Default "Thank you for your submission!"
- formType: "SIMPLE" - Always SIMPLE for this form type

=== SCHEMA (Form Fields) ===
schema is an array of FormField objects. Each field has:

Basic field properties:
- id: string - Unique field identifier (e.g. "name", "email")
- type: "text" | "textarea" | "select" | "checkbox" | "radio" | "file" | "image" | "statement"
- label: string - Field label shown to users
- placeholder?: string - Text input placeholder (text/textarea only)
- required?: boolean - Default false
- options?: string[] - For select/radio/checkbox: array of choices

Field types:
- text: Single-line text input
- textarea: Multi-line text input
- select: Dropdown selection (requires options)
- checkbox: Single checkbox (true/false) or multiple checkboxes (requires options)
- radio: Radio button group (requires options)
- file: File upload
- image: Image upload
- statement: Static text display (no input)

=== STYLING (CSS / theme layer) ===
All optional. Use hex colors (e.g. "#0d9488"). Omit a key to use app default.

styling: {
  fontFamily?: { heading?: string, body?: string },   // e.g. "Inter", "Source Sans 3"
  baseFontSize?: number,                              // 14-24, default 16
  colors: {
    primary?, primaryForeground?, accent?, background?, foreground?,
    card?, cardForeground?, border?, muted?, mutedForeground?
  },
  form: {
    borderRadius?: number | string,                   // e.g. 8, 12
    shadow?: "none" | "sm" | "md" | "lg",
    padding?: number | string,
    maxWidth?: number | string                        // e.g. 480, "28rem", "100%" — form container width
  },
  buttons: {
    borderRadius?: number | string,
    style?: "solid" | "outline" | "ghost"
  },
  fields: {
    borderRadius?: number | string,
    borderWidth?: number,
    focusRing?: "none" | "sm" | "md" | "lg"
  }
}

=== LIMITATIONS ===
Simple forms DO NOT support:
- flowchartGraph (only for card forms)
- cardSettings (only for card forms) 
- profileEstimation (only for card forms)
- Branching/conditional logic
- Progress indication
- Session save/resume
- Piping ({{fieldId}} references)
`;

/** Intro instructions for the Simple Form Builder AI. */
export const SIMPLE_FORM_BUILDER_SYSTEM_PROMPT_INTRO = `You are an assistant that helps users build simple forms. Your job is to:
1. Ask clarifying questions to understand what kind of form they want (e.g. contact form, survey, registration, feedback).
2. When you have enough information, produce a COMPLETE Simple Form Template as a single JSON object that the user can load into the form builder.

Rules:
- For images (image uploads), only URLs are allowed. Tell the user to provide image links; there is no file upload in this flow.
- Output the form as valid JSON. When you are ready to deliver the form, put the entire JSON inside a markdown code block with the language tag \`\`\`json so the client can parse it.
- Your output MUST be a FULL simple form: include schema array with all fields, plus styling if desired.
- Keep forms concise and focused. Simple forms work best for contact, registration, feedback, and basic data collection.
- You may ask 1–3 short questions before generating the JSON.

When the user provides or you receive "current form" context, you may output an updated full JSON that reflects their requested changes. Otherwise create a new form from scratch.

Use the SCHEMA REFERENCE and the full example below. For styling, always include at least fontFamily, colors (primary, primaryForeground, background, foreground, card, border), form, buttons, and fields.`;

/** Full Simple Form example. */
function getFullSimpleFormExampleJson(): string {
  const example = {
    name: 'Contact Form',
    slug: 'contact',
    title: 'Get in Touch',
    subtitle: "We'll respond within 24 hours",
    description: 'Basic contact form for website visitors',
    submitButtonText: 'Send Message',
    successMessage: 'Thank you! Your message has been sent.',
    formType: 'SIMPLE',
    schema: [
      {
        id: 'name',
        type: 'text',
        label: 'Your Name',
        placeholder: 'Enter your full name',
        required: true,
      },
      {
        id: 'email',
        type: 'text',
        label: 'Email Address',
        placeholder: 'your@email.com',
        required: true,
      },
      {
        id: 'subject',
        type: 'select',
        label: 'Subject',
        options: ['General Inquiry', 'Support', 'Feedback', 'Partnership'],
        required: true,
      },
      {
        id: 'message',
        type: 'textarea',
        label: 'Message',
        placeholder: 'Tell us more...',
        required: true,
      },
      {
        id: 'newsletter',
        type: 'checkbox',
        label: 'Subscribe to our newsletter for updates',
        required: false,
      },
    ],
    styling: {
      fontFamily: { heading: 'Inter', body: 'Inter' },
      baseFontSize: 16,
      colors: {
        primary: '#0d9488',
        primaryForeground: '#ffffff',
        background: '#f9fafb',
        foreground: '#111827',
        card: '#ffffff',
        border: '#e5e7eb',
      },
      form: { borderRadius: 12, shadow: 'md', maxWidth: '28rem', padding: 24 },
      buttons: { borderRadius: 8, style: 'solid' },
      fields: { borderRadius: 6, borderWidth: 1, focusRing: 'md' },
    },
  };
  return JSON.stringify(example, null, 2);
}

function getRegistrationFormExampleSnippet(): string {
  return JSON.stringify(
    {
      name: 'User Registration',
      slug: 'register',
      title: 'Create Account',
      subtitle: 'Join our community today',
      description: 'New user registration form',
      submitButtonText: 'Create Account',
      successMessage: 'Account created successfully!',
      formType: 'SIMPLE',
      schema: [
        {
          id: 'fullName',
          type: 'text',
          label: 'Full Name',
          placeholder: 'Enter your full name',
          required: true,
        },
        {
          id: 'email',
          type: 'text',
          label: 'Email Address',
          placeholder: 'your@email.com',
          required: true,
        },
        {
          id: 'password',
          type: 'text',
          label: 'Password',
          placeholder: 'Choose a strong password',
          required: true,
        },
        {
          id: 'company',
          type: 'text',
          label: 'Company (Optional)',
          placeholder: 'Your company name',
          required: false,
        },
        {
          id: 'terms',
          type: 'checkbox',
          label: 'I agree to the Terms of Service and Privacy Policy',
          required: true,
        },
      ],
      styling: {
        fontFamily: { heading: 'Inter', body: 'Inter' },
        baseFontSize: 16,
        colors: {
          primary: '#3b82f6',
          primaryForeground: '#ffffff',
          background: '#f8fafc',
          foreground: '#1e293b',
          card: '#ffffff',
          border: '#e2e8f0',
        },
        form: { borderRadius: 8, shadow: 'lg', maxWidth: '32rem', padding: 32 },
        buttons: { borderRadius: 6, style: 'solid' },
        fields: { borderRadius: 4, borderWidth: 1, focusRing: 'sm' },
      },
    },
    null,
    2,
  );
}

function getFeedbackFormExampleSnippet(): string {
  return JSON.stringify(
    {
      name: 'Product Feedback',
      slug: 'feedback',
      title: 'Share Your Feedback',
      subtitle: 'Help us improve our product',
      description: 'Customer feedback collection form',
      submitButtonText: 'Submit Feedback',
      successMessage: 'Thank you for your valuable feedback!',
      formType: 'SIMPLE',
      schema: [
        {
          id: 'satisfaction',
          type: 'radio',
          label: 'Overall Satisfaction',
          options: [
            'Very Satisfied',
            'Satisfied',
            'Neutral',
            'Dissatisfied',
            'Very Dissatisfied',
          ],
          required: true,
        },
        {
          id: 'features',
          type: 'checkbox',
          label: 'Features you use (select all that apply)',
          options: [
            'Dashboard',
            'Analytics',
            'Reports',
            'Integrations',
            'Mobile App',
          ],
          required: false,
        },
        {
          id: 'improvements',
          type: 'textarea',
          label: 'What would you like to see improved?',
          placeholder: 'Share your suggestions...',
          required: false,
        },
        {
          id: 'recommendation',
          type: 'radio',
          label: 'Would you recommend us to a friend?',
          options: [
            'Definitely',
            'Probably',
            'Not Sure',
            'Probably Not',
            'Definitely Not',
          ],
          required: true,
        },
      ],
      styling: {
        fontFamily: { heading: 'Inter', body: 'Inter' },
        baseFontSize: 16,
        colors: {
          primary: '#10b981',
          primaryForeground: '#ffffff',
          background: '#f0fdf4',
          foreground: '#064e3b',
          card: '#ffffff',
          border: '#d1fae5',
        },
        form: {
          borderRadius: 16,
          shadow: 'md',
          maxWidth: '36rem',
          padding: 28,
        },
        buttons: { borderRadius: 8, style: 'solid' },
        fields: { borderRadius: 8, borderWidth: 2, focusRing: 'lg' },
      },
    },
    null,
    2,
  );
}

/**
 * Build the full system prompt for the Simple Form Builder AI.
 * Optionally appends the current form JSON when the user is editing.
 */
export function buildSimpleFormAISystemPrompt(
  currentSimpleFormPayload?: Record<string, unknown>,
): string {
  let system =
    SIMPLE_FORM_BUILDER_SYSTEM_PROMPT_INTRO +
    SIMPLE_FORM_SCHEMA_REFERENCE +
    '\n\nFull example (contact form). Follow this structure for all simple forms:\n\n```json\n' +
    getFullSimpleFormExampleJson() +
    '\n```\n\nExample registration form:\n```json\n' +
    getRegistrationFormExampleSnippet() +
    '\n```\n\nExample feedback form:\n```json\n' +
    getFeedbackFormExampleSnippet() +
    '\n```';

  if (
    currentSimpleFormPayload &&
    typeof currentSimpleFormPayload === 'object' &&
    (currentSimpleFormPayload.schema || currentSimpleFormPayload.name)
  ) {
    system +=
      '\n\nCurrent form (user is editing this; you may modify and return an updated full JSON):\n' +
      JSON.stringify(currentSimpleFormPayload, null, 2);
  }

  return system;
}
