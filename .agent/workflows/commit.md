---
description: Create a proper commit
---

# Commit Workflow

1. Check staged files:

```bash
git status
```

2. View the actual changes to understand context:

```bash
git diff --staged
```

3. Based on the diff, generate a **conventional commit message**:

   **Format:**

   ```
   type: short summary (max 72 chars)

   - Bullet point explaining what changed
   - Another change if relevant
   - Why this change was made (if not obvious)
   ```

   **Types:**
   - `feat` - New feature
   - `fix` - Bug fix
   - `docs` - Documentation only
   - `style` - Formatting, no code change
   - `refactor` - Code restructure, no feature change
   - `test` - Adding tests
   - `chore` - Maintenance, deps, configs

4. Present the commit message to user for review/edit.

5. Once confirmed, stage and commit:

```bash
git add .
git commit -m "type: summary" -m "- detail 1" -m "- detail 2"
```

6. Report success. Do NOT push - user decides when/where to push.

## Guidelines

- Header: max 72 characters, lowercase, no period
- Body: explain what and why, not how (code shows how)
- Be specific: "fix: handle empty reddit response" not "fix: bug"
