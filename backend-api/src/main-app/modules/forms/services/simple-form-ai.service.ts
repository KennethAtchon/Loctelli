import { Injectable, Logger } from '@nestjs/common';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { ModelMessage } from 'ai';
import { buildSimpleFormAISystemPrompt } from '../config/simple-form-ai-prompt.config';

@Injectable()
export class SimpleFormAIService {
  private readonly logger = new Logger(SimpleFormAIService.name);

  async chat(
    message: string,
    currentSimpleFormPayload?: Record<string, unknown>,
    conversationHistory?: Array<{ role: string; content: string }>,
  ): Promise<{ content: string }> {
    const system = buildSimpleFormAISystemPrompt(currentSimpleFormPayload);

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
      this.logger.error('Simple form AI chat failed', error);
      throw error;
    }
  }
}
