import "server-only";

import {
  aggregateDashboardMetrics,
  type DashboardAggregation,
  type MetricRecord,
} from "@/lib/analytics/aggregations";
import { type DashboardRange } from "@/lib/analytics/ranges";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export async function getDashboardData(
  range: DashboardRange,
  now = new Date(),
): Promise<DashboardAggregation> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return aggregateDashboardMetrics(getSampleMetrics(now), range, now);
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("metrics")
    .select(
      "repo_url, author, timestamp, human_additions, ai_additions, total_additions, ai_ratio",
    )
    .order("timestamp", { ascending: false })
    .limit(1000);

  if (error) {
    throw new Error(error.message);
  }

  return aggregateDashboardMetrics((data ?? []) as MetricRecord[], range, now);
}

function getSampleMetrics(now: Date): MetricRecord[] {
  return [
    sampleMetric({
      repo_url: "https://github.com/acme/platform.git",
      author: "loic@example.com",
      timestamp: daysAgo(now, 1),
      human_additions: 180,
      ai_additions: 420,
    }),
    sampleMetric({
      repo_url: "https://github.com/acme/api.git",
      author: "mai@example.com",
      timestamp: daysAgo(now, 2),
      human_additions: 240,
      ai_additions: 360,
    }),
    sampleMetric({
      repo_url: "https://github.com/acme/mobile.git",
      author: "nina@example.com",
      timestamp: daysAgo(now, 3),
      human_additions: 160,
      ai_additions: 190,
    }),
    sampleMetric({
      repo_url: "https://github.com/acme/platform.git",
      author: "mai@example.com",
      timestamp: daysAgo(now, 4),
      human_additions: 110,
      ai_additions: 270,
    }),
    sampleMetric({
      repo_url: "https://github.com/acme/api.git",
      author: "loic@example.com",
      timestamp: daysAgo(now, 5),
      human_additions: 95,
      ai_additions: 140,
    }),
    sampleMetric({
      repo_url: "https://github.com/acme/mobile.git",
      author: "sam@example.com",
      timestamp: daysAgo(now, 6),
      human_additions: 130,
      ai_additions: 85,
    }),
  ];
}

function sampleMetric(record: Omit<MetricRecord, "total_additions" | "ai_ratio">): MetricRecord {
  const totalAdditions = record.human_additions + record.ai_additions;

  return {
    ...record,
    total_additions: totalAdditions,
    ai_ratio: totalAdditions === 0 ? 0 : record.ai_additions / totalAdditions,
  };
}

function daysAgo(now: Date, days: number): string {
  return new Date(now.getTime() - days * DAY_IN_MS).toISOString();
}
