---
description: Project rules
alwaysApply: true
---

# Context

Read `docs/AI_CONTEXT.md` for full context.

## Stack

Next.js, Tailwind, shadcn/ui, TypeScript, Supabase, OpenRouter, jsPDF

## Rules

- Absolute imports: `@/`
- No `any` types
- Components: PascalCase
- Utilities: camelCase
- Zod for validation
- Custom errors in `lib/errors.ts`

## Key Files

- `lib/ai/prompts.ts` - AI prompts
- `lib/scraper/index.ts` - Scraping orchestrator
- `lib/pdf/generator.ts` - PDF generation
- `app/api/` - API routes
