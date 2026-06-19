import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://link2slide.vercel.app',
      lastModified: new Date('2026-01-27').toISOString(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
}
