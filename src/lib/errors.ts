/**
 * Custom error classes for consistent error handling
 */

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

export class ScrapingError extends AppError {
  constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(code, message, details);
    this.name = 'ScrapingError';
  }
}

export class ValidationError extends AppError {
  constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(code, message, details);
    this.name = 'ValidationError';
  }
}

export class AIError extends AppError {
  constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(code, message, details);
    this.name = 'AIError';
  }
}

export class RateLimitError extends AppError {
  constructor(
    public remaining: number,
    public resetAt: number
  ) {
    super('RATE_LIMITED', 'Rate limit exceeded. Try again tomorrow.');
    this.name = 'RateLimitError';
  }
}
