import { afterEach, describe, expect, it, vi } from "vitest";

import { getDashboardData, getProjectDashboardData } from "@/lib/data/dashboard";

const supabaseMocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: supabaseMocks.createSupabaseServerClient,
}));

const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
  process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRoleKey;
  supabaseMocks.createSupabaseServerClient.mockReset();
});

describe("getDashboardData", () => {
  it("returns sample fallback data inside the current quarter range", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const result = await getDashboardData("quarter", new Date("2026-07-01T00:00:00.000Z"));

    expect(result.activity.length).toBeGreaterThan(0);
    expect(result.kpis.totalAdditions).toBeGreaterThan(0);
  });

  it("filters Supabase metrics to the requested dashboard range before aggregation", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    const query = {
      select: vi.fn(),
      gte: vi.fn(),
      lte: vi.fn(),
      order: vi.fn(),
      range: vi.fn(),
    };
    const supabase = {
      from: vi.fn(() => query),
    };
    query.select.mockReturnValue(query);
    query.gte.mockReturnValue(query);
    query.lte.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.range.mockResolvedValue({ data: [], error: null });
    supabaseMocks.createSupabaseServerClient.mockReturnValue(supabase);

    await getDashboardData("7d", new Date("2026-05-07T12:00:00.000Z"));

    expect(query.gte).toHaveBeenCalledWith("timestamp", "2026-04-30T12:00:00.000Z");
    expect(query.lte).toHaveBeenCalledWith("timestamp", "2026-05-07T12:00:00.000Z");
    expect(query.order).toHaveBeenCalledWith("timestamp", { ascending: false });
    expect(query.range).toHaveBeenCalledWith(0, 999);
    expect(query).not.toHaveProperty("limit");
  });

  it("aggregates Supabase metrics from every fetched page", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    const firstPage = Array.from({ length: 1000 }, () =>
      metric({
        repo_url: "https://github.com/acme/api",
        author: "mai@example.com",
        timestamp: "2026-05-06T12:00:00.000Z",
        human_additions: 1,
        ai_additions: 1,
      }),
    );
    const secondPage = [
      metric({
        repo_url: "https://github.com/acme/mobile",
        author: "loic@example.com",
        timestamp: "2026-05-05T12:00:00.000Z",
        human_additions: 10,
        ai_additions: 40,
      }),
    ];
    const query = {
      select: vi.fn(),
      gte: vi.fn(),
      lte: vi.fn(),
      order: vi.fn(),
      range: vi.fn(),
    };
    const supabase = {
      from: vi.fn(() => query),
    };
    query.select.mockReturnValue(query);
    query.gte.mockReturnValue(query);
    query.lte.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.range
      .mockResolvedValueOnce({ data: firstPage, error: null })
      .mockResolvedValueOnce({ data: secondPage, error: null });
    supabaseMocks.createSupabaseServerClient.mockReturnValue(supabase);

    const result = await getDashboardData("7d", new Date("2026-05-07T12:00:00.000Z"));

    expect(query.range).toHaveBeenNthCalledWith(1, 0, 999);
    expect(query.range).toHaveBeenNthCalledWith(2, 1000, 1999);
    expect(result.kpis.aiAdditions).toBe(1040);
    expect(result.kpis.humanAdditions).toBe(1010);
    expect(result.projects.map((project) => project.repoUrl)).toContain(
      "https://github.com/acme/mobile",
    );
  });

  it("fetches project dashboard data with repo-scoped pagination", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    const repoUrl = "https://github.com/acme/platform.git";
    const firstPage = Array.from({ length: 1000 }, () =>
      metric({
        repo_url: repoUrl,
        author: "mai@example.com",
        timestamp: "2026-05-06T12:00:00.000Z",
        human_additions: 1,
        ai_additions: 1,
      }),
    );
    const secondPage = [
      metric({
        repo_url: repoUrl,
        author: "loic@example.com",
        timestamp: "2026-05-05T12:00:00.000Z",
        human_additions: 10,
        ai_additions: 40,
      }),
    ];
    const query = {
      select: vi.fn(),
      gte: vi.fn(),
      lte: vi.fn(),
      order: vi.fn(),
      eq: vi.fn(),
      range: vi.fn(),
    };
    const supabase = {
      from: vi.fn(() => query),
    };
    query.select.mockReturnValue(query);
    query.gte.mockReturnValue(query);
    query.lte.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.range
      .mockResolvedValueOnce({ data: firstPage, error: null })
      .mockResolvedValueOnce({ data: secondPage, error: null });
    supabaseMocks.createSupabaseServerClient.mockReturnValue(supabase);

    const result = await getProjectDashboardData(repoUrl, "7d", new Date("2026-05-07T12:00:00.000Z"));

    expect(query.eq).toHaveBeenCalledWith("repo_url", repoUrl);
    expect(query.range).toHaveBeenNthCalledWith(1, 0, 999);
    expect(query.range).toHaveBeenNthCalledWith(2, 1000, 1999);
    expect(result.kpis.aiAdditions).toBe(1040);
    expect(result.kpis.humanAdditions).toBe(1010);
    expect(result.activity).toHaveLength(30);
  });
});

function metric(record: {
  repo_url: string;
  author: string;
  timestamp: string;
  human_additions: number;
  ai_additions: number;
}) {
  const totalAdditions = record.human_additions + record.ai_additions;

  return {
    ...record,
    total_additions: totalAdditions,
    ai_ratio: totalAdditions === 0 ? 0 : record.ai_additions / totalAdditions,
  };
}
