export type VideoFormat = 'reels-9-16' | 'feed-4-5' | 'square-1-1';
export type CaptionAnimation = 'pop' | 'slide-up' | 'bounce' | 'type-in';
export type CaptionStyle = 'yellow-impact' | 'white-clean' | 'cyan-bold' | 'mixed-highlight';
export type OverlayType = 'label' | 'sticker' | 'image' | 'shape';
export type SfxType = 'whoosh' | 'pop' | 'click' | 'impact' | 'riser' | 'notification';

export interface CaptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  highlightWords: string[];
  style: CaptionStyle;
  animation: CaptionAnimation;
  x: number;
  y: number;
}

export interface OverlayLayer {
  id: string;
  type: OverlayType;
  start: number;
  end: number;
  text: string;
  assetUrl?: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color: string;
}

export interface SoundEffectLayer {
  id: string;
  type: SfxType;
  start: number;
  volume: number;
}

export interface CutSegment {
  id: string;
  start: number;
  end: number;
  reason: string;
  score: number;
}

export interface VideoProject {
  id?: string;
  title: string;
  goal: string;
  format: VideoFormat;
  sourceVideoUrl: string;
  duration: number;
  transcript: string;
  captions: CaptionSegment[];
  overlays: OverlayLayer[];
  soundEffects: SoundEffectLayer[];
  cuts: CutSegment[];
  brand: {
    handle: string;
    website: string;
    accent: string;
  };
}
