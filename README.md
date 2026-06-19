# IG Carousel Studio

Vue + Supabase editor for creating Instagram carousel feeds with editable copy,
theme controls, logo upload, draft saving, and 1080 x 1350 PNG export.

## Features

- Edit 4:5 Instagram carousel slides in the browser
- Customize handle, logo, accent color, texture, and visual theme
- Add, duplicate, delete, and reorder by selecting slides
- Export the current slide or every slide as PNG files
- Save carousel drafts to Supabase when env vars are configured
- Falls back to local draft saving when Supabase is not configured
- AI content + layout generation via any OpenAI-compatible endpoint
- One-click export of every slide as PNGs in a single ZIP

## Stack

Vue 3, Vite, TypeScript, Supabase, html-to-image, lucide-vue-next, fflate.

## AI (OpenAI-compatible endpoint)

The editor can write a full carousel (copy + layout) or just auto-arrange
templates, icons, and decorations. Both run through a local bridge
(`scripts/ai-content-bridge.mjs`) that calls an OpenAI-compatible chat
completions API — e.g. [SumoPod AI](https://ai.sumopod.com). The design system
and a validator (with one corrective retry) live inside the bridge.

Set these in `.env` (read by `bun run ai:bridge`, never exposed to the browser):

```bash
AI_API_KEY=sk-...                       # required
AI_BASE_URL=https://ai.sumopod.com/v1   # default
AI_MODEL=gpt-4o-mini                    # default
```

Then:

```bash
bun run ai:bridge   # starts the AI bridge on http://127.0.0.1:8787
```

In the editor:

- **Generate konten (AI)** — type a topic/brief and the model drafts the slides.
- **AI auto slide / Auto all** — re-arrange layout metadata only.

If the bridge is not running, layout auto-arrange falls back to a local
heuristic; content generation requires the bridge.

## Quick Start

```bash
bun install
cp .env.example .env.local
bun run dev
```

Open the Vite URL printed by the dev server.

## Supabase Setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Run the migrations in `supabase/migrations`.
5. Confirm the `profile-pictures` storage bucket is public.

The editor writes brand profile data to `user_profiles`, uploads logos to
Supabase Storage, and stores editable carousel content in `carousel_drafts`.

## Export

Use **Export current** for one active slide or **Export all** for the full
carousel. Each PNG is generated at Instagram carousel size: `1080 x 1350`.
