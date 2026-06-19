/**
 * POST /api/scrape - Extract content from URL
 */

import { NextResponse } from 'next/server';
import { scrapeUrl } from '@/lib/scraper';
import { validateContent } from '@/lib/validation/content-filter';
import { checkRateLimit, hashIp } from '@/lib/rate-limit';
import { AppError, RateLimitError } from '@/lib/errors';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Get IP for rate limiting
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    // Check rate limit
    await checkRateLimit(ip);

    // Parse request body
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_INPUT', message: 'URL is required' },
        },
        { status: 400 }
      );
    }

    // Scrape the URL
    const scraped = await scrapeUrl(url);

    // Validate content
    const validation = validateContent(scraped.content);

    return NextResponse.json({
      success: true,
      data: {
        title: scraped.title,
        content: scraped.content,
        wordCount: validation.wordCount,
        charCount: validation.charCount,
        source: scraped.source,
        ipHash: hashIp(ip),
      },
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'RATE_LIMITED', message: error.message },
        },
        { status: 429, headers: { 'X-RateLimit-Reset': String(error.resetAt) } }
      );
    }

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.toJSON() },
        { status: 422 }
      );
    }

    console.error('Scrape error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}
