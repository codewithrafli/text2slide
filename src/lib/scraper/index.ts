/**
 * Scraping orchestrator - decides which method to use based on URL
 */

import { scrapeWithCheerio } from './cheerio';
import { scrapeWithPlaywright } from './playwright';
import { extractRedditContent } from './extractors/reddit';
import { ScrapingError } from '@/lib/errors';

export interface ScrapedContent {
  title: string;
  content: string;
  wordCount: number;
  source: 'cheerio' | 'playwright' | 'reddit-json';
}

/**
 * Main scraping function - handles all URL types
 */
export async function scrapeUrl(url: string): Promise<ScrapedContent> {
  // Validate URL
  if (!isValidUrl(url)) {
    throw new ScrapingError('INVALID_URL', 'Please provide a valid URL');
  }

  // Reddit gets special handling
  if (isRedditUrl(url)) {
    return extractRedditContent(url);
  }

  // Try Cheerio first (fast path)
  try {
    return await scrapeWithCheerio(url);
  } catch {
    // Fall back to Playwright for JS-rendered content
    try {
      return await scrapeWithPlaywright(url);
    } catch {
      throw new ScrapingError(
        'EXTRACTION_FAILED',
        'Could not extract content from this URL. Use another URL.'
      );
    }
  }
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isRedditUrl(url: string): boolean {
  return /reddit\.com/.test(url);
}
