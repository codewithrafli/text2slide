import type {
  CaptionAnimation,
  CaptionSegment,
  CaptionStyle,
  CutSegment,
  OverlayLayer,
  SfxType,
  SoundEffectLayer,
  VideoProject,
} from '../src/types';

const port = Number(process.env.API_PORT || 8788);
const groqApiKey = process.env.GROQ_API_KEY;
const whisperModel = process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3-turbo';
const chatModel = process.env.GROQ_CHAT_MODEL || 'llama-3.1-8b-instant';

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

interface AutoEditPayload {
  transcript: string;
  segments: TranscriptSegment[];
  duration: number;
  brand: VideoProject['brand'];
}

interface TranscriptionResult {
  transcript: string;
  segments: TranscriptSegment[];
  warning?: string;
}

function jsonResponse(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'content-type, authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    },
  });
}

function sanitizeNumber(input: unknown, fallback: number) {
  const value = Number(input);
  return Number.isFinite(value) ? value : fallback;
}

function safeParseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeSegments(transcript: string, segments: TranscriptSegment[], duration: number) {
  if (segments.length > 0) {
    return segments
      .map((segment) => ({
        start: sanitizeNumber(segment.start, 0),
        end: sanitizeNumber(segment.end, sanitizeNumber(segment.start, 0) + 2),
        text: String(segment.text || '').trim(),
      }))
      .filter((segment) => segment.text && segment.end > segment.start)
      .slice(0, 80);
  }

  const sentences = transcript
    .split(/(?<=[.!?])\s+|\n+/)
    .map((text) => text.trim())
    .filter(Boolean)
    .slice(0, 20);
  const segmentLength = Math.max(1.8, duration / Math.max(sentences.length, 1));

  return sentences.map((text, index) => ({
    start: Number((index * segmentLength).toFixed(2)),
    end: Number(Math.min(duration, (index + 0.86) * segmentLength).toFixed(2)),
    text,
  }));
}

function pickStyle(text: string, index: number): CaptionStyle {
  const lower = text.toLowerCase();
  if (/gratis|caption|viral|penting|jangan|bahaya|secret|bocor/.test(lower)) return 'yellow-impact';
  if (/before|after|hasil|reveal/.test(lower)) return 'cyan-bold';
  return index % 3 === 0 ? 'mixed-highlight' : 'white-clean';
}

function pickAnimation(index: number): CaptionAnimation {
  return index % 3 === 0 ? 'pop' : index % 3 === 1 ? 'slide-up' : 'bounce';
}

function pickSfx(text: string): SfxType {
  const lower = text.toLowerCase();
  if (/before|after|reveal|hasil|lihat|ubah/.test(lower)) return 'impact';
  if (/jangan|warning|bocor|bahaya|secret|salah/.test(lower)) return 'notification';
  if (/pertama|kedua|ketiga|step|langkah|nomor/.test(lower)) return 'click';
  if (/gratis|download|follow|save|simpan|caption/.test(lower)) return 'pop';
  return 'whoosh';
}

function highlightWords(text: string) {
  return text
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}_-]/gu, ''))
    .filter((word) => word.length > 5 || /^[A-Z0-9_]{3,}$/.test(word))
    .slice(0, 4);
}

function shortCaption(text: string) {
  const clean = text.replace(/\s+/g, ' ').trim();
  const lower = clean.toLowerCase();
  if (/5\s*-?\s*7|five|seven|hours|hrs|jam/.test(lower)) return '5 hrs\n7 hrs';
  if (/framework|step|langkah/.test(lower)) return '7-STEP\nFRAMEWORK';
  if (/free|gratis/.test(lower)) return 'FOR FREE';
  if (/\$0|zero|nol/.test(lower)) return '$0';
  const words = clean.split(/\s+/);
  if (words.length <= 9) return clean;
  return words.slice(0, 9).join(' ');
}

function pickOverlayText(text: string, index: number) {
  const lower = text.toLowerCase();
  if (/airbnb/.test(lower)) return index === 0 ? 'AIRBNB' : 'AIRBNB BUSINESS';
  if (/capital|modal|amount|uang|money/.test(lower)) return 'AMOUNT';
  if (/\$0|0 dollar|zero|nol/.test(lower)) return '$0';
  if (/5\s*-?\s*7|five|seven|hours|hrs|jam/.test(lower)) return '5-7 HRS';
  if (/framework|step|langkah/.test(lower)) return '7-STEP\nFRAMEWORK';
  if (/free|gratis/.test(lower)) return 'FREE';
  if (/start|mulai/.test(lower)) return 'HOW TO START';
  if (/scale|grow|naik|besar/.test(lower)) return 'SCALE';
  if (index === 0) return 'HOOK';
  if (index === 1) return 'POINT';
  if (index === 2) return 'AMOUNT';
  return highlightWords(text)[0]?.toUpperCase() || 'POINT';
}

