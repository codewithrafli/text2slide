---
description: Deploy checklist before pushing to production
---

# Deploy Workflow

// turbo-all

## Pre-deploy Checklist

1. Verify environment variables in `.env.example` are documented:

```bash
cat .env.example
```

2. Run full build to catch errors:

```bash
pnpm build
```

3. Check for TypeScript errors:

```bash
pnpm type-check
```

4. Check for lint errors:

```bash
pnpm lint
```

## Deploy Steps

5. Commit any pending changes:

```bash
git status
```

6. If all checks pass, push to main:

```bash
git push origin main
```

7. Report deployment status. Remind user to:
   - Set environment variables in Vercel/hosting platform
   - Run Supabase migrations if needed
   - Test the production URL
