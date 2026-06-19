---
description: Format and lint all code
---

# Format Workflow

// turbo-all

1. Format all files with Prettier:

```bash
pnpm format
```

2. Fix lint issues:

```bash
pnpm lint:fix
```

3. Check for remaining type errors:

```bash
pnpm type-check
```

4. Report status. If clean, ready to commit.