function fallbackPlan(payload: AutoEditPayload) {
  const segments = normalizeSegments(payload.transcript, payload.segments, payload.duration);
  const captions: CaptionSegment[] = segments.slice(0, 28).map((segment, index) => ({
    id: crypto.randomUUID(),
    start: Number(segment.start.toFixed(2)),
    end: Number(segment.end.toFixed(2)),
    text: shortCaption(segment.text),
    highlightWords: highlightWords(segment.text),
    style: index % 4 === 0 ? 'white-clean' : pickStyle(segment.text, index),
    animation: pickAnimation(index),
    x: 50,
    y: index === 0 ? 58 : 64,
  }));

  const cuts: CutSegment[] = captions.map((caption, index) => ({
    id: crypto.randomUUID(),
    start: caption.start,
    end: Math.min(caption.end + 0.3, payload.duration),
    reason: index === 0 ? 'Strong opening hook' : 'Speech beat with clear caption value',
    score: Number(Math.max(0.72, 0.98 - index * 0.025).toFixed(2)),
  }));

  const overlays: OverlayLayer[] = captions.slice(0, 7).map((caption, index) => ({
    id: crypto.randomUUID(),
    type: /airbnb|free|gratis/.test(caption.text.toLowerCase()) ? 'sticker' : 'label',
    start: caption.start,
    end: Math.min(caption.end + 0.85, payload.duration),
    text: pickOverlayText(caption.text, index),
    x: [28, 68, 50, 50, 62, 38, 66][index] || 50,
    y: [18, 18, 26, 74, 30, 22, 68][index] || 24,
    scale: Number((1 + (index % 3) * 0.12).toFixed(2)),
    rotation: [-8, 8, -3, 0, -6, 5, 0][index] || 0,
    color: /free|framework|hrs|\$|capital|amount|business/i.test(pickOverlayText(caption.text, index))
      ? '#ffc51c'
      : index === 0
        ? payload.brand.accent
        : '#ffffff',
  }));

  const soundEffects: SoundEffectLayer[] = captions.slice(0, 10).map((caption) => ({
    id: crypto.randomUUID(),
    type: pickSfx(caption.text),
    start: caption.start,
    volume: 0.72,
  }));

  return {
    title: captions[0]?.text.slice(0, 54) || 'Auto Edited Video',
    goal: 'auto',
    captions,
    cuts,
    overlays,
    soundEffects,
  };
}

function coercePlan(rawPlan: unknown, fallback: ReturnType<typeof fallbackPlan>) {
  const candidate = rawPlan && typeof rawPlan === 'object' ? (rawPlan as Partial<typeof fallback>) : {};

  return {
    title: typeof candidate.title === 'string' ? candidate.title : fallback.title,
    goal: typeof candidate.goal === 'string' ? candidate.goal : fallback.goal,
    captions: Array.isArray(candidate.captions) && candidate.captions.length ? candidate.captions : fallback.captions,
    cuts: Array.isArray(candidate.cuts) && candidate.cuts.length ? candidate.cuts : fallback.cuts,
    overlays: Array.isArray(candidate.overlays) && candidate.overlays.length ? candidate.overlays : fallback.overlays,
    soundEffects:
      Array.isArray(candidate.soundEffects) && candidate.soundEffects.length
        ? candidate.soundEffects
        : fallback.soundEffects,
  };
}

