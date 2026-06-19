/**
 * OpenRouter API client for AI generation
 * Uses GPT-4o-mini with strict JSON schema for 100% reliable output
 */

import { AIError } from '@/lib/errors';
import { getSystemPrompt, getUserPrompt } from './prompts';
import {
  GenerationResponseSchema,
  GENERATION_JSON_SCHEMA,
  type GenerationResponse,
} from './schema';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// GPT-4o-mini: $0.15/M input, $0.60/M output
// Supports strict JSON schema for guaranteed output format
const MODEL = 'openai/gpt-4o-mini';

interface GenerateInput {
  content: string;
  sourceUrl: string;
}

/**
 * Generate LinkedIn post using GPT-4o-mini with strict JSON schema
 * No retry needed - strict schema guarantees valid output format
 */
export async function generateLinkedInPost(
  input: GenerateInput
): Promise<GenerationResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new AIError('CONFIG_ERROR', 'OpenRouter API key not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer':
          process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Link2Slide',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: getSystemPrompt() },
          {
            role: 'user',
            content: getUserPrompt(input.content, input.sourceUrl),
          },
        ],
        // Strict JSON schema
        response_format: {
          type: 'json_schema',
          json_schema: GENERATION_JSON_SCHEMA,
        },
        temperature: 0.7,
        max_tokens: 4096,
        // OpenRouter specific: Prefer stable providers
        provider: {
          allow_fallbacks: true,
          require_parameters: true,
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);
      throw new AIError('API_ERROR', `AI service error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new AIError('EMPTY_RESPONSE', 'AI returned empty response');
    }

    // 1. Clean potential markdown backticks and extra text
    content = content.trim();
    if (content.includes('```')) {
      const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) content = match[1];
    }
    content = content.trim();

    // 2. Robust Parse
    try {
      // Try standard parse first
      const parsed = JSON.parse(content);
      const cleaned = cleanOutput(parsed);
      return GenerationResponseSchema.parse(cleaned);
    } catch (parseError) {
      // 3. Attempt to fix common truncation issues (missing closing braces)
      if (parseError instanceof SyntaxError) {
        try {
          let fixedContent = content;
          const openBraces = (content.match(/\{/g) || []).length;
          const closeBraces = (content.match(/\}/g) || []).length;
          const openBrackets = (content.match(/\[/g) || []).length;
          const closeBrackets = (content.match(/\]/g) || []).length;

          // Add missing closing characters
          if (openBrackets > closeBrackets)
            fixedContent += ']'.repeat(openBrackets - closeBrackets);
          if (openBraces > closeBraces)
            fixedContent += '}'.repeat(openBraces - closeBraces);

          const fixedParsed = JSON.parse(fixedContent);
          const cleaned = cleanOutput(fixedParsed);
          return GenerationResponseSchema.parse(cleaned);
        } catch {
          // If still fails, log the original error
          console.error(
            'Final JSON Parse Error. Content preview:',
            content.slice(-100)
          );
        }
      }

      throw new AIError('PARSE_ERROR', 'AI returned invalid content structure');
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AIError('TIMEOUT', 'AI generation timed out after 90s');
    }

    if (error instanceof AIError) throw error;

    console.error('AI client error:', error);
    throw new AIError('INTERNAL_ERROR', 'AI generation failed');
  }
}

/**
 * Clean common markdown formatting from AI output to ensure clean text
 * LinkedIn does not support markdown, so we strip it to avoid showing raw symbols.
 */
function stripMarkdown(text: string): string {
  if (!text) return text;
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold **text**
    .replace(/\*(.*?)\*/g, '$1') // Italic *text*
    .replace(/__(.*?)__/g, '$1') // Bold __text__
    .replace(/_(.*?)_/g, '$1') // Italic _text_
    .replace(/`(.*?)`/g, '$1'); // Code `text`
}

/**
 * Recursively clean all strings in the output object
 */
function cleanOutput(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return stripMarkdown(obj);
  } else if (Array.isArray(obj)) {
    return obj.map(cleanOutput);
  } else if (typeof obj === 'object' && obj !== null) {
    const cleaned: Record<string, unknown> = {};
    for (const key in obj) {
      cleaned[key] = cleanOutput((obj as Record<string, unknown>)[key]);
    }
    return cleaned;
  }
  return obj;
}
