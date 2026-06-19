// Local bridge that turns editor requests into carousel content + layout using
// an OpenAI-compatible chat completions API (e.g. SumoPod AI).
//
// Env (bun auto-loads .env):
//   AI_API_KEY   required, e.g. sk-...
//   AI_BASE_URL  default https://ai.sumopod.com/v1
//   AI_MODEL     default gpt-4o-mini

const API_KEY = process.env.AI_API_KEY || '';
const BASE_URL = (process.env.AI_BASE_URL || 'https://ai.sumopod.com/v1').replace(/\/$/, '');
const MODEL = process.env.AI_MODEL || 'gpt-4o-mini';
const PORT = Number(process.env.AI_BRIDGE_PORT || 8787);

const SLIDE_ICONS = ['bookmark', 'video', 'play', 'link', 'check', 'follow', 'comment', 'heart', 'key'];
const DECORATION_ICONS = [...SLIDE_ICONS, 'sparkles', 'star', 'asterisk'];
const TEMPLATES = [
  'cover',
  'content',
  'quote',
  'stat',
  'list',
  'steps',
  'reels',
  'ppt',
  'ppt-cover',
  'ppt-content',
  'ppt-image',
  'ppt-closing',
  'closing',
];
const DECORATED_TEMPLATES = new Set(['cover', 'closing']);
const BACKGROUND_POSITIONS = [
  'center center',
  'center top',
  'center bottom',
  'left center',
  'right center',
  'left top',
  'right top',
];

const DESIGN_SYSTEM = `
IG Carousel design system
=========================
Language: write copy in Bahasa Indonesia, casual & punchy (like a coding creator).

Allowed enums:
- template: ${TEMPLATES.join(', ')}
- slide.icon: ${SLIDE_ICONS.join(', ')}
- decoration.icon: ${DECORATION_ICONS.join(', ')}
- backgroundPosition: ${BACKGROUND_POSITIONS.join(' | ')}

Templates:
- "cover": first slide only. Fill it fully — a short eyebrow, a strong 4-8 word
  headline, ONE supporting body line, and a short cta. Use 2-4 decorations.
- "content": educational body slides with headline + paragraph. decorations MUST be [].
- "quote": one sharp opinion, lesson, or mindset line. Use title as the quote and
  body as short attribution/context. decorations MUST be [].
- "stat": one number-heavy proof slide. Put the biggest number/metric in title,
  explain it in body, and use cta for a tiny source/context note if helpful.
  decorations MUST be [].
- "list": 3-5 punchy bullets. Put the list title in title and every bullet on its
  own body line, using "- " prefixes. decorations MUST be [].
- "steps": 3-5 ordered actions. Put the process title in title and every step on
  its own body line, using "1. ", "2. ", etc. decorations MUST be [].
- "reels": thumbnail-style video cover. Use when the slide is meant to become a
  Reels/video thumbnail or needs strong poster text over a photo. Put the short
  category/badge in eyebrow, the main thumbnail text in title, supporting text in
  body, and optional bottom-right note in cta. decorations MUST be [].
- "ppt-cover": 16:9 PPT opening slide. Use for the first deck page: big promise,
  short supporting copy, and optional CTA. decorations MUST be [].
- "ppt-content": 16:9 PPT lesson slide. Use for middle deck pages: compact title,
  markdown body like the feed content template (paragraphs, bullets, inline code,
  or image hints when useful), and optional callout. decorations MUST be [].
- "ppt-image": 16:9 full image slide. Use only when the user explicitly uploads
  or requests a full-bleed image-only slide. Keep title/body/cta short or empty.
  decorations MUST be [].
- "ppt-closing": 16:9 PPT final slide. Use for the last deck page: conclusion,
  next step, website/CTA. decorations MUST be [].
- "closing": last slide. CTA — save / follow / link / download. Use 2-4 decorations.

Icon selection (top-level slide.icon, metadata only):
- youtube/channel/video/tutorial -> "video"
- secret/password/token/api key/security -> "key"
- url/download/access/link -> "link"
- follow -> "follow"; comment -> "comment"; like -> "heart"
- success/done -> "check"; otherwise -> "bookmark"

Decorations (only for cover & closing) — keep them SPARSE, CONTEXTUAL, never over text:
- 2-4 items. left/top are percentages of the slide ("80%"), size in cqw ("8cqw"),
  rotate in deg ("-10deg"), opacity between 0.55 and 0.9.
- Icons MUST match the slide's message: reuse the slide's context icon, plus at
  most ONE accent (sparkles/star/asterisk). Do NOT scatter unrelated icons —
  e.g. no random heart or paper-plane on a slide that is not about like/follow.
- size 6-12cqw (use 6-8cqw for accents).
- NEVER overlap the headline text or the top-left logo. Use ONLY these safe zones:
  - COVER (headline is at the BOTTOM, logo is top-left): use the TOP area only.
    Good slots: top-right (left 80-90%, top 8-18%), upper-right edge
    (left 86-92%, top 30-48%), top strip right of the logo (left 58-74%, top 6-14%).
    Every decoration must have top <= 55%.
  - CLOSING (headline is CENTERED, logo top-left, website bottom-right): use the
    CORNERS only. Good slots: top-right (left 80-90%, top 10-20%), bottom-left
    (left 8-16%, top 82-90%), top strip right of the logo (left 58-74%, top 8-16%).
    Never place anything in the center band (left 15-85% AND top 32-74%).

Output shape (JSON object, no prose, no markdown fences):
{
  "title": string,
  "subtitle": string,
  "slides": [
    { "index": int, "template", "eyebrow", "title", "body", "tag", "cta",
      "icon", "backgroundPosition", "decorations": [
        { "icon", "left", "top", "size", "rotate", "opacity" }
      ] }
  ]
}
slides length must be 3-40. index must start at 0 and increase by 1.
`.trim();

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
]);

