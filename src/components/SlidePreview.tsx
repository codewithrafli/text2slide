import React from 'react';
import Image from 'next/image';
import { CarouselStyle } from '@/lib/pdf/generator';

interface Slide {
  headline: string;
  body: string | null;
  type: string;
  emoji?: string | null;
}

interface Personalization {
  style: CarouselStyle;
  handle: string;
  profilePic: string | null;
  showSource: boolean;
}

interface ThemeConfig {
  bg: string;
  text: string;
  accent: string;
  secondary: string;
  bar: string;
}

const THEME_STYLES: Record<CarouselStyle, ThemeConfig> = {
  minimalist: {
    bg: 'bg-white',
    text: 'text-slate-900',
    accent: 'text-blue-600',
    secondary: 'text-slate-500',
    bar: 'bg-blue-600',
  },
  dark: {
    bg: 'bg-zinc-950',
    text: 'text-white',
    accent: 'text-emerald-400',
    secondary: 'text-zinc-400',
    bar: 'bg-emerald-500',
  },
  storyteller: {
    bg: 'bg-gradient-to-br from-blue-600 to-purple-600',
    text: 'text-white',
    accent: 'text-white',
    secondary: 'text-white/80',
    bar: 'bg-white',
  },
};

const getDisplayDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
};

interface SlidePreviewProps {
  slide: Slide;
  index: number;
  total: number;
  theme: CarouselStyle;
  personalization: Personalization;
  sourceUrl: string;
  id?: string;
  className?: string;
  isExport?: boolean;
}

const SlidePreview: React.FC<SlidePreviewProps> = ({
  slide,
  index,
  total,
  theme: themeType,
  personalization,
  sourceUrl,
  id,
  className = '',
  isExport = false,
}) => {
  const theme = THEME_STYLES[themeType];

  return (
    <div
      id={id}
      className={`relative flex flex-col overflow-hidden ${
        isExport
          ? 'h-[1350px] w-[1080px] p-28'
          : 'aspect-[1/1.25] w-full p-6 sm:p-12'
      } ${theme.bg} ${className}`}
    >
      {/* Top Progression Indicator */}
      <div
        className={`mb-auto flex w-full items-center justify-between ${isExport ? 'gap-6' : ''}`}
      >
        <div className={`flex ${isExport ? 'gap-3' : 'gap-1.5'}`}>
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                isExport ? 'h-2' : 'h-1'
              } ${
                i <= index
                  ? `${isExport ? 'w-10' : 'w-4'} ${theme.bar}`
                  : `${isExport ? 'w-4' : 'w-2'} bg-black/10 opacity-30`
              }`}
            />
          ))}
        </div>
        <span
          className={`font-black tracking-widest uppercase opacity-40 ${
            isExport ? 'text-xl' : 'text-[9px] sm:text-[10px]'
          } ${theme.text}`}
        >
          {index + 1} / {total}
        </span>
      </div>

      {/* Content Area */}
      <div
        className={`${isExport ? 'my-auto space-y-12' : 'my-auto space-y-3 sm:space-y-6'}`}
      >
        {slide?.emoji && (
          <div
            className={`${isExport ? 'mb-12 text-[160px]' : 'mb-2 text-4xl sm:mb-4 sm:text-6xl'}`}
          >
            {slide.emoji}
          </div>
        )}
        <h3
          className={`leading-[1.1] font-bold ${
            isExport ? 'text-[92px]' : 'text-xl sm:text-3xl'
          } ${theme.text}`}
        >
          {slide?.headline}
        </h3>
        <p
          className={`leading-relaxed ${
            isExport ? 'text-[46px]' : 'text-sm sm:text-lg'
          } ${theme.secondary}`}
        >
          {slide?.body}
        </p>
      </div>

      {/* Branding Bar */}
      <div
        className={`flex items-center justify-between gap-3 border-t border-black/5 ${
          isExport ? 'mt-16 pt-12' : 'mt-6 pt-4 sm:mt-8 sm:pt-6'
        }`}
      >
        <div
          className={`flex min-w-0 flex-1 items-center ${isExport ? 'gap-6' : 'gap-3'}`}
        >
          {personalization.profilePic && (
            <div
              className={`flex-shrink-0 overflow-hidden rounded-full bg-black/5 ring-2 ring-white/20 ${
                isExport ? 'h-[100px] w-[100px]' : 'h-8 w-8 sm:h-10 sm:w-10'
              }`}
            >
              <Image
                src={personalization.profilePic}
                alt=""
                width={isExport ? 100 : 40}
                height={isExport ? 100 : 40}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
          )}
          {personalization.handle && (
            <span
              className={`truncate font-bold ${
                isExport ? 'text-[32px]' : 'text-[11px] sm:text-[13px]'
              } ${theme.text}`}
            >
              @{personalization.handle}
            </span>
          )}
        </div>

        {personalization.showSource && sourceUrl && (
          <span
            className={`flex-shrink-0 font-medium whitespace-nowrap italic opacity-40 ${
              isExport ? 'text-[22px]' : 'text-[10px]'
            } ${theme.text}`}
          >
            Resource: {getDisplayDomain(sourceUrl)}
          </span>
        )}
      </div>
    </div>
  );
};

export default SlidePreview;
