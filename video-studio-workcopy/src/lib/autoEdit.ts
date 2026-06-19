import type { VideoProject } from '../types';
import { extractAudioFromVideo } from './audioExtract';

export interface AutoEditResult {
  transcript: string;
  warning?: string;
  project: Pick<VideoProject, 'captions' | 'overlays' | 'soundEffects' | 'cuts'> & {
    title?: string;
    goal?: string;
  };
}

export async function autoEditVideo(
  file: File,
  duration: number,
  brand: VideoProject['brand'],
  onStatus?: (message: string) => void,
) {
  onStatus?.('Extracting audio from video. This runs once in real time so the AI upload stays small.');
  const audioFile = await extractAudioFromVideo(file, duration);

  const formData = new FormData();
  formData.append('audio', audioFile);
  formData.append('sourceFileName', file.name);
  formData.append('duration', String(duration || 30));
  formData.append('brand', JSON.stringify(brand));

  onStatus?.(`Uploading audio to AI (${(audioFile.size / 1024 / 1024).toFixed(2)} MB).`);

  const response = await fetch('/api/auto-edit', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Auto edit failed.' }));
    throw new Error(error.error || 'Auto edit failed.');
  }

  return (await response.json()) as AutoEditResult;
}
