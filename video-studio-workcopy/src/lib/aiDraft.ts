import type {
  CaptionSegment,
  CaptionStyle,
  CutSegment,
  OverlayLayer,
  SfxType,
  VideoProject,
} from '../types';

const styleByGoal: Record<string, CaptionStyle> = {
  education: 'cyan-bold',
  promo: 'yellow-impact',
  storytelling: 'mixed-highlight',
  tutorial: 'white-clean',
};

function splitIntoBeats(input: string) {
  return input
    .split(/(?<=[.!?])\s+|\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 10);
}

function pickSfx(text: string): SfxType {
  const lower = text.toLowerCase();
  if (/before|after|reveal|hasil|lihat/.test(lower)) return 'impact';
  if (/jangan|warning|bocor|bahaya|secret/.test(lower)) return 'notification';
  if (/pertama|kedua|ketiga|step|langkah/.test(lower)) return 'click';
  if (/gratis|download|follow|save|simpan/.test(lower)) return 'pop';
  return 'whoosh';
}

function highlightWords(text: string) {
  return text
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}_-]/gu, ''))
    .filter((word) => word.length > 5 || /^[A-Z0-9_]{3,}$/.test(word))
    .slice(0, 4);
}

export function generateVideoDraft(project: VideoProject) {
  const source = project.transcript || project.goal || project.title;
  const beats = splitIntoBeats(source);
  const duration = Math.max(project.duration || beats.length * 3, beats.length * 2.8, 12);
  const segmentLength = duration / Math.max(beats.length, 1);
  const style = styleByGoal[project.goal.toLowerCase()] || 'cyan-bold';

  const captions: CaptionSegment[] = beats.map((text, index) => ({
    id: crypto.randomUUID(),
    start: Number((index * segmentLength).toFixed(2)),
    end: Number(((index + 0.88) * segmentLength).toFixed(2)),
    text,
    highlightWords: highlightWords(text),
    style,
    animation: index % 2 === 0 ? 'pop' : 'slide-up',
    x: 50,
    y: index === 0 ? 72 : 78,
  }));

  const overlays: OverlayLayer[] = [
    {
      id: crypto.randomUUID(),
      type: 'label',
      start: 0,
      end: Math.min(3, duration),
      text: project.goal.toUpperCase() || 'HOOK',
      x: 50,
      y: 12,
      scale: 1,
      rotation: 0,
      color: project.brand.accent,
    },
  ];

  if (/before|after|sebelum|sesudah/i.test(source)) {
    overlays.push(
      {
        id: crypto.randomUUID(),
        type: 'label',
        start: 0,
        end: duration,
        text: 'BEFORE',
        x: 26,
        y: 16,
        scale: 1,
        rotation: 0,
        color: '#27f5ff',
      },
      {
        id: crypto.randomUUID(),
        type: 'label',
        start: 0,
        end: duration,
        text: 'AFTER',
        x: 72,
        y: 10,
        scale: 1.1,
        rotation: 0,
        color: '#27f5ff',
      },
    );
  }

  const soundEffects = captions.slice(0, 6).map((caption) => ({
    id: crypto.randomUUID(),
    type: pickSfx(caption.text),
    start: caption.start,
    volume: 0.75,
  }));

  const cuts: CutSegment[] = captions.map((caption, index) => ({
    id: crypto.randomUUID(),
    start: caption.start,
    end: caption.end,
    reason: index === 0 ? 'Hook section' : 'Keeps the pacing tight',
    score: Number(Math.max(0.7, 1 - index * 0.04).toFixed(2)),
  }));

  return {
    ...project,
    captions,
    overlays,
    soundEffects,
    cuts,
  };
}
