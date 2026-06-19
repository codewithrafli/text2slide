/**
 * Zod schemas for AI output validation
 * Matches OpenAI strict JSON schema structure
 */

import { z } from 'zod';

const SlideSchema = z.object({
  type: z.enum(['hook', 'content', 'cta']),
  headline: z.string(),
  body: z.string().nullable(),
  emoji: z.string().nullable(),
});

const CaptionSchema = z.object({
  text: z.string(),
  style: z.enum(['professional', 'casual', 'provocative']),
});

/**
 * Flat schema matching OpenAI strict JSON schema
 * All fields present, nullable when not applicable
 */
const BaseResponseSchema = z.object({
  status: z.enum(['success', 'rejected']),
  // Success fields (null when rejected)
  slides: z.array(SlideSchema).nullable(),
  captions: z.array(CaptionSchema).nullable(),
  hashtags: z.array(z.string()).nullable(),
  // Rejection fields (null when success)
  reason: z
    .enum([
      'content_too_shallow',
      'no_actionable_insight',
      'spam_or_gibberish',
      'inappropriate_content',
    ])
    .nullable(),
  message: z.string().nullable(),
});

// Refined types for application use
export type Slide = z.infer<typeof SlideSchema>;
export type Caption = z.infer<typeof CaptionSchema>;

export interface SuccessResponse {
  status: 'success';
  slides: Slide[];
  captions: Caption[];
  hashtags: string[];
}

export interface RejectionResponse {
  status: 'rejected';
  reason:
    | 'content_too_shallow'
    | 'no_actionable_insight'
    | 'spam_or_gibberish'
    | 'inappropriate_content';
  message: string;
}

export type GenerationResponse = SuccessResponse | RejectionResponse;

/**
 * Parse and transform the flat API response into discriminated union
 */
export const GenerationResponseSchema = BaseResponseSchema.transform(
  (data): GenerationResponse => {
    if (data.status === 'success') {
      return {
        status: 'success',
        slides: data.slides || [],
        captions: data.captions || [],
        hashtags: data.hashtags || [],
      };
    }
    return {
      status: 'rejected',
      reason: data.reason!,
      message: data.message || 'Content not suitable for LinkedIn post',
    };
  }
);

/**
 * JSON Schema for OpenAI strict structured output
 *
 * OpenAI strict mode requirements:
 * - ALL properties must be in `required` array
 * - Optional fields use ["string", "null"] type
 * - additionalProperties must be false
 */
export const GENERATION_JSON_SCHEMA = {
  name: 'linkedin_post_generation',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['success', 'rejected'],
        description: 'Whether content was processed or rejected',
      },
      // Success fields (null when rejected)
      slides: {
        type: ['array', 'null'],
        description: 'Array of 5-8 carousel slides (null if rejected)',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['hook', 'content', 'cta'],
              description: 'Slide type',
            },
            headline: {
              type: 'string',
              description: 'Main headline, max 60 chars',
            },
            body: {
              type: ['string', 'null'],
              description: 'Body text, max 150 chars',
            },
            emoji: {
              type: ['string', 'null'],
              description: 'Emoji for the slide',
            },
          },
          required: ['type', 'headline', 'body', 'emoji'],
          additionalProperties: false,
        },
      },
      captions: {
        type: ['array', 'null'],
        description: 'Exactly 3 caption suggestions (null if rejected)',
        items: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Caption text, max 1500 chars',
            },
            style: {
              type: 'string',
              enum: ['professional', 'casual', 'provocative'],
              description: 'Caption tone',
            },
          },
          required: ['text', 'style'],
          additionalProperties: false,
        },
      },
      hashtags: {
        type: ['array', 'null'],
        description: 'Up to 5 hashtags (null if rejected)',
        items: {
          type: 'string',
        },
      },
      // Rejection fields (null when success)
      reason: {
        type: ['string', 'null'],
        enum: [
          'content_too_shallow',
          'no_actionable_insight',
          'spam_or_gibberish',
          'inappropriate_content',
          null,
        ],
        description: 'Rejection reason code (null if success)',
      },
      message: {
        type: ['string', 'null'],
        description: 'Rejection message (null if success)',
      },
    },
    required: ['status', 'slides', 'captions', 'hashtags', 'reason', 'message'],
    additionalProperties: false,
  },
} as const;
