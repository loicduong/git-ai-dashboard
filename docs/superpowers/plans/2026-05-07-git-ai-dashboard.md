# Git AI Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-hosted Next.js dashboard that receives Git AI pushed metrics/CAS data, stores it in Supabase, and presents Executive Glass analytics views.

**Architecture:** Scaffold a Next.js App Router app with Tailwind, shadcn/ui, Supabase, Vitest, and Recharts. Keep ingestion parsing and dashboard aggregation in server-side library modules with focused tests, then wire API routes and UI pages to those modules.

**Tech Stack:** Next.js, React, TypeScript, TailwindCSS, shadcn/ui, Lucide Icons, Recharts, Supabase/Postgres, Vitest.

---

## File Structure

- `package.json`: app scripts and dependencies.
- `next.config.ts`: Next.js config.
- `tsconfig.json`: TypeScript config.
- `postcss.config.mjs`: Tailwind PostCSS config.
- `components.json`: shadcn/ui configuration.
- `app/layout.tsx`: root layout and metadata.
- `app/globals.css`: dark Executive Glass theme tokens and base styles.
- `app/page.tsx`: Overview page.
- `app/projects/page.tsx`: Projects list page.
- `app/projects/[repoId]/page.tsx`: Project detail page.
- `app/leaderboard/page.tsx`: Leaderboard page.
- `app/activity/page.tsx`: Activity page.
- `app/onboarding/page.tsx`: Git AI onboarding page.
- `app/worker/metrics/upload/route.ts`: metrics ingestion endpoint.
- `app/worker/cas/upload/route.ts`: CAS ingestion endpoint.
- `components/app-shell.tsx`: sidebar, top bar, and page frame.
- `components/range-filter.tsx`: `7d / 30d / Quarter` range selector links.
- `components/kpi-card.tsx`: reusable KPI display.
- `components/metric-line-chart.tsx`: client chart component.
- `components/data-table.tsx`: compact table shell.
- `components/ui/*`: shadcn/ui source components.
- `lib/git-ai/metrics.ts`: metrics parser and ratio calculations.
- `lib/git-ai/cas.ts`: CAS parser and upsert row mapping.
- `lib/analytics/ranges.ts`: supported range parsing.
- `lib/analytics/aggregations.ts`: dashboard aggregation logic.
- `lib/supabase/server.ts`: server-only Supabase client.
- `lib/data/dashboard.ts`: Supabase query layer plus sample-data fallback for empty env.
- `lib/format.ts`: display formatting helpers.
- `supabase/migrations/20260507000000_initial_schema.sql`: schema and indexes.
- `test/git-ai/metrics.test.ts`: metrics parser tests.
- `test/git-ai/cas.test.ts`: CAS parser tests.
- `test/analytics/aggregations.test.ts`: range and aggregation tests.
- `.env.example`: required environment variables.

---

### Task 1: Scaffold Next.js, Tooling, And shadcn Base

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `components.json`
- Create: `vitest.config.ts`
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Create: `.env.example`

- [ ] **Step 1: Create the Next.js project files**

Create `package.json` with these scripts and dependencies:

```json
{
  "name": "git-ai-dashboard",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@radix-ui/react-slot": "latest",
    "@supabase/supabase-js": "latest",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "lucide-react": "latest",
    "next": "latest",
    "next-themes": "latest",
    "react": "latest",
    "react-dom": "latest",
    "recharts": "latest",
    "server-only": "latest",
    "tailwind-merge": "latest"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "latest",
    "@testing-library/react": "latest",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "tailwindcss": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

Create `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `postcss.config.mjs`:

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {}
  }
};

export default config;
```

Create `components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"]
  },
  resolve: {
    alias: {
      "@": new URL(".", import.meta.url).pathname
    }
  }
});
```

Create `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

- [ ] **Step 2: Create root layout and theme CSS**

Create `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Git AI Dashboard",
  description: "Self-hosted analytics for Git AI contribution metrics"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
```

Create `app/globals.css`:

```css
@import "tailwindcss";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
}

:root {
  --background: #06070d;
  --foreground: #f8fafc;
  --card: rgba(15, 23, 42, 0.68);
  --card-foreground: #f8fafc;
  --popover: #0f172a;
  --popover-foreground: #f8fafc;
  --primary: #d9f99d;
  --primary-foreground: #10140a;
  --secondary: rgba(148, 163, 184, 0.14);
  --secondary-foreground: #e2e8f0;
  --muted: rgba(148, 163, 184, 0.12);
  --muted-foreground: #94a3b8;
  --accent: rgba(45, 212, 191, 0.14);
  --accent-foreground: #ccfbf1;
  --destructive: #fb7185;
  --border: rgba(226, 232, 240, 0.12);
  --input: rgba(226, 232, 240, 0.14);
  --ring: #d9f99d;
}

* {
  border-color: var(--border);
}

body {
  min-height: 100vh;
  background:
    radial-gradient(circle at 14% 8%, rgba(45, 212, 191, 0.16), transparent 30%),
    radial-gradient(circle at 84% 12%, rgba(217, 249, 157, 0.12), transparent 26%),
    var(--background);
  color: var(--foreground);
}
```

- [ ] **Step 3: Install packages**

Run:

```bash
npm install
```

Expected: dependencies install and `package-lock.json` is created.

- [ ] **Step 4: Add required shadcn components**

Run:

```bash
npx shadcn@latest add button card badge table separator tooltip tabs
```

Expected: files are added under `components/ui`.

- [ ] **Step 5: Verify baseline**

Run:

```bash
npm test
npm run build
```

Expected: `npm test` exits with no tests or passing tests; `npm run build` compiles the empty app.

- [ ] **Step 6: Commit scaffold**

Run:

```bash
git add package.json package-lock.json next.config.ts tsconfig.json postcss.config.mjs components.json vitest.config.ts app components .env.example
git commit -m "feat: scaffold next dashboard app"
```

---

### Task 2: Database Schema And Server Supabase Client

**Files:**
- Create: `supabase/migrations/20260507000000_initial_schema.sql`
- Create: `lib/supabase/server.ts`

