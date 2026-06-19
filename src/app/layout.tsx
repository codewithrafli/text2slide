import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://link2slide.vercel.app'),
  title: {
    default: 'Link2Slide | AI LinkedIn Carousel Generator',
    template: '%s | Link2Slide',
  },
  description:
    'Convert any URL or text into viral LinkedIn Carousels in seconds. The #1 free tool for content creators to turn articles into high-engagement PDF carousels with AI ghostwriting.',
  keywords: [
    'LinkedIn Carousel Generator',
    'AI Content Generator',
    'URL to Carousel',
    'LinkedIn Ghostwriter',
    'Free AI Tools',
    'Content Creator Tools',
    'Social Media Automation',
    'Link2Slide',
  ],
  authors: [{ name: 'Link2Slide Team' }],
  creator: 'Link2Slide',
  publisher: 'Link2Slide',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Link2Slide | Turn Links into Viral LinkedIn Carousels',
    description:
      'The fastest way to create authority-building LinkedIn carousels. Paste a link, get a beautiful PDF carousel ready to post.',
    url: 'https://link2slide.vercel.app',
    siteName: 'Link2Slide',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Link2Slide - URL to LinkedIn Carousel',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Link2Slide | AI LinkedIn Carousel Generator',
    description:
      'Turn any article into a high-converting LinkedIn carousel PDF with AI.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-id', // User to replace
    yandex: 'yandex-verification-id',
    other: {
      'msvalidate.01': 'bing-verification-id',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${fraunces.variable} font-sans`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
