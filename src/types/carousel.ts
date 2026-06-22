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
