import type { NormalizedIntakePayload } from "./normalize";

export interface OpenAIExtractionResult {
  urgency: "low" | "medium" | "high" | null;
  preferredContactTime: string | null;
  additionalRequirements: string[];
  sentiment: "positive" | "neutral" | "negative" | null;
  rawSummary: string | null;
}

export async function processWithOpenAI(
  _normalized: NormalizedIntakePayload
): Promise<OpenAIExtractionResult> {
  // TODO: Implement OpenAI extraction
  // Suggested prompt: extract urgency, preferred contact time, additional service requirements,
  // and sentiment from the customer's notes field.
  //
  // Example implementation:
  // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  // const response = await openai.chat.completions.create({
  //   model: "gpt-4o-mini",
  //   messages: [{ role: "user", content: buildExtractionPrompt(normalized) }],
  //   response_format: { type: "json_object" },
  // });
  // return JSON.parse(response.choices[0].message.content);

  return {
    urgency: null,
    preferredContactTime: null,
    additionalRequirements: [],
    sentiment: null,
    rawSummary: null,
  };
}
