---
description: Add a new API route
---

# Add API Route Workflow

1. Ask user for:
   - Route path (e.g., `/api/health`)
   - HTTP method(s) (GET, POST, etc.)
   - Brief description of what it does

2. Create the route file at `src/app/api/[path]/route.ts`

3. Include proper error handling using `AppError` from `@/lib/errors`

4. Follow the API response format:

```typescript
// Success
{ success: true, data: T }

// Error
{ success: false, error: { code: string, message: string } }
```

5. Update `docs/ARCHITECTURE.md` with the new endpoint documentation.

6. Run type check to verify:

```bash
pnpm type-check
```
