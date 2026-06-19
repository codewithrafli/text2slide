/**
 * Playwright-based scraper - fallback for JS-rendered content
 * Only used when Cheerio fails
 */

import type { ScrapedContent } from './index';
import { ScrapingError } from '@/lib/errors';

export async function scrapeWithPlaywright(
  url: string
): Promise<ScrapedContent> {
  // Dynamic import to avoid loading Playwright unless needed
  const { chromium } = await import('playwright');

  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for content to settle
    await page.waitForTimeout(2000);

    const result = await page.evaluate(() => {
      // Remove noise
      document
        .querySelectorAll('script, style, nav, footer, header, aside')
        .forEach((el) => el.remove());

      // Try common content selectors
      const selectors = [
        'article',
        'main',
        '.post-content',
        '.entry-content',
        '#content',
      ];

      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el && el.textContent && el.textContent.trim().length > 200) {
          return {
            content: el.textContent.trim(),
            title:
              document.title ||
              document.querySelector('h1')?.textContent ||
              'Untitled',
          };
        }
      }

      return {
        content: document.body.innerText,
        title: document.title || 'Untitled',
      };
    });

    const content = result.content.replace(/\s+/g, ' ').trim();
    const wordCount = content.split(/\s+/).filter(Boolean).length;

    if (wordCount < 30) {
      throw new ScrapingError('CONTENT_TOO_SHORT', 'Not enough content found');
    }

    return {
      title: result.title,
      content,
      wordCount,
      source: 'playwright',
    };
  } finally {
    await browser.close();
  }
}
