# git-ai-dashboard

Self-hosted dashboard for tracking AI-assisted code contribution metrics pushed by `git-ai`.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Supabase

Apply `supabase/migrations/20260507000000_initial_schema.sql` to your Supabase/Postgres database.

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Git AI Onboarding

```bash
git-ai config set api_base_url "https://your-dashboard-url.com"
```
