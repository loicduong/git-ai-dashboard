# Git AI Dashboard Design

## Goal

Build a self-hosted dashboard that receives contribution telemetry pushed from `git-ai` on developer machines and helps engineering leads understand how much code is AI-assisted across repositories, authors, and time ranges.

The MVP uses a Next.js full-stack app with Supabase/Postgres. Ingestion endpoints are intentionally unauthenticated for the first version because the deployment target is an internal/self-hosted environment.

## Product Scope

The dashboard has five primary sections:

- Overview: company-wide AI vs human contribution trends, headline KPIs, and time filtering.
- Projects: repository list with drill-down pages for per-repo trends and activity.
- Leaderboard: ranking of AI super-users with minimum-volume safeguards.
- Activity: latest commit/activity records with AI contribution indicators.
- Onboarding: one-command setup guidance for developers.

The visual direction is `Executive Glass`: dark mode, subtle glassmorphism, blur, premium spacing, dense analytics, readable charts, and restrained visual noise.

## Architecture

Use Next.js App Router as both frontend and backend:

- API routes implement Git AI ingestion:
  - `POST /worker/metrics/upload`
  - `POST /worker/cas/upload`
- A server-only Supabase client writes ingestion data and reads dashboard data.
- A small service layer normalizes Git AI payloads, computes ratios, and exposes aggregated dashboard queries.
- Client components are reserved for charts, range controls, and interactive navigation. Data fetching and aggregation stay server-side where practical.

Supabase stores the raw and normalized data. The repo includes SQL migrations so the schema can be applied to Supabase self-hosted or Supabase cloud.

## Ingestion API

### `POST /worker/metrics/upload`

Receives Git AI sparse-array metrics payloads. The parser extracts:

- `human_additions` from metric index `0`
- `ai_additions` from metric index `1`
- `repo_url` from attribute index `1`
- `author` from attribute index `2`
- `timestamp` from payload timestamp if present, otherwise server receive time

The endpoint stores normalized numeric fields plus `raw_payload` for audit/debugging. It calculates:

- `total_additions = human_additions + ai_additions`
- `ai_ratio = ai_additions / total_additions`, with `0` when total is `0`

The endpoint returns a concise JSON response with accepted row count and rejected row count. Malformed rows are skipped when possible, and fully invalid payloads return `400`.

### `POST /worker/cas/upload`

Receives Git AI CAS objects that contain chat/transcript content between developers and AI tools.

For each CAS object, store:

- `hash`
- `content` as JSON
- `repo_url`
- `author`
- `metadata` as JSON

CAS writes are idempotent. Existing hashes are updated via upsert so repeated uploads do not create duplicates.

## Database Schema

### `metrics`

Columns:

- `id uuid primary key`
- `repo_url text not null`
- `author text not null`
- `timestamp timestamptz not null`
- `human_additions integer not null default 0`
- `ai_additions integer not null default 0`
- `total_additions integer not null default 0`
- `ai_ratio numeric not null default 0`
- `raw_payload jsonb not null`
- `created_at timestamptz not null default now()`

Indexes:

- `(timestamp desc)`
- `(repo_url, timestamp desc)`
- `(author, timestamp desc)`

### `cas_objects`

Columns:

- `hash text primary key`
- `repo_url text`
- `author text`
- `content jsonb not null`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:

- `(repo_url)`
- `(author)`
- `(updated_at desc)`

## Business Logic

Supported time ranges:

- `7d`
- `30d`
- `quarter`

AI percentage is calculated as:

```text
ai_ratio = ai_additions / (ai_additions + human_additions)
```

Display percentages use `ai_ratio * 100`.

Estimated hours saved is an MVP heuristic:

```text
hours_saved = ai_additions / 50
```

This is intentionally simple and should be shown as an estimate, not a precise productivity claim.

Leaderboard ranking should not over-rank tiny samples. Users below a minimum contribution threshold are either hidden or marked as low-volume. Initial threshold: `total_additions >= 100`.

## Frontend Design

The app opens directly to the dashboard, not a landing page.

Global layout:

- Persistent left sidebar with navigation.
- Top bar with current section title and range filter.
- Dark background with subtle layered glass panels.
- Lucide icons for navigation and compact action controls.
- Dense tables and charts optimized for scanning.

Pages:

- Overview:
  - KPI cards for AI-written lines, human-written lines, AI share, and estimated hours saved.
  - Line chart showing AI% and Human% over time.
  - Recent activity preview.
- Projects:
  - Repository table/list with AI share, total additions, active authors, and last activity.
  - Repo detail page with per-repo chart, contributors, and activity.
- Leaderboard:
  - Ranked contributors with AI additions, AI share, repos touched, and estimated hours saved.
  - Low-volume protection to avoid misleading rankings.
- Activity:
  - Latest records with timestamp, repo, author, additions, and AI ratio.
- Onboarding:
  - Copyable command:

```bash
git-ai config set api_base_url "https://your-dashboard-url.com"
```

## Error Handling

Ingestion endpoints should:

- Return `400` for missing or unparseable JSON payloads.
- Skip malformed rows inside otherwise valid batch uploads when possible.
- Include rejected row counts in successful batch responses.
- Store `raw_payload` for metrics so parser assumptions can be debugged later.

Dashboard queries should:

- Render empty states when no data exists.
- Avoid division by zero.
- Treat missing repo/author as invalid for normalized metrics records.

## Testing

Use test-first implementation for parser and aggregation behavior.

Initial tests:

- Metrics parser extracts human additions, AI additions, repo URL, author, and timestamp from sparse arrays.
- Metrics parser falls back to server time when timestamp is missing.
- AI ratio is `0` when total additions are `0`.
- CAS parser/upsert payload maps hash, content, repo, author, and metadata.
- Aggregation respects `7d`, `30d`, and `quarter` filters.

API route tests can be added after parser/service tests, focused on response codes and database write calls.

## Environment

Required server environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

No ingestion auth is included in the MVP. A later version can add `x-api-key` validation without changing the payload contract.

## Out of Scope For MVP

- Authentication and role-based access control.
- Multi-tenant organization management.
- Exact productivity/hour-saved modeling.
- Transcript search UI across CAS content.
- CI/CD or Vercel deployment automation.
