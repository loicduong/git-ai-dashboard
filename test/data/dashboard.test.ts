import { afterEach, describe, expect, it, vi } from "vitest";

import { getDashboardData } from "@/lib/data/dashboard";

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
    };
    const supabase = {
      from: vi.fn(() => query),
    };
    query.select.mockReturnValue(query);
    query.gte.mockReturnValue(query);
    query.lte.mockReturnValue(query);
    query.order.mockResolvedValue({ data: [], error: null });
    supabaseMocks.createSupabaseServerClient.mockReturnValue(supabase);

    await getDashboardData("7d", new Date("2026-05-07T12:00:00.000Z"));

    expect(query.gte).toHaveBeenCalledWith("timestamp", "2026-04-30T12:00:00.000Z");
    expect(query.lte).toHaveBeenCalledWith("timestamp", "2026-05-07T12:00:00.000Z");
    expect(query.order).toHaveBeenCalledWith("timestamp", { ascending: false });
    expect(query).not.toHaveProperty("limit");
  });
});