- [ ] **Step 1: Add migration SQL**

Create `supabase/migrations/20260507000000_initial_schema.sql`:

```sql
create extension if not exists "pgcrypto";

create table if not exists public.metrics (
  id uuid primary key default gen_random_uuid(),
  repo_url text not null,
  author text not null,
  "timestamp" timestamptz not null,
  human_additions integer not null default 0 check (human_additions >= 0),
  ai_additions integer not null default 0 check (ai_additions >= 0),
  total_additions integer not null default 0 check (total_additions >= 0),
  ai_ratio numeric not null default 0 check (ai_ratio >= 0 and ai_ratio <= 1),
  raw_payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists metrics_timestamp_idx
  on public.metrics ("timestamp" desc);

create index if not exists metrics_repo_timestamp_idx
  on public.metrics (repo_url, "timestamp" desc);

create index if not exists metrics_author_timestamp_idx
  on public.metrics (author, "timestamp" desc);

create table if not exists public.cas_objects (
  hash text primary key,
  repo_url text,
  author text,
  content jsonb not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cas_objects_repo_idx
  on public.cas_objects (repo_url);

create index if not exists cas_objects_author_idx
  on public.cas_objects (author);

create index if not exists cas_objects_updated_at_idx
  on public.cas_objects (updated_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cas_objects_set_updated_at on public.cas_objects;

create trigger cas_objects_set_updated_at
before update on public.cas_objects
for each row
execute function public.set_updated_at();
```

- [ ] **Step 2: Add server Supabase client**

Create `lib/supabase/server.ts`:

```ts
import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
```

- [ ] **Step 3: Verify TypeScript build**

Run:

```bash
npm run build
```

Expected: build passes.

- [ ] **Step 4: Commit schema and Supabase client**

Run:

```bash
git add supabase/migrations/20260507000000_initial_schema.sql lib/supabase/server.ts
git commit -m "feat: add supabase schema"
```

---

### Task 3: Metrics Parser With Tests

**Files:**
- Create: `test/git-ai/metrics.test.ts`
- Create: `lib/git-ai/metrics.ts`

- [ ] **Step 1: Write failing metrics parser tests**

Create `test/git-ai/metrics.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseMetricsUpload } from "@/lib/git-ai/metrics";

describe("parseMetricsUpload", () => {
  it("extracts sparse metrics rows from rows and attrs", () => {
    const receivedAt = new Date("2026-05-07T10:00:00.000Z");
    const payload = {
      rows: [
        {
          metrics: [120, 80],
          attrs: ["main", "https://github.com/acme/api", "loic@example.com"],
          timestamp: "2026-05-06T12:30:00.000Z"
        }
      ]
    };

    const result = parseMetricsUpload(payload, receivedAt);

    expect(result.rejected).toBe(0);
    expect(result.rows).toEqual([
      {
        repo_url: "https://github.com/acme/api",
        author: "loic@example.com",
        timestamp: "2026-05-06T12:30:00.000Z",
        human_additions: 120,
        ai_additions: 80,
        total_additions: 200,
        ai_ratio: 0.4,
        raw_payload: payload.rows[0]
      }
    ]);
  });

  it("falls back to server receive time when timestamp is missing", () => {
    const receivedAt = new Date("2026-05-07T10:00:00.000Z");
    const payload = {
      rows: [
        {
          metrics: [0, 20],
          attrs: ["main", "https://github.com/acme/web", "mai@example.com"]
        }
      ]
    };

    const result = parseMetricsUpload(payload, receivedAt);

    expect(result.rows[0]?.timestamp).toBe("2026-05-07T10:00:00.000Z");
  });

  it("returns ai ratio zero when total additions are zero", () => {
    const payload = {
      rows: [
        {
          metrics: [0, 0],
          attrs: ["main", "https://github.com/acme/api", "loic@example.com"]
        }
      ]
    };

    const result = parseMetricsUpload(payload, new Date("2026-05-07T10:00:00.000Z"));

    expect(result.rows[0]?.ai_ratio).toBe(0);
  });

  it("rejects malformed rows inside an otherwise valid upload", () => {
    const payload = {
      rows: [
        {
          metrics: [10, 5],
          attrs: ["main", "https://github.com/acme/api", "loic@example.com"]
        },
        {
          metrics: [1, 2],
          attrs: ["main", "", ""]
        }
      ]
    };

    const result = parseMetricsUpload(payload, new Date("2026-05-07T10:00:00.000Z"));

    expect(result.rows).toHaveLength(1);
    expect(result.rejected).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
npm test -- test/git-ai/metrics.test.ts
```

Expected: FAIL because `@/lib/git-ai/metrics` does not exist.

- [ ] **Step 3: Implement minimal metrics parser**

Create `lib/git-ai/metrics.ts`:

