/**
 * App-wide constants
 */

export const APP_CONFIG = {
  name: 'Link2Slide | AI LinkedIn Carousel Generator',
  description:
    'Convert any URL into a high-engaging LinkedIn carousel PDF with ghostwritten AI captions.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const;

export const LIMITS = {
  ratePerDay: parseInt(process.env.RATE_LIMIT_PER_DAY || '5', 10),
  minContentChars: 200,
  minContentWords: 50,
  maxContentChars: 10000,
  minSlides: 5,
  maxSlides: 8,
} as const;

export const PDF_CONFIG = {
  width: 1080,
  height: 1350,
  aspectRatio: '4:5' as const,
} as const;