function corsHeaders(request) {
  const origin = request.headers.get('origin') || '';
  return {
    'Access-Control-Allow-Origin': allowedOrigins.has(origin) ? origin : 'http://localhost:5173',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(request, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
  });
}

// Drop base64/data-URI or huge string values so uploaded images never bloat the prompt.
function sanitize(value) {
  if (typeof value === 'string') {
    if (value.startsWith('data:') || value.length > 4000) return '[omitted]';
    return value;
  }
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitize(v)]));
  }
  return value;
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('no JSON object found in AI output');
  return JSON.parse(candidate.slice(start, end + 1));
}

function parsePct(value) {
  if (typeof value !== 'string') return null;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

// Returns a reason string if a decoration at (left%, top%) would sit over the
// headline text or the top-left logo, else null. Null coords skip the check.
function decorationOverlap(template, left, top) {
  if (left === null || top === null) return null;
  if (left < 26 && top < 24) return 'overlaps the logo (top-left)';
  if (template === 'cover') {
    if (top > 56) return 'overlaps the cover headline (keep top <= 55%)';
  } else {
    if (left > 14 && left < 86 && top > 32 && top < 74) return 'overlaps the centered headline';
    if (left > 58 && top > 88) return 'overlaps the website footer (bottom-right)';
  }
  return null;
}

function validateCarousel(carousel) {
  const problems = [];
  if (!carousel || typeof carousel !== 'object') return ['carousel must be an object'];
  if (typeof carousel.title !== 'string') problems.push('title must be a string');
  if (typeof carousel.subtitle !== 'string') problems.push('subtitle must be a string');
  if (!Array.isArray(carousel.slides)) return [...problems, 'slides must be an array'];
  if (carousel.slides.length < 3 || carousel.slides.length > 40) {
    problems.push('slides length must be between 3 and 40');
  }
  carousel.slides.forEach((slide, i) => {
    const at = `slides[${i}]`;
    if (slide?.index !== i) problems.push(`${at}.index must equal ${i}`);
    if (!TEMPLATES.includes(slide?.template)) problems.push(`${at}.template "${slide?.template}" not allowed`);
    if (!SLIDE_ICONS.includes(slide?.icon)) problems.push(`${at}.icon "${slide?.icon}" not allowed`);
    if (!BACKGROUND_POSITIONS.includes(slide?.backgroundPosition)) problems.push(`${at}.backgroundPosition not allowed`);
    for (const f of ['eyebrow', 'title', 'body', 'tag', 'cta']) {
      if (typeof slide?.[f] !== 'string') problems.push(`${at}.${f} must be a string`);
    }
    const decorations = slide?.decorations;
    if (!Array.isArray(decorations)) {
      problems.push(`${at}.decorations must be an array`);
      return;
    }
    if (!DECORATED_TEMPLATES.has(slide.template) && decorations.length > 0) {
      problems.push(`${at}.decorations must be [] for ${slide.template} slides`);
    }
    if (DECORATED_TEMPLATES.has(slide.template) && (decorations.length < 2 || decorations.length > 5)) {
      problems.push(`${at}.decorations must have 2-5 items for ${slide.template} slides`);
    }
    decorations.forEach((d, j) => {
      const dAt = `${at}.decorations[${j}]`;
      if (!DECORATION_ICONS.includes(d?.icon)) problems.push(`${dAt}.icon "${d?.icon}" not allowed`);
      for (const f of ['left', 'top', 'size', 'rotate']) {
        if (typeof d?.[f] !== 'string') problems.push(`${dAt}.${f} must be a string`);
      }
      if (typeof d?.opacity !== 'number' || d.opacity < 0 || d.opacity > 1) problems.push(`${dAt}.opacity must be 0-1`);
      const overlap = decorationOverlap(slide.template, parsePct(d?.left), parsePct(d?.top));
      if (overlap) problems.push(`${dAt} ${overlap} — move it to a safe corner`);
    });
  });
  return problems;
}

async function chat(messages) {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`AI API ${response.status}: ${detail.slice(0, 500)}`);
  }
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('AI API returned no content');
  return content;
}

