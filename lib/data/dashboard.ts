import "server-only";

import {
  aggregateDashboardMetrics,
  type DashboardAggregation,
  type MetricRecord,
} from "@/lib/analytics/aggregations";
import { getRangeStart, type DashboardRange } from "@/lib/analytics/ranges";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const METRICS_PAGE_SIZE = 1000;

export async function getDashboardData(
  range: DashboardRange,
  now = new Date(),
): Promise<DashboardAggregation> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return aggregateDashboardMetrics(getSampleMetrics(range, now), range, now);
  }

  const supabase = createSupabaseServerClient();
  const records: MetricRecord[] = [];
  const rangeStart = getRangeStart(range, now).toISOString();
  const rangeEnd = now.toISOString();
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("metrics")
      .select(
        "repo_url, author, timestamp, human_additions, ai_additions, total_additions, ai_ratio",
      )
      .gte("timestamp", rangeStart)
      .lte("timestamp", rangeEnd)
      .order("timestamp", { ascending: false })
      .range(offset, offset + METRICS_PAGE_SIZE - 1);

    if (error) {
      throw new Error(error.message);
    }

    const page = (data ?? []) as MetricRecord[];
    records.push(...page);

    if (page.length < METRICS_PAGE_SIZE) {
      break;
    }

    offset += METRICS_PAGE_SIZE;
  }

  return aggregateDashboardMetrics(records, range, now);
}

function getSampleMetrics(range: DashboardRange, now: Date): MetricRecord[] {
  const rangeStart = getRangeStart(range, now);

  return [
    sampleMetric({
      repo_url: "https://github.com/acme/platform.git",
      author: "loic@example.com",
      timestamp: sampleTimestamp(rangeStart, now, 0, 6),
      human_additions: 180,
      ai_additions: 420,
    }),
    sampleMetric({
      repo_url: "https://github.com/acme/api.git",
      author: "mai@example.com",
      timestamp: sampleTimestamp(rangeStart, now, 1, 6),
      human_additions: 240,
      ai_additions: 360,
    }),
    sampleMetric({
      repo_url: "https://github.com/acme/mobile.git",
      author: "nina@example.com",
      timestamp: sampleTimestamp(rangeStart, now, 2, 6),
      human_additions: 160,
      ai_additions: 190,
    }),
    sampleMetric({
      repo_url: "https://github.com/acme/platform.git",
      author: "mai@example.com",
      timestamp: sampleTimestamp(rangeStart, now, 3, 6),
      human_additions: 110,
      ai_additions: 270,
    }),
    sampleMetric({
      repo_url: "https://github.com/acme/api.git",
      author: "loic@example.com",
      timestamp: sampleTimestamp(rangeStart, now, 4, 6),
      human_additions: 95,
      ai_additions: 140,
    }),
    sampleMetric({
      repo_url: "https://github.com/acme/mobile.git",
      author: "sam@example.com",
      timestamp: sampleTimestamp(rangeStart, now, 5, 6),
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

function sampleTimestamp(rangeStart: Date, now: Date, index: number, count: number): string {
  const rangeDuration = Math.max(now.getTime() - rangeStart.getTime(), 0);
  const offset = count <= 1 ? 0 : Math.floor((rangeDuration * index) / (count - 1));

  return new Date(now.getTime() - offset).toISOString();
}
