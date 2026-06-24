export type ThemeId = 'rafli' | 'dark' | 'promo';
export type SlideTemplate =
  | 'cover'
  | 'content'
  | 'quote'
  | 'stat'
  | 'list'
  | 'steps'
  | 'reels'
  | 'ppt'
  | 'ppt-cover'
  | 'ppt-content'
  | 'ppt-image'
  | 'ppt-closing'
  | 'closing';
export type SlideIconId =
  | 'bookmark'
  | 'video'
  | 'play'
  | 'link'
  | 'check'
  | 'follow'
  | 'comment'
  | 'heart'
  | 'key';

export interface SlideDecoration {
  icon: SlideIconId | 'sparkles' | 'star' | 'asterisk';
  left: string;
  top: string;
  size: string;
  rotate: string;
  opacity: number;
}

export interface SlideCard {
  label: string;
  title: string;
  body: string;
  icon: SlideIconId;
  tone?: 'blue' | 'green' | 'orange' | 'purple' | 'neutral';
}

export type PptLayout = 'split' | 'cards' | 'quote' | 'points' | 'statement';

export interface SlideVisualCue {
  title: string;
  body: string;
  icon: SlideIconId;
  tone?: 'blue' | 'green' | 'orange' | 'purple' | 'neutral';
}

export type PptAiBlockType =
  | 'badge'
  | 'headline'
  | 'body'
  | 'card'
  | 'quote'
  | 'list'
  | 'visual'
  | 'callout'
  | 'metric';

export type PptAiTone = 'blue' | 'green' | 'orange' | 'purple' | 'neutral';
export type PptAiSize = 'sm' | 'md' | 'lg' | 'xl';

export interface PptAiBlock {
  type: PptAiBlockType;
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  title?: string;
  body?: string;
  label?: string;
  items?: string[];
  icon?: SlideIconId;
  tone?: PptAiTone;
  size?: PptAiSize;
  align?: 'left' | 'center' | 'right';
}

export interface PptAiLayout {
  blocks: PptAiBlock[];
}

export interface CarouselSlide {
  id: string;
  template: SlideTemplate;
  eyebrow: string;
  title: string;
  body: string;
  tag: string;
  icon: SlideIconId;
  mediaUrl?: string;
  backgroundPosition?: string;
  decorations?: SlideDecoration[];
  visualCards?: SlideCard[];
  visualCue?: SlideVisualCue;
  pptLayout?: PptLayout;
  aiLayout?: PptAiLayout;
  cta?: string;
}

export interface BrandSettings {
  handle: string;
  logoUrl: string;
  website: string;
  accent: string;
  theme: ThemeId;
  showNoise: boolean;
}

export interface CarouselDraft {
  id?: string;
  title: string;
  subtitle: string;
  brand: BrandSettings;
  slides: CarouselSlide[];
}
