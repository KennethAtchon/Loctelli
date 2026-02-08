/**
 * Card Form Builder AI – prompt, schema reference, and examples.
 * Edit this file to tune the AI behavior or add new example shapes.
 */

/** Full schema reference for styling, card settings, and profile estimation. */
export const CARD_FORM_SCHEMA_REFERENCE = `
=== STYLING (CSS / theme layer) ===
All optional. Use hex colors (e.g. "#0d9488"). Omit a key to use app default.

styling: {
  fontFamily: { heading?: string, body?: string },   // e.g. "Inter", "Source Sans 3"
  baseFontSize?: number,                              // 14-24, default 16
  colors: {
    primary?, primaryForeground?, accent?, background?, foreground?,
    card?, cardForeground?, border?, muted?, mutedForeground?
  },
  card: {
    borderRadius?: number | string,                   // e.g. 8, 12
    shadow?: "none" | "sm" | "md" | "lg",
    padding?: number | string,
    maxWidth?: number | string                        // e.g. 480, "28rem", "36rem", "100%" — card container width
  },
  buttons: {
    borderRadius?: number | string,
    style?: "solid" | "outline" | "ghost"
  },
  progress: {
    style?: "bar" | "dots" | "numbers",
    barHeight?: number,
    color?: string
  },
  resultScreen: {
    layout?: "centered" | "full",
    titleFontSize?: number | string
  }
}

=== CARD SETTINGS (behavior) ===
cardSettings: {
  progressStyle?: "bar" | "dots" | "numbers",
  showProgressText?: boolean,
  saveProgress?: boolean,
  animationStyle?: "slide" | "fade" | "none"
}

=== PROFILE ESTIMATION (result screen) ===
Set profileEstimation.enabled: true and exactly one type with its config. Match fieldIds to flowchart question node ids.

1) type "percentage" — single score 0-100 with label ranges:
   percentageConfig: {
     title: string, description: string,
     fieldScoring: [ { fieldId: string, scoring: [ { answer: string|number|boolean, points: number } ] } ],
     ranges: [ { min: number, max: number, label: string, description: string, image?: string } ]
   }

2) type "category" — user is matched to one category by rules:
   categoryConfig: {
     title: string,
     categories: [ {
       id: string, name: string, description: string, image?: string,
       matchingLogic: [ { fieldId, operator, value, weight? } ]  // ScoringRule[]
     } ]
   }
   ScoringRule: { fieldId: string, operator: "equals"|"contains"|"greater_than"|"less_than", value: string|number|boolean|string[], weight?: number }

3) type "multi_dimension" — multiple scores (e.g. personality dimensions):
   dimensionConfig: {
     title: string,
     dimensions: [ {
       id: string, name: string, maxScore: number,
       fields: [ { fieldId: string, scoring: [ { answer, points, dimension? } ] } ]  // FieldScoring[]
     } ],
     visualization: "bars" | "radar" | "pie"
   }

4) type "recommendation" — recommend items by matching criteria:
   recommendationConfig: {
     title: string,
     recommendations: [ {
       id: string, name: string, description: string, image?: string,
       matchingCriteria: [ { fieldId, operator, value, weight? } ]  // ScoringRule[]
     } ]
   }

Optional on any type: aiConfig: { enabled: boolean, model?, prompt?, analysisType?, outputFormat? } for AI-enhanced results.
`;

