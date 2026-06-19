/**
 * Cheerio-based scraper - fast path for static content
 */

import * as cheerio from 'cheerio';
import type { ScrapedContent } from './index';
import { ScrapingError } from '@/lib/errors';

export async function scrapeWithCheerio(url: string): Promise<ScrapedContent> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; LinkedInPostBot/1.0; +https://link2slide.vercel.app)',
    },
  });

  if (!response.ok) {
    throw new ScrapingError('FETCH_FAILED', `HTTP ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove script, style, nav, footer elements
  $('script, style, nav, footer, header, aside').remove();

  // Try to find main content
  const selectors = [
    'article',
    'main',
    '.post-content',
    '.entry-content',
    '#content',
    '.content',
  ];

  let content = '';
  for (const selector of selectors) {
    const el = $(selector);
    if (el.length && el.text().trim().length > 200) {
      content = el.text().trim();
      break;
    }
  }

  // Fallback to body
  if (!content) {
    content = $('body').text().trim();
  }

  // Clean up whitespace
  content = content.replace(/\s+/g, ' ').trim();

  const title =
    $('title').text().trim() || $('h1').first().text().trim() || 'Untitled';
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  if (wordCount < 30) {
    throw new ScrapingError('CONTENT_TOO_SHORT', 'Not enough content found');
  }

  return {
    title,
    content,
    wordCount,
    source: 'cheerio',
  };
}
