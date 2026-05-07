import { describe, expect, it } from "vitest";
import { aggregateDashboardMetrics, type MetricRecord } from "@/lib/analytics/aggregations";
import { getRangeStart, parseDashboardRange } from "@/lib/analytics/ranges";

describe("parseDashboardRange", () => {
  it("returns a supported range and falls back to 30d", () => {
    expect(parseDashboardRange("7d")).toBe("7d");
    expect(parseDashboardRange(["quarter", "7d"])).toBe("quarter");
    expect(parseDashboardRange("invalid")).toBe("30d");
    expect(parseDashboardRange(undefined)).toBe("30d");
  });
});

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
        metric({
          repo_url: "https://github.com/acme/api",
          author: "loic@example.com",
          timestamp: "2026-05-06T12:00:00.000Z",
          human_additions: 50,
          ai_additions: 150,
        }),
        metric({
          repo_url: "https://github.com/acme/web",
          author: "mai@example.com",
          timestamp: "2026-04-01T12:00:00.000Z",
          human_additions: 100,
          ai_additions: 0,
        }),
      ],
      "7d",
      now,
    );

    expect(result.kpis).toEqual({
      aiAdditions: 150,
      humanAdditions: 50,
      totalAdditions: 200,
      aiShare: 0.75,
      estimatedHoursSaved: 3,
    });
  });

  it("builds trend, project, and leaderboard summaries", () => {
    const now = new Date("2026-05-07T12:00:00.000Z");
    const result = aggregateDashboardMetrics(
      [
        metric({
          repo_url: "https://github.com/acme/api",
          author: "loic@example.com",
          timestamp: "2026-05-06T12:00:00.000Z",
          human_additions: 50,
          ai_additions: 150,
        }),
        metric({
          repo_url: "https://github.com/acme/api",
          author: "mai@example.com",
          timestamp: "2026-05-05T12:00:00.000Z",
          human_additions: 80,
          ai_additions: 20,
        }),
        metric({
          repo_url: "https://github.com/acme/web",
          author: "loic@example.com",
          timestamp: "2026-05-04T12:00:00.000Z",
          human_additions: 40,
          ai_additions: 60,
        }),
      ],
      "30d",
      now,
    );

    expect(result.trend).toEqual([
      {
        date: "2026-05-04",
        aiShare: 0.6,
        humanShare: 0.4,
      },
      {
        date: "2026-05-05",
        aiShare: 0.2,
        humanShare: 0.8,
      },
      {
        date: "2026-05-06",
        aiShare: 0.75,
        humanShare: 0.25,
      },
    ]);
    expect(result.projects).toEqual([
      {
        repoUrl: "https://github.com/acme/api",
        totalAdditions: 300,
        aiAdditions: 170,
        humanAdditions: 130,
        aiShare: 170 / 300,
        activeAuthors: 2,
        lastActivity: "2026-05-06T12:00:00.000Z",
      },
      {
        repoUrl: "https://github.com/acme/web",
        totalAdditions: 100,
        aiAdditions: 60,
        humanAdditions: 40,
        aiShare: 0.6,
        activeAuthors: 1,
        lastActivity: "2026-05-04T12:00:00.000Z",
      },
    ]);
    expect(result.leaderboard).toEqual([
      {
        author: "loic@example.com",
        aiAdditions: 210,
        totalAdditions: 300,
        aiShare: 0.7,
        reposTouched: 2,
        estimatedHoursSaved: 4.2,
        isLowVolume: false,
      },
      {
        author: "mai@example.com",
        aiAdditions: 20,
        totalAdditions: 100,
        aiShare: 0.2,
        reposTouched: 1,
        estimatedHoursSaved: 0.4,
        isLowVolume: false,
      },
    ]);
  });

  it("sorts activity newest first, limits it to 30, and skips invalid timestamps", () => {
    const now = new Date("2026-05-31T12:00:00.000Z");
    const records = Array.from({ length: 31 }, (_, index) =>
      metric({
        repo_url: "https://github.com/acme/api",
        author: "loic@example.com",
        timestamp: `2026-05-${String(index + 1).padStart(2, "0")}T12:00:00.000Z`,
        human_additions: 1,
        ai_additions: 1,
      }),
    );

    const result = aggregateDashboardMetrics(
      [
        ...records,
        {
          ...metric({
            repo_url: "https://github.com/acme/api",
            author: "loic@example.com",
            timestamp: "2026-05-07T13:00:00.000Z",
            human_additions: 100,
            ai_additions: 100,
          }),
          timestamp: "not-a-date",
        },
      ],
      "quarter",
      now,
    );

    expect(result.activity).toHaveLength(30);
    expect(result.activity[0]?.timestamp).toBe("2026-05-31T12:00:00.000Z");
    expect(result.activity.at(-1)?.timestamp).toBe("2026-05-02T12:00:00.000Z");
    expect(result.kpis.totalAdditions).toBe(62);
  });

  it("excludes records after now", () => {
    const result = aggregateDashboardMetrics(
      [
        metric({
          repo_url: "https://github.com/acme/api",
          author: "loic@example.com",
          timestamp: "2026-05-07T12:00:00.000Z",
          human_additions: 10,
          ai_additions: 40,
        }),
        metric({
          repo_url: "https://github.com/acme/api",
          author: "loic@example.com",
          timestamp: "2026-05-07T12:00:00.001Z",
          human_additions: 100,
          ai_additions: 400,
        }),
      ],
      "7d",
      new Date("2026-05-07T12:00:00.000Z"),
    );

    expect(result.kpis.totalAdditions).toBe(50);
    expect(result.activity).toHaveLength(1);
    expect(result.activity[0]?.timestamp).toBe("2026-05-07T12:00:00.000Z");
  });

  it("excludes records with invalid addition counts", () => {
    const result = aggregateDashboardMetrics(
      [
        metric({
          repo_url: "https://github.com/acme/api",
          author: "loic@example.com",
          timestamp: "2026-05-07T12:00:00.000Z",
          human_additions: 10,
          ai_additions: 40,
        }),
        metric({
          repo_url: "https://github.com/acme/api",
          author: "nan@example.com",
          timestamp: "2026-05-07T11:00:00.000Z",
          human_additions: 10,
          ai_additions: Number.NaN,
        }),
        metric({
          repo_url: "https://github.com/acme/api",
          author: "infinity@example.com",
          timestamp: "2026-05-07T10:00:00.000Z",
          human_additions: Infinity,
          ai_additions: 10,
        }),
        metric({
          repo_url: "https://github.com/acme/api",
          author: "negative@example.com",
          timestamp: "2026-05-07T09:00:00.000Z",
          human_additions: 10,
          ai_additions: -1,
        }),
      ],
      "7d",
      new Date("2026-05-07T12:00:00.000Z"),
    );

    expect(result.kpis).toMatchObject({
      aiAdditions: 40,
      humanAdditions: 10,
      totalAdditions: 50,
      aiShare: 0.8,
    });
    expect(result.leaderboard).toHaveLength(1);
    expect(result.leaderboard[0]?.author).toBe("loic@example.com");
  });

  it("sorts project ties by last activity descending and repo URL ascending", () => {
    const result = aggregateDashboardMetrics(
      [
        metric({
          repo_url: "https://github.com/acme/old",
          author: "loic@example.com",
          timestamp: "2026-05-05T12:00:00.000Z",
          human_additions: 50,
          ai_additions: 50,
        }),
        metric({
          repo_url: "https://github.com/acme/recent",
          author: "loic@example.com",
          timestamp: "2026-05-06T12:00:00.000Z",
          human_additions: 50,
          ai_additions: 50,
        }),
        metric({
          repo_url: "https://github.com/acme/zeta",
          author: "loic@example.com",
          timestamp: "2026-05-04T12:00:00.000Z",
          human_additions: 50,
          ai_additions: 50,
        }),
        metric({
          repo_url: "https://github.com/acme/alpha",
          author: "loic@example.com",
          timestamp: "2026-05-04T12:00:00.000Z",
          human_additions: 50,
          ai_additions: 50,
        }),
      ],
      "7d",
      new Date("2026-05-07T12:00:00.000Z"),
    );

    expect(result.projects.map((project) => project.repoUrl)).toEqual([
      "https://github.com/acme/recent",
      "https://github.com/acme/old",
      "https://github.com/acme/alpha",
      "https://github.com/acme/zeta",
    ]);
  });

  it("sorts leaderboard ties by total additions descending and author ascending", () => {
    const result = aggregateDashboardMetrics(
      [
        metric({
          repo_url: "https://github.com/acme/api",
          author: "zoe@example.com",
          timestamp: "2026-05-06T12:00:00.000Z",
          human_additions: 10,
          ai_additions: 50,
        }),
        metric({
          repo_url: "https://github.com/acme/api",
          author: "mai@example.com",
          timestamp: "2026-05-06T12:00:00.000Z",
          human_additions: 100,
          ai_additions: 50,
        }),
        metric({
          repo_url: "https://github.com/acme/api",
          author: "zara@example.com",
          timestamp: "2026-05-06T12:00:00.000Z",
          human_additions: 10,
          ai_additions: 40,
        }),
        metric({
          repo_url: "https://github.com/acme/api",
          author: "anna@example.com",
          timestamp: "2026-05-06T12:00:00.000Z",
          human_additions: 10,
          ai_additions: 40,
        }),
      ],
      "7d",
      new Date("2026-05-07T12:00:00.000Z"),
    );

    expect(result.leaderboard.map((person) => person.author)).toEqual([
      "mai@example.com",
      "zoe@example.com",
      "anna@example.com",
      "zara@example.com",
    ]);
  });

  it("returns zero shares when totals are zero", () => {
    const result = aggregateDashboardMetrics(
      [
        metric({
          repo_url: "https://github.com/acme/api",
          author: "loic@example.com",
          timestamp: "2026-05-06T12:00:00.000Z",
          human_additions: 0,
          ai_additions: 0,
        }),
      ],
      "7d",
      new Date("2026-05-07T12:00:00.000Z"),
    );

    expect(result.kpis.aiShare).toBe(0);
    expect(result.trend[0]?.aiShare).toBe(0);
    expect(result.trend[0]?.humanShare).toBe(0);
    expect(result.projects[0]?.aiShare).toBe(0);
    expect(result.leaderboard[0]?.aiShare).toBe(0);
    expect(result.leaderboard[0]?.isLowVolume).toBe(true);
  });
});

function metric(record: Omit<MetricRecord, "total_additions" | "ai_ratio">): MetricRecord {
  const totalAdditions = record.human_additions + record.ai_additions;

  return {
    ...record,
    total_additions: totalAdditions,
    ai_ratio: totalAdditions === 0 ? 0 : record.ai_additions / totalAdditions,
  };
}