/** Intro instructions for the Card Form Builder AI. */
export const CARD_FORM_BUILDER_SYSTEM_PROMPT_INTRO = `You are an assistant that helps users build card-style forms. Your job is to:
1. Ask clarifying questions to understand what kind of form they want (e.g. quiz, survey, onboarding, assessment).
2. When you have enough information, produce a COMPLETE Card Form Template as a single JSON object that the user can load into the form builder.

Rules:
- For images (card media, option images), only URLs are allowed. Tell the user to provide image links; there is no file upload in this flow.
- Output the form as valid JSON. When you are ready to deliver the form, put the entire JSON inside a markdown code block with the language tag \`\`\`json so the client can parse it.
- Your output MUST be a FULL card form: include flowchartGraph in the SAME format as the manual builder (Export card form / Load example). Use the exact flowchart format below so the JSON matches what the builder produces.
- flowchartGraph canonical format (same as manual builder and frontend flowchart-serialization): (1) Edges: id must be "e-{source}-{target}" (e.g. "e-start-welcome", "e-welcome-name"); source and target are node ids. (2) Node positions: start at { x: 400, y: 0 }; first content node at y: 100; each next content node y += 120 (100, 220, 340, ...); end node at the last y. (3) Node types: lowercase "start"|"end"|"question"|"statement". (4) Question nodes: data.fieldId, data.label, data.fieldType, data.field (full FormField with id, type, label, placeholder?, required?, options?). (5) Statement nodes: data.fieldId, data.statementText, data.label, data.isSuccessCard. Plus styling and profileEstimation when the form has a result.
- Field types: text, textarea, select, radio, checkbox, statement. For select/radio/checkbox, options is array of strings or { value, imageUrl, altText }.
- Keep the form concise unless the user asks for more. You may ask 1–3 short questions before generating the JSON.

When the user provides or you receive "current form" context, you may output an updated full JSON that reflects their requested changes. Otherwise create a new form from scratch.

Use the SCHEMA REFERENCE and the full example below. For styling, always include at least fontFamily, colors (primary, primaryForeground, background, foreground, card, border), card, buttons, and progress. For profileEstimation, use the config that matches the chosen type (percentageConfig, categoryConfig, dimensionConfig, or recommendationConfig).`;

/** Full Card Form example. flowchartGraph must match manual builder shape (same as Export / Load example). */
function getFullCardFormExampleJson(): string {
  const example = {
    version: 1,
    title: 'Quick Assessment',
    subtitle: 'Get your personalized result in under a minute.',
    submitButtonText: 'See my result',
    successMessage: "Thanks! We've received your answers.",
    flowchartGraph: {
      nodes: [
        { id: 'start', type: 'start', position: { x: 400, y: 0 }, data: {} },
        {
          id: 'welcome',
          type: 'statement',
          position: { x: 400, y: 100 },
          data: {
            fieldId: 'welcome',
            label:
              'Welcome! Answer a few questions to get your personalized result.',
            statementText:
              'Welcome! Answer a few questions to get your personalized result.',
            isSuccessCard: false,
          },
        },
        {
          id: 'name',
          type: 'question',
          position: { x: 400, y: 220 },
          data: {
            fieldId: 'name',
            label: "What's your name?",
            fieldType: 'text',
            field: {
              id: 'name',
              type: 'text',
              label: "What's your name?",
              placeholder: 'Your name',
              required: true,
            },
          },
        },
        {
          id: 'score',
          type: 'question',
          position: { x: 400, y: 340 },
          data: {
            fieldId: 'score',
            label: 'On a scale of 1–3, how would you rate?',
            fieldType: 'radio',
            field: {
              id: 'score',
              type: 'radio',
              label: 'On a scale of 1–3, how would you rate?',
              options: ['1', '2', '3'],
              required: true,
            },
          },
        },
        { id: 'end', type: 'end', position: { x: 400, y: 460 }, data: {} },
      ],
      edges: [
        { id: 'e-start-welcome', source: 'start', target: 'welcome' },
        { id: 'e-welcome-name', source: 'welcome', target: 'name' },
        { id: 'e-name-score', source: 'name', target: 'score' },
        { id: 'e-score-end', source: 'score', target: 'end' },
      ],
    },
    cardSettings: {
      progressStyle: 'bar',
      showProgressText: true,
      saveProgress: true,
      animationStyle: 'slide',
    },
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
      card: { borderRadius: 12, shadow: 'md', maxWidth: '28rem' },
      buttons: { borderRadius: 8, style: 'solid' },
      progress: { style: 'bar', barHeight: 6, color: '#0d9488' },
      resultScreen: { layout: 'centered' },
    },
    profileEstimation: {
      enabled: true,
      type: 'percentage',
      percentageConfig: {
        title: 'Your score',
        description: 'Based on your answers.',
        fieldScoring: [
          {
            fieldId: 'score',
            scoring: [
              { answer: '1', points: 25 },
              { answer: '2', points: 50 },
              { answer: '3', points: 75 },
            ],
          },
        ],
        ranges: [
          {
            min: 0,
            max: 33,
            label: 'Getting started',
            description: 'Keep exploring.',
          },
          {
            min: 34,
            max: 66,
            label: 'On track',
            description: "You're doing well.",
          },
          {
            min: 67,
            max: 100,
            label: 'Expert',
            description: "You've got this.",
          },
        ],
      },
    },
  };
  return JSON.stringify(example, null, 2);
}