```ts
export type MetricInsertRow = {
  repo_url: string;
  author: string;
  timestamp: string;
  human_additions: number;
  ai_additions: number;
  total_additions: number;
  ai_ratio: number;
  raw_payload: unknown;
};

export type MetricsParseResult = {
  rows: MetricInsertRow[];
  rejected: number;
};

type SparseMetricRow = {
  metrics?: unknown[];
  attrs?: unknown[];
  timestamp?: unknown;
};

export function parseMetricsUpload(payload: unknown, receivedAt: Date): MetricsParseResult {
  const sourceRows = getSourceRows(payload);
  const rows: MetricInsertRow[] = [];
  let rejected = 0;

  for (const sourceRow of sourceRows) {
    const parsed = parseMetricRow(sourceRow, receivedAt);
    if (parsed) {
      rows.push(parsed);
    } else {
      rejected += 1;
    }
  }

  return { rows, rejected };
}

function getSourceRows(payload: unknown): SparseMetricRow[] {
  if (Array.isArray(payload)) {
    return payload as SparseMetricRow[];
  }

  if (isRecord(payload) && Array.isArray(payload.rows)) {
    return payload.rows as SparseMetricRow[];
  }

  if (isRecord(payload) && Array.isArray(payload.data)) {
    return payload.data as SparseMetricRow[];
  }

  return [];
}

function parseMetricRow(row: SparseMetricRow, receivedAt: Date): MetricInsertRow | null {
  if (!isRecord(row) || !Array.isArray(row.metrics) || !Array.isArray(row.attrs)) {
    return null;
  }

  const humanAdditions = toNonNegativeInteger(row.metrics[0]);
  const aiAdditions = toNonNegativeInteger(row.metrics[1]);
  const repoUrl = toRequiredString(row.attrs[1]);
  const author = toRequiredString(row.attrs[2]);

  if (humanAdditions === null || aiAdditions === null || !repoUrl || !author) {
    return null;
  }

  const totalAdditions = humanAdditions + aiAdditions;
  const timestamp = parseTimestamp(row.timestamp, receivedAt);

  return {
    repo_url: repoUrl,
    author,
    timestamp,
    human_additions: humanAdditions,
    ai_additions: aiAdditions,
    total_additions: totalAdditions,
    ai_ratio: totalAdditions === 0 ? 0 : aiAdditions / totalAdditions,
    raw_payload: row
  };
}

function parseTimestamp(value: unknown, fallback: Date): string {
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return fallback.toISOString();
}

function toNonNegativeInteger(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }

  return Math.trunc(value);
}

function toRequiredString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
```

- [ ] **Step 4: Run tests and verify GREEN**

Run:

```bash
npm test -- test/git-ai/metrics.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit metrics parser**

Run:

```bash
git add test/git-ai/metrics.test.ts lib/git-ai/metrics.ts
git commit -m "feat: parse git ai metrics uploads"
```

---

### Task 4: CAS Parser With Tests

**Files:**
- Create: `test/git-ai/cas.test.ts`
- Create: `lib/git-ai/cas.ts`

- [ ] **Step 1: Write failing CAS parser tests**

Create `test/git-ai/cas.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseCasUpload } from "@/lib/git-ai/cas";

