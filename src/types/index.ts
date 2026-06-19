/**
 * Shared type definitions
 */

export type {
  Slide,
  Caption,
  SuccessResponse,
  RejectionResponse,
  GenerationResponse,
} from '@/lib/ai/schema';
export type { Generation, GenerationInsert } from '@/lib/db/types';
export type { ScrapedContent } from '@/lib/scraper';

// API Response types
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
