/**
 * Reddit-specific extractor using their JSON API
 * No scraping needed - just append .json to URL
 */

import type { ScrapedContent } from '../index';
import { ScrapingError } from '@/lib/errors';

interface RedditPost {
  title: string;
  selftext: string;
  subreddit: string;
  author: string;
  score: number;
}

interface RedditComment {
  body: string;
  author: string;
  score: number;
}

export async function extractRedditContent(
  url: string
): Promise<ScrapedContent> {
  // Convert to JSON endpoint
  const jsonUrl = url.replace(/\/?(\?.*)?$/, '.json$1');

  const response = await fetch(jsonUrl, {
    headers: {
      'User-Agent': 'LinkedInPostBot/1.0',
    },
  });

  if (!response.ok) {
    throw new ScrapingError(
      'FETCH_FAILED',
      `Reddit API returned ${response.status}`
    );
  }

  const data = await response.json();

  // Reddit returns [post, comments] array
  const postData = data[0]?.data?.children?.[0]?.data as RedditPost | undefined;
  const commentsData = data[1]?.data?.children || [];

  if (!postData) {
    throw new ScrapingError('EXTRACTION_FAILED', 'Could not parse Reddit post');
  }

  // Extract top comments (by score)
  const topComments = commentsData
    .filter(
      (c: { kind: string; data: RedditComment }) =>
        c.kind === 't1' && c.data?.body
    )
    .map((c: { data: RedditComment }) => c.data)
    .sort((a: RedditComment, b: RedditComment) => b.score - a.score)
    .slice(0, 5)
    .map((c: RedditComment) => c.body);

  // Combine post + top comments
  const content = [
    `Title: ${postData.title}`,
    '',
    postData.selftext || '(Link post)',
    '',
    '--- Top Comments ---',
    ...topComments,
  ].join('\n\n');

  const wordCount = content.split(/\s+/).filter(Boolean).length;

  return {
    title: postData.title,
    content,
    wordCount,
    source: 'reddit-json',
  };
}