describe("parseCasUpload", () => {
  it("maps CAS objects to upsert rows", () => {
    const payload = {
      objects: [
        {
          hash: "sha256:abc",
          content: { messages: [{ role: "user", content: "Refactor this" }] },
          metadata: {
            repo_url: "https://github.com/acme/api",
            author: "loic@example.com",
            tool: "cursor"
          }
        }
      ]
    };

    const result = parseCasUpload(payload);

    expect(result.rejected).toBe(0);
    expect(result.rows).toEqual([
      {
        hash: "sha256:abc",
        repo_url: "https://github.com/acme/api",
        author: "loic@example.com",
        content: { messages: [{ role: "user", content: "Refactor this" }] },
        metadata: {
          repo_url: "https://github.com/acme/api",
          author: "loic@example.com",
          tool: "cursor"
        }
      }
    ]);
  });

  it("accepts top-level repo and author metadata", () => {
    const payload = {
      repo_url: "https://github.com/acme/web",
      author: "mai@example.com",
      objects: [
        {
          hash: "sha256:def",
          content: { transcript: "hello" }
        }
      ]
    };

    const result = parseCasUpload(payload);

    expect(result.rows[0]?.repo_url).toBe("https://github.com/acme/web");
    expect(result.rows[0]?.author).toBe("mai@example.com");
  });

  it("rejects CAS objects without hash or JSON content", () => {
    const payload = {
      objects: [
        { hash: "", content: { ok: true } },
        { hash: "sha256:valid", content: { ok: true } }
      ]
    };

    const result = parseCasUpload(payload);

    expect(result.rows).toHaveLength(1);
    expect(result.rejected).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
npm test -- test/git-ai/cas.test.ts
```

Expected: FAIL because `@/lib/git-ai/cas` does not exist.

- [ ] **Step 3: Implement minimal CAS parser**

Create `lib/git-ai/cas.ts`:

```ts
export type CasUpsertRow = {
  hash: string;
  repo_url: string | null;
  author: string | null;
  content: unknown;
  metadata: Record<string, unknown>;
};

export type CasParseResult = {
  rows: CasUpsertRow[];
  rejected: number;
};

export function parseCasUpload(payload: unknown): CasParseResult {
  const sourceObjects = getSourceObjects(payload);
  const topLevelRepo = isRecord(payload) ? toOptionalString(payload.repo_url) : null;
  const topLevelAuthor = isRecord(payload) ? toOptionalString(payload.author) : null;
  const rows: CasUpsertRow[] = [];
  let rejected = 0;

  for (const sourceObject of sourceObjects) {
    const parsed = parseCasObject(sourceObject, topLevelRepo, topLevelAuthor);
    if (parsed) {
      rows.push(parsed);
    } else {
      rejected += 1;
    }
  }

  return { rows, rejected };
}

function getSourceObjects(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (isRecord(payload) && Array.isArray(payload.objects)) {
    return payload.objects;
  }

  if (isRecord(payload) && Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
}

function parseCasObject(
  value: unknown,
  topLevelRepo: string | null,
  topLevelAuthor: string | null
): CasUpsertRow | null {
  if (!isRecord(value)) {
    return null;
  }

  const hash = toOptionalString(value.hash);
  if (!hash || !("content" in value)) {
    return null;
  }

  const metadata = isRecord(value.metadata) ? value.metadata : {};
  const repoUrl = toOptionalString(metadata.repo_url) ?? toOptionalString(value.repo_url) ?? topLevelRepo;
  const author = toOptionalString(metadata.author) ?? toOptionalString(value.author) ?? topLevelAuthor;

  return {
    hash,
    repo_url: repoUrl,
    author,
    content: value.content,
    metadata
  };
}

function toOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
```

- [ ] **Step 4: Run tests and verify GREEN**

Run:

```bash
npm test -- test/git-ai/cas.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit CAS parser**

Run:

```bash
git add test/git-ai/cas.test.ts lib/git-ai/cas.ts
git commit -m "feat: parse git ai cas uploads"
```

---

### Task 5: Analytics Ranges And Aggregations With Tests

**Files:**
- Create: `test/analytics/aggregations.test.ts`
- Create: `lib/analytics/ranges.ts`
- Create: `lib/analytics/aggregations.ts`

- [ ] **Step 1: Write failing aggregation tests**

Create `test/analytics/aggregations.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { aggregateDashboardMetrics } from "@/lib/analytics/aggregations";
import { getRangeStart } from "@/lib/analytics/ranges";

describe("getRangeStart", () => {
  it("calculates supported range starts", () => {
    const now = new Date("2026-05-07T12:00:00.000Z");

    expect(getRangeStart("7d", now).toISOString()).toBe("2026-04-30T12:00:00.000Z");
    expect(getRangeStart("30d", now).toISOString()).toBe("2026-04-07T12:00:00.000Z");
    expect(getRangeStart("quarter", now).toISOString()).toBe("2026-04-01T00:00:00.000Z");
  });
});

describe("aggregateDashboardMetrics", () => {
  it("filters records by range and calculates KPI totals", () => {
    const now = new Date("2026-05-07T12:00:00.000Z");
    const result = aggregateDashboardMetrics(
      [
        {
          repo_url: "https://github.com/acme/api",
          author: "loic@example.com",
          timestamp: "2026-05-06T12:00:00.000Z",
          human_additions: 50,
          ai_additions: 150,
          total_additions: 200,
          ai_ratio: 0.75
        },
        {
          repo_url: "https://github.com/acme/web",
          author: "mai@example.com",
          timestamp: "2026-04-01T12:00:00.000Z",
          human_additions: 100,
          ai_additions: 0,
          total_additions: 100,
          ai_ratio: 0
        }
      ],
      "7d",
      now
    );

    expect(result.kpis.aiAdditions).toBe(150);
    expect(result.kpis.humanAdditions).toBe(50);
    expect(result.kpis.aiShare).toBe(0.75);
    expect(result.kpis.estimatedHoursSaved).toBe(3);
  });

  it("builds project and leaderboard summaries", () => {
    const now = new Date("2026-05-07T12:00:00.000Z");
    const result = aggregateDashboardMetrics(
      [
        {
          repo_url: "https://github.com/acme/api",
          author: "loic@example.com",
          timestamp: "2026-05-06T12:00:00.000Z",
          human_additions: 50,
          ai_additions: 150,
          total_additions: 200,
          ai_ratio: 0.75
        },
        {
          repo_url: "https://github.com/acme/api",
          author: "mai@example.com",
          timestamp: "2026-05-05T12:00:00.000Z",
          human_additions: 80,
          ai_additions: 20,
          total_additions: 100,
          ai_ratio: 0.2
        }
      ],
      "30d",
      now
    );

    expect(result.projects[0]).toMatchObject({
      repoUrl: "https://github.com/acme/api",
      totalAdditions: 300,
      aiAdditions: 170,
      activeAuthors: 2
    });
    expect(result.leaderboard[0]).toMatchObject({
      author: "loic@example.com",
      aiAdditions: 150,
      totalAdditions: 200,
      isLowVolume: false
    });
  });
});
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
npm test -- test/analytics/aggregations.test.ts
```

Expected: FAIL because analytics modules do not exist.

- [ ] **Step 3: Implement ranges and aggregations**

Create `lib/analytics/ranges.ts`:

```ts
export type DashboardRange = "7d" | "30d" | "quarter";

export function parseDashboardRange(value: string | string[] | undefined): DashboardRange {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (candidate === "7d" || candidate === "30d" || candidate === "quarter") {
    return candidate;
  }

  return "30d";
}

export function getRangeStart(range: DashboardRange, now: Date): Date {
  if (range === "7d") {
    return subtractDays(now, 7);
  }

  if (range === "30d") {
    return subtractDays(now, 30);
  }

  return new Date(Date.UTC(now.getUTCFullYear(), Math.floor(now.getUTCMonth() / 3) * 3, 1, 0, 0, 0, 0));
}

function subtractDays(date: Date, days: number): Date {
  return new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
}
```

Create `lib/analytics/aggregations.ts`:

```ts
import { type DashboardRange, getRangeStart } from "@/lib/analytics/ranges";

export type MetricRecord = {
  repo_url: string;
  author: string;
  timestamp: string;
  human_additions: number;
  ai_additions: number;
  total_additions: number;
  ai_ratio: number;
};

export type DashboardAggregation = {
  kpis: {
    aiAdditions: number;
    humanAdditions: number;
    totalAdditions: number;
    aiShare: number;
    estimatedHoursSaved: number;
  };
  trend: Array<{
    date: string;
    aiShare: number;
    humanShare: number;
  }>;
  projects: Array<{
    repoUrl: string;
    totalAdditions: number;
    aiAdditions: number;
    humanAdditions: number;
    aiShare: number;
    activeAuthors: number;
    lastActivity: string;
  }>;
  leaderboard: Array<{
    author: string;
    aiAdditions: number;
    totalAdditions: number;
    aiShare: number;
    reposTouched: number;
    estimatedHoursSaved: number;
    isLowVolume: boolean;
  }>;
  activity: MetricRecord[];
};

const MIN_LEADERBOARD_VOLUME = 100;

export function aggregateDashboardMetrics(
  records: MetricRecord[],
  range: DashboardRange,
  now: Date
): DashboardAggregation {
  const start = getRangeStart(range, now);
  const scoped = records
    .filter((record) => new Date(record.timestamp) >= start)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const aiAdditions = sum(scoped, "ai_additions");
  const humanAdditions = sum(scoped, "human_additions");
  const totalAdditions = aiAdditions + humanAdditions;

  return {
    kpis: {
      aiAdditions,
      humanAdditions,
      totalAdditions,
      aiShare: ratio(aiAdditions, totalAdditions),
      estimatedHoursSaved: aiAdditions / 50
    },
    trend: buildTrend(scoped),
    projects: buildProjects(scoped),
    leaderboard: buildLeaderboard(scoped),
    activity: scoped.slice(0, 30)
  };
}

function buildTrend(records: MetricRecord[]) {
  const byDate = new Map<string, { ai: number; human: number }>();

  for (const record of records) {
    const date = record.timestamp.slice(0, 10);
    const current = byDate.get(date) ?? { ai: 0, human: 0 };
    current.ai += record.ai_additions;
    current.human += record.human_additions;
    byDate.set(date, current);
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => {
      const total = value.ai + value.human;
      return {
        date,
        aiShare: ratio(value.ai, total),
        humanShare: ratio(value.human, total)
      };
    });
}

function buildProjects(records: MetricRecord[]) {
  const byRepo = new Map<
    string,
    { ai: number; human: number; authors: Set<string>; lastActivity: string }
  >();

  for (const record of records) {
    const current = byRepo.get(record.repo_url) ?? {
      ai: 0,
      human: 0,
      authors: new Set<string>(),
      lastActivity: record.timestamp
    };
    current.ai += record.ai_additions;
    current.human += record.human_additions;
    current.authors.add(record.author);
    if (new Date(record.timestamp) > new Date(current.lastActivity)) {
      current.lastActivity = record.timestamp;
    }
    byRepo.set(record.repo_url, current);
  }

  return Array.from(byRepo.entries())
    .map(([repoUrl, value]) => {
      const total = value.ai + value.human;
      return {
        repoUrl,
        totalAdditions: total,
        aiAdditions: value.ai,
        humanAdditions: value.human,
        aiShare: ratio(value.ai, total),
        activeAuthors: value.authors.size,
        lastActivity: value.lastActivity
      };
    })
    .sort((a, b) => b.totalAdditions - a.totalAdditions);
}

function buildLeaderboard(records: MetricRecord[]) {
  const byAuthor = new Map<string, { ai: number; human: number; repos: Set<string> }>();

  for (const record of records) {
    const current = byAuthor.get(record.author) ?? {
      ai: 0,
      human: 0,
      repos: new Set<string>()
    };
    current.ai += record.ai_additions;
    current.human += record.human_additions;
    current.repos.add(record.repo_url);
    byAuthor.set(record.author, current);
  }

  return Array.from(byAuthor.entries())
    .map(([author, value]) => {
      const total = value.ai + value.human;
      return {
        author,
        aiAdditions: value.ai,
        totalAdditions: total,
        aiShare: ratio(value.ai, total),
        reposTouched: value.repos.size,
        estimatedHoursSaved: value.ai / 50,
        isLowVolume: total < MIN_LEADERBOARD_VOLUME
      };
    })
    .sort((a, b) => b.aiAdditions - a.aiAdditions);
}

function sum(records: MetricRecord[], key: "ai_additions" | "human_additions") {
  return records.reduce((total, record) => total + record[key], 0);
}

function ratio(part: number, total: number) {
  return total === 0 ? 0 : part / total;
}
```

- [ ] **Step 4: Run tests and verify GREEN**

Run:

```bash
npm test -- test/analytics/aggregations.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit analytics logic**

Run:

```bash
git add test/analytics/aggregations.test.ts lib/analytics/ranges.ts lib/analytics/aggregations.ts
git commit -m "feat: aggregate dashboard metrics"
```

---

### Task 6: Ingestion API Routes

**Files:**
- Create: `app/worker/metrics/upload/route.ts`
- Create: `app/worker/cas/upload/route.ts`

- [ ] **Step 1: Add metrics upload route**

Create `app/worker/metrics/upload/route.ts`:

```ts
import { NextResponse } from "next/server";
import { parseMetricsUpload } from "@/lib/git-ai/metrics";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = parseMetricsUpload(payload, new Date());

  if (parsed.rows.length === 0) {
    return NextResponse.json(
      { error: "No valid metrics rows", accepted: 0, rejected: parsed.rejected },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("metrics").insert(parsed.rows);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    accepted: parsed.rows.length,
    rejected: parsed.rejected
  });
}
```

- [ ] **Step 2: Add CAS upload route**

Create `app/worker/cas/upload/route.ts`:

```ts
import { NextResponse } from "next/server";
import { parseCasUpload } from "@/lib/git-ai/cas";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = parseCasUpload(payload);

  if (parsed.rows.length === 0) {
    return NextResponse.json(
      { error: "No valid CAS objects", accepted: 0, rejected: parsed.rejected },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("cas_objects").upsert(parsed.rows, {
    onConflict: "hash"
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    accepted: parsed.rows.length,
    rejected: parsed.rejected
  });
}
```

- [ ] **Step 3: Verify build**

Run:

```bash
npm run build
```

Expected: build passes.

- [ ] **Step 4: Commit ingestion routes**

Run:

```bash
git add app/worker/metrics/upload/route.ts app/worker/cas/upload/route.ts
git commit -m "feat: add git ai ingestion endpoints"
```

---

### Task 7: Dashboard Data Layer And Sample Fallback

**Files:**
- Create: `lib/data/dashboard.ts`
- Create: `lib/format.ts`

- [ ] **Step 1: Add formatting helpers**

Create `lib/format.ts`:

```ts
export function formatInteger(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  }).format(value);
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1
  }).format(value);
}

export function shortRepoName(repoUrl: string) {
  return repoUrl.replace(/^https?:\/\/[^/]+\//, "").replace(/\.git$/, "");
}
```

- [ ] **Step 2: Add dashboard query layer with fallback data**

Create `lib/data/dashboard.ts`:

```ts
import "server-only";
import {
  aggregateDashboardMetrics,
  type DashboardAggregation,
  type MetricRecord
} from "@/lib/analytics/aggregations";
import { type DashboardRange } from "@/lib/analytics/ranges";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getDashboardData(
  range: DashboardRange,
  now = new Date()
): Promise<DashboardAggregation> {
  const records = await getMetricRecords();
  return aggregateDashboardMetrics(records, range, now);
}

async function getMetricRecords(): Promise<MetricRecord[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return sampleMetrics;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("metrics")
    .select("repo_url, author, timestamp, human_additions, ai_additions, total_additions, ai_ratio")
    .order("timestamp", { ascending: false })
    .limit(1000);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

const sampleMetrics: MetricRecord[] = [
  {
    repo_url: "https://github.com/acme/platform",
    author: "loic@example.com",
    timestamp: "2026-05-06T10:00:00.000Z",
    human_additions: 220,
    ai_additions: 480,
    total_additions: 700,
    ai_ratio: 0.6857
  },
  {
    repo_url: "https://github.com/acme/platform",
    author: "mai@example.com",
    timestamp: "2026-05-05T10:00:00.000Z",
    human_additions: 180,
    ai_additions: 260,
    total_additions: 440,
    ai_ratio: 0.5909
  },
  {
    repo_url: "https://github.com/acme/api",
    author: "an@example.com",
    timestamp: "2026-05-04T10:00:00.000Z",
    human_additions: 340,
    ai_additions: 120,
    total_additions: 460,
    ai_ratio: 0.2608
  },
  {
    repo_url: "https://github.com/acme/mobile",
    author: "loic@example.com",
    timestamp: "2026-05-03T10:00:00.000Z",
    human_additions: 90,
    ai_additions: 210,
    total_additions: 300,
    ai_ratio: 0.7
  }
];
```

- [ ] **Step 3: Verify tests and build**

Run:

```bash
npm test
npm run build
```

Expected: tests and build pass.

- [ ] **Step 4: Commit data layer**

Run:

```bash
git add lib/data/dashboard.ts lib/format.ts
git commit -m "feat: add dashboard data layer"
```

---

### Task 8: Executive Glass Layout Components

**Files:**
- Create: `lib/utils.ts`
- Create: `components/app-shell.tsx`
- Create: `components/range-filter.tsx`
- Create: `components/kpi-card.tsx`
- Create: `components/data-table.tsx`
- Create: `components/metric-line-chart.tsx`

- [ ] **Step 1: Add `cn` utility**

Create `lib/utils.ts`:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Add app shell**

Create `components/app-shell.tsx`:

```tsx
import Link from "next/link";
import {
  ActivityIcon,
  BarChart3Icon,
  GitBranchIcon,
  LayoutDashboardIcon,
  TrophyIcon
} from "lucide-react";
import { RangeFilter } from "@/components/range-filter";
import { type DashboardRange } from "@/lib/analytics/ranges";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboardIcon },
  { href: "/projects", label: "Projects", icon: GitBranchIcon },
  { href: "/leaderboard", label: "Leaderboard", icon: TrophyIcon },
  { href: "/activity", label: "Activity", icon: ActivityIcon },
  { href: "/onboarding", label: "Onboarding", icon: BarChart3Icon }
];

export function AppShell({
  title,
  range,
  children
}: {
  title: string;
  range?: DashboardRange;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card/60 px-4 py-5 backdrop-blur-xl lg:block">
        <Link href="/" className="flex items-center gap-3 px-2 text-sm font-semibold">
          <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground">
            AI
          </span>
          <span>Git AI Dashboard</span>
        </Link>
        <nav className="mt-8 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <item.icon />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b bg-background/72 px-5 py-4 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Executive Glass</p>
              <h1 className="text-2xl font-semibold">{title}</h1>
            </div>
            {range ? <RangeFilter range={range} /> : null}
          </div>
        </header>
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-6">{children}</div>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Add range filter**

Create `components/range-filter.tsx`:

```tsx
import Link from "next/link";
import { type DashboardRange } from "@/lib/analytics/ranges";
import { cn } from "@/lib/utils";

const ranges: Array<{ value: DashboardRange; label: string }> = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "quarter", label: "Quarter" }
];

export function RangeFilter({ range }: { range: DashboardRange }) {
  return (
    <div className="flex rounded-md border bg-card/70 p-1 backdrop-blur-xl">
      {ranges.map((item) => (
        <Link
          key={item.value}
          href={`?range=${item.value}`}
          className={cn(
            "rounded px-3 py-1.5 text-sm text-muted-foreground",
            item.value === range && "bg-primary text-primary-foreground"
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Add KPI and table components**

Create `components/kpi-card.tsx`:

```tsx
import { type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function KpiCard({
  title,
  value,
  detail,
  icon: Icon
}: {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="bg-card/70 backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">{value}</div>
        <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
```

Create `components/data-table.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DataTable({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="bg-card/70 backdrop-blur-xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">{children}</CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: Add chart component**

Create `components/metric-line-chart.tsx`:

```tsx
"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export function MetricLineChart({
  data
}: {
  data: Array<{ date: string; aiShare: number; humanShare: number }>;
}) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(226,232,240,0.12)" vertical={false} />
          <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} axisLine={false} />
          <YAxis
            stroke="#94a3b8"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${Math.round(Number(value) * 100)}%`}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(15,23,42,0.94)",
              border: "1px solid rgba(226,232,240,0.14)",
              borderRadius: 8
            }}
            formatter={(value) => `${Math.round(Number(value) * 100)}%`}
          />
          <Line type="monotone" dataKey="aiShare" stroke="#d9f99d" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="humanShare" stroke="#5eead4" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 6: Verify build**

Run:

```bash
npm run build
```

Expected: build passes.

- [ ] **Step 7: Commit layout components**

Run:

```bash
git add lib/utils.ts components/app-shell.tsx components/range-filter.tsx components/kpi-card.tsx components/data-table.tsx components/metric-line-chart.tsx
git commit -m "feat: add executive glass dashboard shell"
```

---

### Task 9: Dashboard Pages

**Files:**
- Create/Modify: `app/page.tsx`
- Create: `app/projects/page.tsx`
- Create: `app/projects/[repoId]/page.tsx`
- Create: `app/leaderboard/page.tsx`
- Create: `app/activity/page.tsx`
- Create: `app/onboarding/page.tsx`

- [ ] **Step 1: Add Overview page**

Create `app/page.tsx`:

```tsx
import { BotIcon, ClockIcon, Code2Icon, UsersIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { KpiCard } from "@/components/kpi-card";
import { MetricLineChart } from "@/components/metric-line-chart";
import { getDashboardData } from "@/lib/data/dashboard";
import { formatInteger, formatPercent, shortRepoName } from "@/lib/format";
import { parseDashboardRange } from "@/lib/analytics/ranges";

export default async function OverviewPage({
  searchParams
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = parseDashboardRange(params.range);
  const data = await getDashboardData(range);

  return (
    <AppShell title="Overview" range={range}>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="AI-written lines" value={formatInteger(data.kpis.aiAdditions)} detail="Generated or AI-assisted additions" icon={BotIcon} />
        <KpiCard title="Human-written lines" value={formatInteger(data.kpis.humanAdditions)} detail="Direct human additions" icon={UsersIcon} />
        <KpiCard title="AI share" value={formatPercent(data.kpis.aiShare)} detail="AI additions divided by total additions" icon={Code2Icon} />
        <KpiCard title="Hours saved" value={formatInteger(data.kpis.estimatedHoursSaved)} detail="Estimated at 50 AI lines per hour" icon={ClockIcon} />
      </section>
      <section className="rounded-lg border bg-card/70 p-5 backdrop-blur-xl">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">AI vs Human Contribution</h2>
          <p className="text-sm text-muted-foreground">Trend by commit activity date</p>
        </div>
        <MetricLineChart data={data.trend} />
      </section>
      <DataTable title="Recent Activity">
        <table className="w-full text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-2">Repo</th>
              <th className="py-2">Author</th>
              <th className="py-2">AI</th>
              <th className="py-2">Human</th>
              <th className="py-2">AI Share</th>
            </tr>
          </thead>
          <tbody>
            {data.activity.slice(0, 8).map((item) => (
              <tr key={`${item.repo_url}-${item.author}-${item.timestamp}`} className="border-t">
                <td className="py-3">{shortRepoName(item.repo_url)}</td>
                <td className="py-3 text-muted-foreground">{item.author}</td>
                <td className="py-3">{formatInteger(item.ai_additions)}</td>
                <td className="py-3">{formatInteger(item.human_additions)}</td>
                <td className="py-3">{formatPercent(item.ai_ratio)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTable>
    </AppShell>
  );
}
```

- [ ] **Step 2: Add Projects pages**

Create `app/projects/page.tsx`:

```tsx
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { getDashboardData } from "@/lib/data/dashboard";
import { formatInteger, formatPercent, shortRepoName } from "@/lib/format";
import { parseDashboardRange } from "@/lib/analytics/ranges";

export default async function ProjectsPage({
  searchParams
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = parseDashboardRange(params.range);
  const data = await getDashboardData(range);

  return (
    <AppShell title="Projects" range={range}>
      <DataTable title="Repositories">
        <table className="w-full text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-2">Repository</th>
              <th className="py-2">AI Share</th>
              <th className="py-2">Total Lines</th>
              <th className="py-2">Authors</th>
              <th className="py-2">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {data.projects.map((project) => (
              <tr key={project.repoUrl} className="border-t">
                <td className="py-3">
                  <Link className="hover:text-primary" href={`/projects/${encodeURIComponent(project.repoUrl)}`}>
                    {shortRepoName(project.repoUrl)}
                  </Link>
                </td>
                <td className="py-3">{formatPercent(project.aiShare)}</td>
                <td className="py-3">{formatInteger(project.totalAdditions)}</td>
                <td className="py-3">{project.activeAuthors}</td>
                <td className="py-3 text-muted-foreground">{project.lastActivity.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTable>
    </AppShell>
  );
}
```

Create `app/projects/[repoId]/page.tsx`:

```tsx
import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { MetricLineChart } from "@/components/metric-line-chart";
import { getDashboardData } from "@/lib/data/dashboard";
import { formatInteger, formatPercent, shortRepoName } from "@/lib/format";
import { parseDashboardRange } from "@/lib/analytics/ranges";

export default async function ProjectDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ repoId: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const [{ repoId }, query] = await Promise.all([params, searchParams]);
  const repoUrl = decodeURIComponent(repoId);
  const range = parseDashboardRange(query.range);
  const data = await getDashboardData(range);
  const activity = data.activity.filter((item) => item.repo_url === repoUrl);
  const project = data.projects.find((item) => item.repoUrl === repoUrl);

  return (
    <AppShell title={shortRepoName(repoUrl)} range={range}>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card/70 p-5 backdrop-blur-xl">
          <p className="text-sm text-muted-foreground">AI Share</p>
          <p className="mt-2 text-3xl font-semibold">{formatPercent(project?.aiShare ?? 0)}</p>
        </div>
        <div className="rounded-lg border bg-card/70 p-5 backdrop-blur-xl">
          <p className="text-sm text-muted-foreground">Total Lines</p>
          <p className="mt-2 text-3xl font-semibold">{formatInteger(project?.totalAdditions ?? 0)}</p>
        </div>
        <div className="rounded-lg border bg-card/70 p-5 backdrop-blur-xl">
          <p className="text-sm text-muted-foreground">Active Authors</p>
          <p className="mt-2 text-3xl font-semibold">{project?.activeAuthors ?? 0}</p>
        </div>
      </section>
      <section className="rounded-lg border bg-card/70 p-5 backdrop-blur-xl">
        <MetricLineChart data={data.trend} />
      </section>
      <DataTable title="Project Activity">
        <table className="w-full text-left text-sm">
          <tbody>
            {activity.map((item) => (
              <tr key={`${item.author}-${item.timestamp}`} className="border-t">
                <td className="py-3">{item.timestamp.slice(0, 10)}</td>
                <td className="py-3 text-muted-foreground">{item.author}</td>
                <td className="py-3">{formatInteger(item.ai_additions)} AI</td>
                <td className="py-3">{formatInteger(item.human_additions)} human</td>
                <td className="py-3">{formatPercent(item.ai_ratio)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTable>
    </AppShell>
  );
}
```

- [ ] **Step 3: Add Leaderboard page**

Create `app/leaderboard/page.tsx`:

```tsx
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { getDashboardData } from "@/lib/data/dashboard";
import { formatInteger, formatPercent } from "@/lib/format";
import { parseDashboardRange } from "@/lib/analytics/ranges";

export default async function LeaderboardPage({
  searchParams
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = parseDashboardRange(params.range);
  const data = await getDashboardData(range);

  return (
    <AppShell title="Leaderboard" range={range}>
      <DataTable title="AI Super-users">
        <table className="w-full text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-2">Rank</th>
              <th className="py-2">Author</th>
              <th className="py-2">AI Lines</th>
              <th className="py-2">AI Share</th>
              <th className="py-2">Repos</th>
              <th className="py-2">Hours Saved</th>
              <th className="py-2">Signal</th>
            </tr>
          </thead>
          <tbody>
            {data.leaderboard.map((person, index) => (
              <tr key={person.author} className="border-t">
                <td className="py-3 text-muted-foreground">#{index + 1}</td>
                <td className="py-3 font-medium">{person.author}</td>
                <td className="py-3">{formatInteger(person.aiAdditions)}</td>
                <td className="py-3">{formatPercent(person.aiShare)}</td>
                <td className="py-3">{person.reposTouched}</td>
                <td className="py-3">{formatInteger(person.estimatedHoursSaved)}</td>
                <td className="py-3">
                  <Badge variant={person.isLowVolume ? "secondary" : "default"}>
                    {person.isLowVolume ? "Low volume" : "Qualified"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTable>
    </AppShell>
  );
}
```

- [ ] **Step 4: Add Activity page**

Create `app/activity/page.tsx`:

```tsx
import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { getDashboardData } from "@/lib/data/dashboard";
import { formatInteger, formatPercent, shortRepoName } from "@/lib/format";
import { parseDashboardRange } from "@/lib/analytics/ranges";

export default async function ActivityPage({
  searchParams
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = parseDashboardRange(params.range);
  const data = await getDashboardData(range);

  return (
    <AppShell title="Activity" range={range}>
      <DataTable title="Latest Commit Activity">
        <table className="w-full text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-2">Date</th>
              <th className="py-2">Repository</th>
              <th className="py-2">Author</th>
              <th className="py-2">AI Lines</th>
              <th className="py-2">Human Lines</th>
              <th className="py-2">AI Share</th>
            </tr>
          </thead>
          <tbody>
            {data.activity.map((item) => (
              <tr key={`${item.repo_url}-${item.author}-${item.timestamp}`} className="border-t">
                <td className="py-3 text-muted-foreground">{item.timestamp.slice(0, 10)}</td>
                <td className="py-3">{shortRepoName(item.repo_url)}</td>
                <td className="py-3 text-muted-foreground">{item.author}</td>
                <td className="py-3">{formatInteger(item.ai_additions)}</td>
                <td className="py-3">{formatInteger(item.human_additions)}</td>
                <td className="py-3">{formatPercent(item.ai_ratio)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTable>
    </AppShell>
  );
}
```

- [ ] **Step 5: Add Onboarding page**

Create `app/onboarding/page.tsx`:

```tsx
import { TerminalIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const command = 'git-ai config set api_base_url "https://your-dashboard-url.com"';

export default function OnboardingPage() {
  return (
    <AppShell title="Onboarding">
      <Card className="bg-card/70 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <TerminalIcon />
            Connect Git AI
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Run this command on each developer machine so Git AI pushes metrics and CAS transcripts to this dashboard.
          </p>
          <pre className="overflow-x-auto rounded-md border bg-background/70 p-4 text-sm">
            <code>{command}</code>
          </pre>
          <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
            <div className="rounded-md border bg-secondary/40 p-4">
              <p className="font-medium text-foreground">Metrics endpoint</p>
              <p className="mt-1">POST /worker/metrics/upload</p>
            </div>
            <div className="rounded-md border bg-secondary/40 p-4">
              <p className="font-medium text-foreground">CAS endpoint</p>
              <p className="mt-1">POST /worker/cas/upload</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
```

The rendered onboarding page must include this command exactly:

```bash
git-ai config set api_base_url "https://your-dashboard-url.com"
```

- [ ] **Step 6: Verify build**

Run:

```bash
npm run build
```

Expected: all dashboard pages compile.

- [ ] **Step 7: Commit pages**

Run:

```bash
git add app/page.tsx app/projects app/leaderboard app/activity app/onboarding
git commit -m "feat: add dashboard pages"
```

---

### Task 10: Final Verification And Local Run

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update README**

Replace `README.md` with:

```md
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
```

- [ ] **Step 2: Run full verification**

Run:

```bash
npm test
npm run build
```

Expected: tests pass and build completes.

- [ ] **Step 3: Start local dev server**

Run:

```bash
npm run dev
```

Expected: Next.js starts, usually at `http://localhost:3000`.

- [ ] **Step 4: Manually verify pages**

Open:

```text
http://localhost:3000/
http://localhost:3000/projects
http://localhost:3000/leaderboard
http://localhost:3000/activity
http://localhost:3000/onboarding
```

Expected: each page renders in dark Executive Glass style with sample data when Supabase env vars are absent.

- [ ] **Step 5: Commit final docs**

Run:

```bash
git add README.md
git commit -m "docs: add dashboard setup instructions"
```

---

## Self-Review

Spec coverage:

- Ingestion endpoints are implemented in Task 6.
- Metrics and CAS schema are implemented in Task 2.
- Sparse metrics extraction is implemented and tested in Task 3.
- CAS object mapping is implemented and tested in Task 4.
- AI ratio, time ranges, hours-saved heuristic, project summaries, leaderboard, and activity are implemented in Task 5 and surfaced in Tasks 7-9.
- Executive Glass UI and required pages are implemented in Tasks 8-9.
- Onboarding command is included in Task 9 and README in Task 10.
- No ingestion auth is included, matching the approved MVP.

Plan constraints:

- Parser and aggregation tasks are test-first.
- Each task has explicit files, commands, and expected outcomes.
- There are no deferred implementation placeholders in required behavior.
