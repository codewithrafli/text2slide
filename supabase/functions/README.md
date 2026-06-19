# Supabase Setup and Edge Functions

This project utilizes Supabase for database storage, asset storage, and Edge Functions.

## Prerequisites

The Supabase CLI is included in `devDependencies`. For maximum reliability, execute using `pnpm dlx supabase`.

1.  **Authentication:**

    ```bash
    pnpm dlx supabase login
    ```

2.  **Project Linking:**
    ```bash
    pnpm dlx supabase link --project-ref your-project-ref
    ```

## Database Migrations

The project follows a migration-based strategy for schema management.

- **Apply Remote Migrations:**

  ```bash
  pnpm dlx supabase db push
  ```

- **Reset Local Database:**

  ```bash
  pnpm dlx supabase db reset
  ```

Migrations are managed within the `supabase/migrations` directory. Always use the Supabase CLI to push or reset the schema to ensure consistency.

## Edge Functions (generate-post)

Bypasses standard serverless timeouts for AI processing via OpenRouter.

### 1. Environment Configuration

Sync variables from `.env.local`:

```bash
pnpm dlx supabase secrets set --env-file .env.local
```

Note: Reserved variables such as `SUPABASE_URL` are handled automatically.

### 2. Deployment

```bash
pnpm dlx supabase functions deploy
```

### 3. Verification

Review logs in the Supabase Dashboard under Edge Functions.
