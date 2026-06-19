# Contributing

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

## Workflow

1. Fork and clone
2. Create branch: `git checkout -b feature/your-feature`
3. Make changes
4. Run checks: `pnpm lint && pnpm type-check`
5. Commit using conventional commits: `feat:`, `fix:`, `docs:`
6. Push and open PR

## Code Style

- TypeScript strict, no `any`
- Absolute imports with `@/`
- Components in PascalCase
- Utilities in camelCase
- Keep files under 300 lines

## Before PR

```bash
pnpm lint
pnpm type-check
pnpm build
```