async function transcribeAudio(file: File): Promise<TranscriptionResult> {
  if (!groqApiKey) {
    throw new Error('GROQ_API_KEY belum diisi. Tambahkan ke .env untuk mengaktifkan auto edit.');
  }

  const formData = new FormData();
  formData.append('file', file, file.name || 'video.mp4');
  formData.append('model', whisperModel);
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'segment');
  formData.append('language', process.env.WHISPER_LANGUAGE || 'id');

  let response: Response;
  try {
    response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: formData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown connection error';
    throw new Error(`Groq transcription connection failed for ${file.type || 'unknown'} ${(file.size / 1024 / 1024).toFixed(2)}MB: ${message}`);
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Groq transcription failed (${response.status}) for ${file.type || 'unknown'} ${(file.size / 1024 / 1024).toFixed(2)}MB: ${detail.slice(0, 280)}`);
  }

  const data = (await response.json()) as {
    text?: string;
    segments?: Array<{ start: number; end: number; text: string }>;
  };

  return {
    transcript: String(data.text || '').trim(),
    segments: (data.segments || []).map((segment) => ({
      start: sanitizeNumber(segment.start, 0),
      end: sanitizeNumber(segment.end, 0),
      text: String(segment.text || '').trim(),
    })),
  };
}

async function planEditWithAi(payload: AutoEditPayload) {
  const fallback = fallbackPlan(payload);

  if (!groqApiKey) return fallback;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: chatModel,
      temperature: 0.35,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are an Indonesian short-form video editor. Return strict JSON only. Create an edit plan for a Reels/TikTok editor: cuts, captions, overlays, soundEffects. Use concise Bahasa Indonesia captions. Avoid extra explanation.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            duration: payload.duration,
            brandAccent: payload.brand.accent,
            transcript: payload.transcript,
            segments: payload.segments.slice(0, 60),
            schema: {
              title: 'string',
              goal: 'auto',
              cuts: [{ start: 'number', end: 'number', reason: 'string', score: '0..1' }],
              captions: [
                {
                  start: 'number',
                  end: 'number',
                  text: 'string',
                  highlightWords: ['string'],
                  style: 'yellow-impact | white-clean | cyan-bold | mixed-highlight',
                  animation: 'pop | slide-up | bounce | type-in',
                  x: '0..100',
                  y: '0..100',
                },
              ],
              overlays: [
                {
                  type: 'label | sticker | shape',
                  start: 'number',
                  end: 'number',
                  text: 'short label or icon context',
                  x: '0..100',
                  y: '0..100',
                  scale: '0.5..1.6',
                  rotation: '-20..20',
                  color: 'hex',
                },
              ],
              soundEffects: [{ type: 'whoosh | pop | click | impact | riser | notification', start: 'number', volume: '0..1' }],
            },
            rules: [
              'Style must look like premium viral talking-head reels.',
              'Captions must be short punchy phrases, 4 to 9 words max.',
              'Put captions center-lower, usually x=50 and y=55..72.',
              'Overlays must be big keyword graphics, not generic labels.',
              'Prefer overlay words like HOOK, POINT, AMOUNT, FREE, FRAMEWORK, $0, 5-7 HRS, brand/product names.',
              'Use yellow-impact for money, numbers, framework, and high stakes phrases.',
              'Use white-clean for normal speech captions.',
              'Add 1 overlay on most important beats only, not every caption.',
            ],
          }),
        },
      ],
    }),
  });

  if (!response.ok) return fallback;

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content || '{}';
  const parsed = safeParseJson(content, fallback);
  const plan = coercePlan(parsed, fallback);

  return {
    ...plan,
    captions: plan.captions.slice(0, 36).map((caption) => ({ ...caption, id: crypto.randomUUID() })),
    cuts: plan.cuts.slice(0, 24).map((cut) => ({ ...cut, id: crypto.randomUUID() })),
    overlays: plan.overlays.slice(0, 18).map((overlay) => ({ ...overlay, id: crypto.randomUUID() })),
    soundEffects: plan.soundEffects.slice(0, 18).map((sfx) => ({ ...sfx, id: crypto.randomUUID() })),
  };
}

const server = Bun.serve({
  port,
  maxRequestBodySize: 1024 * 1024 * 80,
  async fetch(request) {
    if (request.method === 'OPTIONS') return jsonResponse({});

    const url = new URL(request.url);
    if (url.pathname === '/api/health') {
      return jsonResponse({
        ok: true,
        provider: groqApiKey ? 'groq' : 'not-configured',
        whisperModel,
        chatModel,
      });
    }

    if (url.pathname !== '/api/auto-edit' || request.method !== 'POST') {
      return jsonResponse({ error: 'Not found' }, 404);
    }

    try {
      const formData = await request.formData();
      const file = formData.get('audio') || formData.get('video');
      if (!(file instanceof File)) {
        return jsonResponse({ error: 'Audio file is required. Upload video again and click Auto edit.' }, 400);
      }

      const duration = Math.max(3, sanitizeNumber(formData.get('duration'), 30));
      const brand = safeParseJson(String(formData.get('brand') || '{}'), {
        handle: '',
        website: '',
        accent: '#27f5ff',
      });

      console.log(
        `[auto-edit] received ${file.name || 'audio'} ${file.type || 'unknown'} ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      );

      let transcription: TranscriptionResult;
      try {
        transcription = await transcribeAudio(file);
      } catch (error) {
        const warning = error instanceof Error ? error.message : 'Transcription failed.';
        console.warn(`[auto-edit] ${warning}`);
        transcription = {
          transcript:
            'Buat video pendek dengan hook kuat, caption jelas, cut cepat, overlay secukupnya, dan sound effect di setiap beat penting.',
          segments: [],
          warning,
        };
      }
      const transcript = transcription.transcript || transcription.segments.map((segment) => segment.text).join(' ');
      const payload = {
        transcript,
        segments: transcription.segments,
        duration,
        brand,
      };

      const project = await planEditWithAi(payload);

      return jsonResponse({
        transcript,
        warning: transcription.warning,
        project,
      });
    } catch (error) {
      return jsonResponse(
        {
          error: error instanceof Error ? error.message : 'Auto edit failed.',
        },
        500,
      );
    }
  },
});

console.log(`AI video API ready at http://localhost:${server.port}`);
