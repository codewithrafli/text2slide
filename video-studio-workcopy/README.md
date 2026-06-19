# AI Video Studio

Short-form video editor for Instagram/Reels content. It is built with Vue, Bun, Supabase, and lucide icons.

## Features

- Upload vertical video locally, with optional Supabase Storage upload.
- Auto edit from a video file: transcribe audio, choose cut beats, generate captions, overlays, and sound effect cues.
- Edit caption timing, style, position, and animation.
- Add overlays/decorations with manual position, scale, rotation, and color.
- Add sound effect cues on a simple timeline.
- Save locally by default, or save to Supabase when env vars are configured.
- Export the project JSON for future render/export pipeline work.

## Run

```bash
bun install
bun run dev
```

Default dev URL: `http://localhost:5174`

The dev script starts both:

- Vite web app on `http://localhost:5174`
- Bun AI API on `http://localhost:8788`

## AI Auto Edit

The browser never calls the AI provider directly. Video is posted to `server/index.ts`, then the server:

1. Sends the video file to Groq Whisper for transcript + timestamps.
2. Uses a Groq chat model to choose cuts, captions, overlays, and sound effects.
3. Falls back to a deterministic transcript-based planner if the chat response is unusable.

Create `.env` from `.env.example` and fill:

```bash
GROQ_API_KEY=your_groq_key
GROQ_WHISPER_MODEL=whisper-large-v3-turbo
GROQ_CHAT_MODEL=llama-3.1-8b-instant
WHISPER_LANGUAGE=id
```

## Supabase

1. Copy `.env.example` to `.env`.
2. Fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Create a public Storage bucket named `video-assets` or change `VITE_SUPABASE_STORAGE_BUCKET`.
4. Run the SQL in `supabase/migrations/202606180001_create_video_projects.sql`.

Without Supabase env vars, the app still works in local mode and saves to `localStorage`.

## Manual Draft Fallback

`src/lib/aiDraft.ts` still exists for manual drafting from transcript text. The main workflow is now the `Auto edit video` button after upload.
