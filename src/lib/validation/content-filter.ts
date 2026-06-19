/**
 * Pre-AI content validation - catches garbage before wasting API calls
 */

import { ValidationError } from '@/lib/errors';

const MIN_CHARACTERS = 200;
const MIN_WORDS = 50;
const MIN_ALPHA_RATIO = 0.5;

export interface ValidationResult {
  valid: boolean;
  wordCount: number;
  charCount: number;
}

/**
 * Validates extracted content before sending to AI
 * Throws ValidationError if content doesn't meet criteria
 */
export function validateContent(content: string): ValidationResult {
  const normalized = content.trim();
  const charCount = normalized.length;
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;

  // Check character count
  if (charCount < MIN_CHARACTERS) {
    throw new ValidationError(
      'CONTENT_TOO_SHORT',
      `Content has ${charCount} characters. Need at least ${MIN_CHARACTERS}.`
    );
  }

  // Check word count
  if (wordCount < MIN_WORDS) {
    throw new ValidationError(
      'TOO_FEW_WORDS',
      `Content has ${wordCount} words. Need at least ${MIN_WORDS}.`
    );
  }

  // Check if mostly readable text (not code/symbols)
  const alphaCount = (normalized.match(/[a-zA-Z]/g) || []).length;
  const alphaRatio = alphaCount / charCount;

  if (alphaRatio < MIN_ALPHA_RATIO) {
    throw new ValidationError(
      'NOT_READABLE',
      'Content appears to be mostly code or symbols. Need readable text.'
    );
  }

  return { valid: true, wordCount, charCount };
}