// Generate, validate, and retry once with the validator feedback if needed.
async function generate(userPrompt, options = {}) {
  const messages = [
    { role: 'system', content: DESIGN_SYSTEM },
    { role: 'user', content: userPrompt },
  ];
  let carousel = extractJson(await chat(messages));
  let problems = validateCarousel(carousel);
  if (Number.isInteger(options.expectedSlideCount) && carousel?.slides?.length !== options.expectedSlideCount) {
    problems.push(`slides length must equal ${options.expectedSlideCount}`);
  }
  if (problems.length > 0) {
    messages.push({ role: 'assistant', content: JSON.stringify(carousel) });
    messages.push({
      role: 'user',
      content: `Your JSON has these problems. Fix them and return the full corrected JSON object only:\n- ${problems.join('\n- ')}`,
    });
    carousel = extractJson(await chat(messages));
    problems = validateCarousel(carousel);
    if (Number.isInteger(options.expectedSlideCount) && carousel?.slides?.length !== options.expectedSlideCount) {
      problems.push(`slides length must equal ${options.expectedSlideCount}`);
    }
  }
  if (problems.length > 0) {
    throw new Error(`AI output failed validation: ${problems.join('; ')}`);
  }
  return carousel;
}

function pptTemplateForIndex(index, total) {
  if (index === 0) return 'ppt-cover';
  if (index === total - 1) return 'ppt-closing';
  return 'ppt-content';
}

function extractDeckTitle(markdown) {
  return markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() || 'PPT Deck';
}

