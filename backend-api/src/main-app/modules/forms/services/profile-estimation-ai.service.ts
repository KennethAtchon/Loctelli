import { Injectable, Logger } from '@nestjs/common';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
// Note: Using any for JSON fields from Prisma
interface ProfileEstimation {
  enabled: boolean;
  type: string;
  aiConfig?: any;
  percentageConfig?: any;
  categoryConfig?: any;
  dimensionConfig?: any;
  recommendationConfig?: any;
}

interface FormField {
  id: string;
  type: string;
  label: string;
  [key: string]: any;
}

interface AIProfileConfig {
  enabled: boolean;
  model?: string;
  prompt?: string;
  analysisType?: string;
  outputFormat?: string;
}

interface ProfileEstimationRequest {
  profileEstimation: ProfileEstimation;
  answers: Record<string, unknown>;
  fields: FormField[];
  ruleBasedResult?: any;
}

interface AIAnalysisResult {
  score?: number;
  category?: string;
  description?: string;
  confidence?: number;
  insights?: string[];
  recommendations?: Array<{
    name: string;
    description: string;
    matchScore: number;
  }>;
}

@Injectable()
export class ProfileEstimationAIService {
  private readonly logger = new Logger(ProfileEstimationAIService.name);

  /**
   * Enhance profile estimation result with AI analysis
   */
  async enhanceWithAI(
    request: ProfileEstimationRequest,
  ): Promise<AIAnalysisResult> {
    const { profileEstimation, answers, fields, ruleBasedResult } = request;
    const aiConfig = (profileEstimation.aiConfig as AIProfileConfig) || {};

    if (!aiConfig.enabled) {
      throw new Error('AI is not enabled for this form');
    }

    try {
      const prompt = this.buildPrompt(
        profileEstimation,
        answers,
        fields,
        ruleBasedResult,
        aiConfig,
      );

      const model = this.getModel(aiConfig.model || 'gpt-4');

      const result = await generateText({
        model,
        prompt,
        temperature: 0.7,
      });

      return this.parseAIResponse(
        result.text,
        profileEstimation.type,
        aiConfig.outputFormat,
      );
    } catch (error) {
      this.logger.error('AI enhancement failed', error);
      // Return rule-based result as fallback
      return this.getRuleBasedFallback(ruleBasedResult, profileEstimation.type);
    }
  }

  /**
   * Build the prompt for AI analysis
   */
  private buildPrompt(
    profileEstimation: ProfileEstimation,
    answers: Record<string, unknown>,
    fields: FormField[],
    ruleBasedResult: any,
    aiConfig: AIProfileConfig,
  ): string {
    const customPrompt = aiConfig.prompt;
    const analysisType = aiConfig.analysisType || 'personality';
    const outputFormat = aiConfig.outputFormat || 'category';

    // Format answers for context
    const answersText = fields
      .map((field) => {
        const answer = answers[field.id];
        if (answer === undefined || answer === null || answer === '')
          return null;
        const answerStr = Array.isArray(answer)
          ? answer.join(', ')
          : typeof answer === 'string' ||
              typeof answer === 'number' ||
              typeof answer === 'boolean'
            ? String(answer)
            : JSON.stringify(answer);
        return `Q: ${field.label}\nA: ${answerStr}`;
      })
      .filter(Boolean)
      .join('\n\n');

    let prompt = '';

    if (customPrompt) {
      prompt = customPrompt;
    } else {
      // Default prompts based on analysis type
      switch (analysisType) {
        case 'sentiment':
          prompt = `Analyze the sentiment and emotional tone of the user's responses. Identify their feelings, concerns, and overall attitude.`;
          break;
        case 'personality':
          prompt = `Analyze the user's personality traits based on their answers. Identify key characteristics, preferences, and behavioral patterns.`;
          break;
        case 'recommendation':
          prompt = `Based on the user's answers, provide personalized recommendations. Consider their preferences, needs, and responses to suggest the best options.`;
          break;
      }
    }

    // Add context
    prompt += `\n\nUser Responses:\n${answersText}\n\n`;

    // Add rule-based result context if available
    if (ruleBasedResult) {
      prompt += `\nRule-based result: ${JSON.stringify(ruleBasedResult, null, 2)}\n\n`;
    }

    // Add output format instructions
    switch (outputFormat) {
      case 'percentage':
        prompt += `\nProvide a percentage score (0-100) and a brief description explaining the score. Format: {"score": number, "description": "string"}`;
        break;
      case 'category':
        prompt += `\nProvide a category name and personalized description. Format: {"category": "string", "description": "string", "confidence": number}`;
        break;
      case 'freeform':
        prompt += `\nProvide personalized insights and recommendations. Format: {"description": "string", "insights": ["string"], "recommendations": [{"name": "string", "description": "string", "matchScore": number}]}`;
        break;
    }

    return prompt;
  }

  /**
   * Get the AI model based on configuration
   */
  private getModel(modelType: string) {
    switch (modelType) {
      case 'gpt-4':
        return openai('gpt-4o-mini');
      case 'claude':
        // Note: Would need @ai-sdk/anthropic for Claude
        // For now, fallback to OpenAI
        return openai('gpt-4o-mini');
      default:
        return openai('gpt-4o-mini');
    }
  }

  /**
   * Parse AI response based on output format
   */
  private parseAIResponse(
    text: string,
    resultType: string,
    outputFormat?: string,
  ): AIAnalysisResult {
    try {
      // Try to parse as JSON first
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }

      // Fallback: extract structured data from text
      const result: AIAnalysisResult = {};

      // Extract score if present
      const scoreMatch = text.match(/(\d+)%/);
      if (scoreMatch) {
        result.score = parseInt(scoreMatch[1]);
      }

      // Extract description
      const descriptionMatch = text.match(/description[:\s]+"([^"]+)"/i);
      if (descriptionMatch) {
        result.description = descriptionMatch[1];
      } else {
        // Use first paragraph as description
        const paragraphs = text.split('\n\n').filter((p) => p.trim());
        if (paragraphs.length > 0) {
          result.description = paragraphs[0].trim();
        }
      }

      // Extract category if present
      const categoryMatch = text.match(/category[:\s]+"([^"]+)"/i);
      if (categoryMatch) {
        result.category = categoryMatch[1];
      }

      // Extract confidence if present
      const confidenceMatch = text.match(/confidence[:\s]+(\d+)/i);
      if (confidenceMatch) {
        result.confidence = parseInt(confidenceMatch[1]);
      }

      return result;
    } catch (error) {
      this.logger.warn('Failed to parse AI response', error);
      return {
        description: text.substring(0, 500), // Use raw text as fallback
      };
    }
  }

  /**
   * Get rule-based fallback when AI fails
   */
  private getRuleBasedFallback(
    ruleBasedResult: any,
    resultType: string,
  ): AIAnalysisResult {
    if (!ruleBasedResult) {
      return {
        description:
          'Unable to generate AI analysis. Using rule-based results.',
      };
    }

    // Enhance rule-based result with AI-friendly structure
    return {
      score: ruleBasedResult.score,
      category: ruleBasedResult.category?.name || ruleBasedResult.range,
      description:
        ruleBasedResult.description || ruleBasedResult.category?.description,
      confidence: ruleBasedResult.confidence || 80,
    };
  }
}
