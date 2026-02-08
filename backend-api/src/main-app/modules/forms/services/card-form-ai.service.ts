import { Injectable, Logger } from '@nestjs/common';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { ModelMessage } from 'ai';
import { buildCardFormAISystemPrompt } from '../config/card-form-ai-prompt.config';

@Injectable()
export class CardFormAIService {
  private readonly logger = new Logger(CardFormAIService.name);

  async chat(
    message: string,
    currentCardFormPayload?: Record<string, unknown>,
    conversationHistory?: Array<{ role: string; content: string }>,
  ): Promise<{ content: string }> {
    const system = buildCardFormAISystemPrompt(currentCardFormPayload);

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
