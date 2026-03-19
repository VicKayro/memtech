import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number; json?: boolean }
): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: options?.maxTokens ?? 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const block = response.content[0];
  if (block.type === 'text') {
    return block.text;
  }
  throw new Error('Unexpected response type from Claude');
}

export async function callClaudeJSON<T>(
  systemPrompt: string,
  userMessage: string,
  maxTokens?: number
): Promise<T> {
  const text = await callClaude(systemPrompt, userMessage, { maxTokens: maxTokens ?? 4096 });

  // Extract JSON from potential markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();

  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    // If Claude didn't return valid JSON, try to find JSON object in the text
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]) as T;
    }
    throw new Error(`Réponse Claude non-JSON: ${text.slice(0, 200)}`);
  }
}