function parseStructuredMarkdownDeck(markdown) {
  const normalized = String(markdown || '').replace(/\r\n/g, '\n');
  const matches = [...normalized.matchAll(/^\s*#{1,3}\s*Slide\s+(\d+)\s*(?:[—-]\s*(.+))?\s*$/gim)];
  if (matches.length < 3) return null;

  return matches.map((match, index) => {
    const start = (match.index || 0) + match[0].length;
    const end = matches[index + 1]?.index ?? normalized.length;
    return {
      index,
      sourceNumber: Number(match[1]),
      sourceLabel: (match[2] || `Slide ${match[1]}`).trim(),
      markdown: normalized.slice(start, end).trim(),
    };
  });
}

function buildStructuredPptBatchPrompt(payload, batch, totalSlides) {
  return `You are adapting a long markdown presentation into polished 16:9 PPT slides.
Return JSON only with this exact shape: { "slides": [...] }.

Rules:
- Return EXACTLY ${batch.length} slides, one output for each source slide in this batch.
- Use the exact absolute index provided for each source slide.
- Use template "ppt-cover" only for index 0, "ppt-closing" only for index ${totalSlides - 1}, otherwise "ppt-content".
- Rewrite the source content into clean presentation copy. Do NOT copy raw markdown tables, long code blocks, ASCII diagrams, separators, or comments.
- Keep each content slide light: max 2 short paragraphs OR 3-5 bullets. If there is a table/code/diagram, summarize it and add an illustration hint when useful.
- For useful visuals, append exactly one line at the end of body:
  [tambahkan ilustrasi: <deskripsi singkat & spesifik, Bahasa Indonesia>]
- Never add decorations. Use backgroundPosition "center center".
- Use slide.icon from: ${SLIDE_ICONS.join(', ')}.

Brand:
${JSON.stringify(sanitize(payload.brand || {}), null, 2)}

Source slides:
${JSON.stringify(batch.map((slide) => ({
  index: slide.index,
  template: pptTemplateForIndex(slide.index, totalSlides),
  label: slide.sourceLabel,
  markdown: sanitize(slide.markdown),
})), null, 2)}`;
}

function validateStructuredBatch(result, batch, totalSlides) {
  const problems = [];
  if (!result || typeof result !== 'object') return ['batch result must be an object'];
  if (!Array.isArray(result.slides)) return ['batch result.slides must be an array'];
  if (result.slides.length !== batch.length) {
    problems.push(`batch must return exactly ${batch.length} slides`);
  }

  const expectedIndices = new Set(batch.map((slide) => slide.index));
  for (const slide of result.slides) {
    const at = `slides[${slide?.index}]`;
    if (!expectedIndices.has(slide?.index)) problems.push(`${at}.index is not in this batch`);
    const expectedTemplate = pptTemplateForIndex(slide?.index, totalSlides);
    if (slide?.template !== expectedTemplate) {
      problems.push(`${at}.template must be "${expectedTemplate}"`);
    }
    if (!SLIDE_ICONS.includes(slide?.icon)) problems.push(`${at}.icon "${slide?.icon}" not allowed`);
    if (!BACKGROUND_POSITIONS.includes(slide?.backgroundPosition)) problems.push(`${at}.backgroundPosition not allowed`);
    for (const field of ['eyebrow', 'title', 'body', 'tag', 'cta']) {
      if (typeof slide?.[field] !== 'string') problems.push(`${at}.${field} must be a string`);
    }
    if (!Array.isArray(slide?.decorations) || slide.decorations.length !== 0) {
      problems.push(`${at}.decorations must be []`);
    }
    if (/(^|\n)\s*---\s*(\n|$)|<!--|##\s*Slide\s+\d+/i.test(slide?.body || '')) {
      problems.push(`${at}.body still contains raw deck markdown`);
    }
  }
  return problems;
}

function normalizeStructuredBatch(result, batch, totalSlides) {
  if (!result || !Array.isArray(result.slides) || result.slides.length !== batch.length) {
    return result;
  }

  return {
    ...result,
    slides: result.slides.map((slide, offset) => {
      const source = batch[offset];
      return {
        index: source.index,
        template: pptTemplateForIndex(source.index, totalSlides),
        eyebrow: typeof slide?.eyebrow === 'string' ? slide.eyebrow : '',
        title: typeof slide?.title === 'string' ? slide.title : source.sourceLabel,
        body: typeof slide?.body === 'string' ? slide.body : '',
        tag: typeof slide?.tag === 'string' ? slide.tag : '',
        cta: typeof slide?.cta === 'string' ? slide.cta : '',
        icon: SLIDE_ICONS.includes(slide?.icon) ? slide.icon : 'bookmark',
        backgroundPosition: BACKGROUND_POSITIONS.includes(slide?.backgroundPosition)
          ? slide.backgroundPosition
          : 'center center',
        decorations: [],
      };
    }),
  };
}

async function generateStructuredBatch(payload, batch, totalSlides) {
  const messages = [
    { role: 'system', content: DESIGN_SYSTEM },
    { role: 'user', content: buildStructuredPptBatchPrompt(payload, batch, totalSlides) },
  ];

  let result = normalizeStructuredBatch(extractJson(await chat(messages)), batch, totalSlides);
  let problems = validateStructuredBatch(result, batch, totalSlides);
  if (problems.length > 0) {
    messages.push({ role: 'assistant', content: JSON.stringify(result) });
    messages.push({
      role: 'user',
      content: `Fix these problems and return the full corrected JSON object only:\n- ${problems.join('\n- ')}`,
    });
    result = normalizeStructuredBatch(extractJson(await chat(messages)), batch, totalSlides);
    problems = validateStructuredBatch(result, batch, totalSlides);
  }
  if (problems.length > 0) {
    throw new Error(`AI batch failed validation: ${problems.join('; ')}`);
  }
  return result.slides;
}

async function generateStructuredPptDeck(payload) {
  const sourceSlides = parseStructuredMarkdownDeck(payload.topic);
  if (!sourceSlides) return null;
  if (Number.isInteger(payload.sourceSlideCount) && sourceSlides.length !== payload.sourceSlideCount) {
    throw new Error(`Detected ${sourceSlides.length} source slides, expected ${payload.sourceSlideCount}`);
  }

  const batchSize = 1;
  const slides = [];
  for (let start = 0; start < sourceSlides.length; start += batchSize) {
    const batch = sourceSlides.slice(start, start + batchSize);
    const adapted = await generateStructuredBatch(payload, batch, sourceSlides.length);
    slides.push(...adapted);
  }

  const carousel = {
    title: extractDeckTitle(payload.topic),
    subtitle: `${sourceSlides.length} PPT slides`,
    slides: slides.sort((a, b) => a.index - b.index),
  };
  const problems = validateCarousel(carousel);
  if (problems.length > 0) {
    throw new Error(`Structured PPT failed validation: ${problems.join('; ')}`);
  }
  return carousel;
}

function buildLayoutPrompt(payload) {
  const modeInstruction =
    payload.outputType === 'ppt'
      ? 'Output mode: PPT deck. Use "ppt-cover" for the first slide, "ppt-content" for middle slides, and "ppt-closing" for the last slide. decorations MUST be [].'
      : payload.outputType === 'reels'
        ? 'Output mode: Reels thumbnails. Every slide template MUST be "reels", decorations MUST be [].'
        : 'Output mode: carousel. Use cover for first slide, content variants for middle slides, and closing for final CTA.';

  return `Choose ONLY layout metadata for the slides below — do NOT rewrite their text.
Keep each slide's eyebrow/title/body/tag/cta exactly as given.
For each input slide set: index (unchanged), template, icon, backgroundPosition, decorations.
${modeInstruction}
Return the full JSON object: { "title", "subtitle", "slides": [...] } using the existing title/subtitle.

Input:
${JSON.stringify(sanitize(payload), null, 2)}`;
}

function buildContentPrompt(payload) {
  if (payload.outputType === 'ppt') {
    const sourceSlideInstruction = Number.isInteger(payload.sourceSlideCount)
      ? `The input already contains ${payload.sourceSlideCount} source slides. Return EXACTLY ${payload.sourceSlideCount} output slides. Map source Slide 1 to output index 0, source Slide 2 to output index 1, and so on. Rewrite and compress each source slide into a clean visual slide; do not copy raw markdown blocks directly.`
      : 'Choose the slide count from the brief. If the user asks for a specific number, follow it. Otherwise write 6-12 PPT slides. Never force exactly 6 slides unless requested.';

    return `Write a full 16:9 presentation deck for a coding creator about this topic/brief:
"""
${payload.topic}
"""
${sourceSlideInstruction}
Write in Bahasa Indonesia (clear, concise, presentation-ready).
If the brief already contains a full markdown deck with headings like "Slide 1",
"Slide 2", etc., preserve that source slide count and convert each source slide
into one concise output slide. Do not summarize many source slides into a few
slides.
Use template "ppt-cover" for the first slide, "ppt-content" for middle slides, and "ppt-closing" for the last slide. decorations MUST be [].
Use this structure:
- Slide 0: title/opening slide with a strong promise.
- Middle slides: one idea per slide. Write body as clean markdown: paragraphs,
  bullets, inline code, or short examples when useful.
- Keep each PPT content slide visually light: max 2 short paragraphs OR 3-5 bullets.
  If the material needs more text, split it into another slide instead of making
  one crowded slide.
- Rewrite long tables/code/ASCII diagrams into simple bullets or an illustration
  suggestion. Keep at most 1-2 short inline code examples per slide.
- Do NOT put full markdown deck syntax inside a slide body: no "---" separators,
  no "<!-- ... -->" comments, no "## Slide ..." headings, and no large ASCII art
  blocks unless the user explicitly asks for them.
- Final slide: closing/action slide with a clear next step.
Illustration suggestions for PPT content slides:
- When a slide would benefit from a visual (profile photo, diagram, screenshot,
  code snippet, table, comparison, flow, etc.), append ONE suggestion on its own
  new line at the END of the body using EXACTLY this format:
  [tambahkan ilustrasi: <deskripsi singkat & spesifik, Bahasa Indonesia>]
- Use it only where it genuinely helps, not on every slide. Never put it on
  ppt-cover or ppt-closing.
Use eyebrow for section labels, title for the main point, body for supporting copy/bullets, cta for a concise callout.
Each slide needs index, template, eyebrow, title, body, tag, cta, icon, backgroundPosition, decorations.

Brand context: ${JSON.stringify(sanitize(payload.brand || {}), null, 2)}`;
  }

  if (payload.outputType === 'reels') {
    return `Write Reels thumbnail copy for a coding creator about this topic/brief:
"""
${payload.topic}
"""
Write ${payload.slideCount || 'between 5 and 8'} thumbnail slides in Bahasa Indonesia.
Every slide MUST use template "reels". decorations MUST be [].
Keep each title short and punchy, optimized for video thumbnails. Use body only for a second short text line if needed.
Each slide needs index, template, eyebrow, title, body, tag, cta, icon, backgroundPosition, decorations.

Brand context: ${JSON.stringify(sanitize(payload.brand || {}), null, 2)}`;
  }

  return `Write a full Instagram carousel for a coding creator about this topic/brief:
"""
${payload.topic}
"""
Write ${payload.slideCount || 'between 5 and 8'} slides in Bahasa Indonesia (casual, punchy).
Slide 0 = cover hook, middle = content, last = closing CTA.
For middle slides, mix templates when useful: content, quote, stat, list, steps, reels, and ppt.
Each slide needs index, template, eyebrow, title, body, tag, cta, icon, backgroundPosition, decorations.

Illustration suggestions (content slides only):
- On content slides where a visual would help explain (a diagram, screenshot, code
  snippet, before/after, flow, etc.), append ONE suggestion on its own new line at the
  END of the body, using EXACTLY this format:
  [tambahkan ilustrasi: <deskripsi singkat & spesifik, Bahasa Indonesia>]
- Make the description concrete (what to show), e.g.
  "[tambahkan ilustrasi: diagram alur git commit dari staging ke push]".
- Use it only where it genuinely helps — NOT on every slide, max ~half of the content
  slides. Never put a suggestion on cover or closing slides.

Brand context: ${JSON.stringify(sanitize(payload.brand || {}), null, 2)}`;
}

Bun.serve({
  hostname: '127.0.0.1',
  port: PORT,
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }
    if (request.method !== 'POST') return jsonResponse(request, { error: 'Not found' }, 404);
    if (!API_KEY) return jsonResponse(request, { error: 'AI_API_KEY is not set. Add it to .env' }, 500);

    const url = new URL(request.url);
    try {
      const payload = await request.json();
      if (url.pathname === '/ai-layout') return jsonResponse(request, await generate(buildLayoutPrompt(payload)));
      if (url.pathname === '/ai-content') {
        if (payload.outputType === 'ppt' && Number.isInteger(payload.sourceSlideCount)) {
          const structuredDeck = await generateStructuredPptDeck(payload);
          if (structuredDeck) return jsonResponse(request, structuredDeck);
        }
        return jsonResponse(
          request,
          await generate(buildContentPrompt(payload), { expectedSlideCount: payload.sourceSlideCount }),
        );
      }
      return jsonResponse(request, { error: 'Not found' }, 404);
    } catch (error) {
      return jsonResponse(request, { error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  },
});

console.log(`AI content bridge listening on http://127.0.0.1:${PORT} (model: ${MODEL}, base: ${BASE_URL})`);
console.log('  POST /ai-layout   -> arrange templates/icons/decorations');
console.log('  POST /ai-content  -> generate full carousel content + layout');
if (!API_KEY) console.warn('WARNING: AI_API_KEY is not set. Add it to .env before sending requests.');