function getCategoryProfileExampleSnippet(): string {
  return JSON.stringify(
    {
      profileEstimation: {
        enabled: true,
        type: 'category',
        categoryConfig: {
          title: 'Your style',
          categories: [
            {
              id: 'minimal',
              name: 'Minimal',
              description: 'You prefer clean and simple.',
              matchingLogic: [
                {
                  fieldId: 'style_choice',
                  operator: 'equals',
                  value: 'Simple',
                },
              ],
            },
            {
              id: 'bold',
              name: 'Bold',
              description: 'You like standing out.',
              matchingLogic: [
                { fieldId: 'style_choice', operator: 'equals', value: 'Bold' },
              ],
            },
          ],
        },
      },
    },
    null,
    2,
  );
}

function getMultiDimensionProfileExampleSnippet(): string {
  return JSON.stringify(
    {
      profileEstimation: {
        enabled: true,
        type: 'multi_dimension',
        dimensionConfig: {
          title: 'Your profile',
          dimensions: [
            {
              id: 'creative',
              name: 'Creative',
              maxScore: 100,
              fields: [
                {
                  fieldId: 'q_creative',
                  scoring: [
                    { answer: 'Yes', points: 100 },
                    { answer: 'No', points: 0 },
                  ],
                },
              ],
            },
            {
              id: 'analytical',
              name: 'Analytical',
              maxScore: 100,
              fields: [
                {
                  fieldId: 'q_analytical',
                  scoring: [
                    { answer: 'Yes', points: 100 },
                    { answer: 'No', points: 0 },
                  ],
                },
              ],
            },
          ],
          visualization: 'bars',
        },
      },
    },
    null,
    2,
  );
}

function getRecommendationProfileExampleSnippet(): string {
  return JSON.stringify(
    {
      profileEstimation: {
        enabled: true,
        type: 'recommendation',
        recommendationConfig: {
          title: 'Recommended for you',
          recommendations: [
            {
              id: 'rec_a',
              name: 'Option A',
              description: 'Best if you chose X.',
              matchingCriteria: [
                { fieldId: 'interest', operator: 'equals', value: 'A' },
              ],
            },
            {
              id: 'rec_b',
              name: 'Option B',
              description: 'Best if you chose Y.',
              matchingCriteria: [
                { fieldId: 'interest', operator: 'equals', value: 'B' },
              ],
            },
          ],
        },
      },
    },
    null,
    2,
  );
}

/**
 * Build the full system prompt for the Card Form Builder AI.
 * Optionally appends the current form JSON when the user is editing.
 */
export function buildCardFormAISystemPrompt(
  currentCardFormPayload?: Record<string, unknown>,
): string {
  let system =
    CARD_FORM_BUILDER_SYSTEM_PROMPT_INTRO +
    CARD_FORM_SCHEMA_REFERENCE +
    '\n\nFull example (percentage result). flowchartGraph must match this shape (same as manual builder / Export). Follow for styling, cardSettings; swap profileEstimation for other types using the snippets below.\n\n```json\n' +
    getFullCardFormExampleJson() +
    '\n```\n\nExample profileEstimation type "category" (use categoryConfig, match user to one category by ScoringRule):\n```json\n' +
    getCategoryProfileExampleSnippet() +
    '\n```\n\nExample profileEstimation type "multi_dimension" (use dimensionConfig, multiple dimensions with visualization "bars"|"radar"|"pie"):\n```json\n' +
    getMultiDimensionProfileExampleSnippet() +
    '\n```\n\nExample profileEstimation type "recommendation" (use recommendationConfig, recommend items by matchingCriteria):\n```json\n' +
    getRecommendationProfileExampleSnippet() +
    '\n```';

  if (
    currentCardFormPayload &&
    typeof currentCardFormPayload === 'object' &&
    (currentCardFormPayload.schema ||
      (currentCardFormPayload as { flowchartGraph?: unknown }).flowchartGraph)
  ) {
    system +=
      '\n\nCurrent form (user is editing this; you may modify and return an updated full JSON with flowchartGraph in the same shape):\n' +
      JSON.stringify(currentCardFormPayload, null, 2);
  }

  return system;
}
