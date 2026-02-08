import { Injectable, Logger } from '@nestjs/common';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { ModelMessage } from 'ai';

/**
 * Hardcoded system prompt for the Card Form Builder AI.
 * Not user-editable; change here or via env/file if you need to tune.
 */
const CARD_FORM_BUILDER_SYSTEM_PROMPT = `You are an assistant that helps users build card-style forms. Your job is to:
1. Ask clarifying questions to understand what kind of form they want (e.g. quiz, survey, onboarding, assessment).
2. When you have enough information, produce a complete Card Form Template as a single JSON object that the user can load into the form builder.

Rules:
- For images (card media, option images), only URLs are allowed. Tell the user to provide image links; there is no file upload in this flow.
- Output the form as valid JSON. When you are ready to deliver the form, put the entire JSON inside a markdown code block with the language tag \`\`\`json so the client can parse it.
- The JSON must include a "flowchartGraph" object with "nodes" (array) and "edges" (array). Each node has "id", "type" (one of: "start", "end", "question", "statement"), "position" ({ x, y }), and "data". Question nodes have data.field (FormField: id, type, label, options, etc.) and data.fieldType. Statement nodes have data.statementText, data.fieldId. Include "start" and "end" nodes; connect nodes with edges (source, target).
- Optional top-level fields: title, subtitle, submitButtonText, successMessage, cardSettings, styling, profileEstimation, version (use 1).
- Field types for questions: text, textarea, select, radio, checkbox, statement. For select/radio/checkbox, use "options" (array of strings or { value, imageUrl, altText } for image options).
- Keep the form concise unless the user asks for more. You may ask 1–3 short questions before generating the JSON.

When the user provides or you receive "current form" context (current card form data), you may output an updated full JSON that reflects their requested changes or additions. Otherwise create a new form from scratch.`;

@Injectable()
export class CardFormAIService {
  private readonly logger = new Logger(CardFormAIService.name);

  async chat(
    message: string,
    currentCardFormPayload?: Record<string, unknown>,
    conversationHistory?: Array<{ role: string; content: string }>,
  ): Promise<{ content: string }> {
    let system = CARD_FORM_BUILDER_SYSTEM_PROMPT;

    if (
      currentCardFormPayload &&
      typeof currentCardFormPayload === 'object' &&
      currentCardFormPayload.flowchartGraph
    ) {
      system +=
        '\n\nCurrent form (user is editing this; you may modify and return an updated full JSON):\n' +
        JSON.stringify(currentCardFormPayload, null, 2);
    }

    const history: ModelMessage[] = (conversationHistory || [])
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const messages: ModelMessage[] = [
      ...history,
      { role: 'user', content: message },
    ];

    const model = openai('gpt-4o-mini');

    try {
      const result = await generateText({
        model,
        system,
        messages,
        temperature: 0.6,
      });

      return { content: result.text };
    } catch (error) {
      this.logger.error('Card form AI chat failed', error);
      throw error;
    }
  }
}
