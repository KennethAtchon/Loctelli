import type { CardFormTemplateJson } from "./card-form-template-json";
import { isCardFormTemplateJson } from "./card-form-template-json";

/**
 * Extract Card Form Template JSON from assistant text (e.g. markdown ```json block or raw JSON).
 * Returns the first valid CardFormTemplateJson found, or null.
 */
export function extractCardFormJsonFromText(text: string): CardFormTemplateJson | null {
  if (!text || typeof text !== "string") return null;

  // Try markdown code block first (```json ... ```)
  const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    try {
      const parsed = JSON.parse(jsonBlockMatch[1].trim()) as unknown;
      if (isCardFormTemplateJson(parsed)) return parsed;
    } catch {
      // ignore
    }
  }

  // Try to find a raw JSON object (starts with { and has flowchartGraph)
  const objectMatch = text.match(/\{[\s\S]*"flowchartGraph"[\s\S]*\}/);
  if (objectMatch) {
    try {
      const parsed = JSON.parse(objectMatch[0]) as unknown;
      if (isCardFormTemplateJson(parsed)) return parsed;
    } catch {
      // ignore
    }
  }

  return null;
}
