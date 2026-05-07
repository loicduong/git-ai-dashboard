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
          timestamp: "2026-05-06T12:30:00.000Z",
        },
      ],
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
        raw_payload: payload.rows[0],
      },
    ]);
  });

  it("falls back to server receive time when timestamp is missing", () => {
    const receivedAt = new Date("2026-05-07T10:00:00.000Z");
    const payload = {
      rows: [
        {
          metrics: [0, 20],
          attrs: ["main", "https://github.com/acme/web", "mai@example.com"],
        },
      ],
    };

    const result = parseMetricsUpload(payload, receivedAt);

    expect(result.rows[0]?.timestamp).toBe("2026-05-07T10:00:00.000Z");
  });

  it("returns ai ratio zero when total additions are zero", () => {
    const payload = {
      rows: [
        {
          metrics: [0, 0],
          attrs: ["main", "https://github.com/acme/api", "loic@example.com"],
        },
      ],
    };

    const result = parseMetricsUpload(payload, new Date("2026-05-07T10:00:00.000Z"));

    expect(result.rows[0]?.ai_ratio).toBe(0);
  });

  it("rejects malformed rows inside an otherwise valid upload", () => {
    const payload = {
      rows: [
        {
          metrics: [10, 5],
          attrs: ["main", "https://github.com/acme/api", "loic@example.com"],
        },
        {
          metrics: [1, 2],
          attrs: ["main", "", ""],
        },
      ],
    };

    const result = parseMetricsUpload(payload, new Date("2026-05-07T10:00:00.000Z"));

    expect(result.rows).toHaveLength(1);
    expect(result.rejected).toBe(1);
  });

  it("rejects rows with non-db-compatible additions", () => {
    const payload = {
      rows: [
        {
          metrics: [-1, 5],
          attrs: ["main", "https://github.com/acme/api", "loic@example.com"],
        },
        {
          metrics: [1.5, 5],
          attrs: ["main", "https://github.com/acme/api", "loic@example.com"],
        },
        {
          metrics: [10, Infinity],
          attrs: ["main", "https://github.com/acme/api", "loic@example.com"],
        },
        {
          metrics: [10, Number.NaN],
          attrs: ["main", "https://github.com/acme/api", "loic@example.com"],
        },
      ],
    };

    const result = parseMetricsUpload(payload, new Date("2026-05-07T10:00:00.000Z"));

    expect(result.rows).toHaveLength(0);
    expect(result.rejected).toBe(4);
  });

  it("rejects rows with invalid supplied timestamps", () => {
    const payload = {
      rows: [
        {
          metrics: [10, 5],
          attrs: ["main", "https://github.com/acme/api", "loic@example.com"],
          timestamp: "not-a-date",
        },
      ],
    };

    const result = parseMetricsUpload(payload, new Date("2026-05-07T10:00:00.000Z"));

    expect(result.rows).toHaveLength(0);
    expect(result.rejected).toBe(1);
  });

  it("rejects rows where individually safe additions produce an unsafe total", () => {
    const payload = {
      rows: [
        {
          metrics: [Number.MAX_SAFE_INTEGER, 1],
          attrs: ["main", "https://github.com/acme/api", "loic@example.com"],
        },
      ],
    };

    const result = parseMetricsUpload(payload, new Date("2026-05-07T10:00:00.000Z"));

    expect(result.rows).toHaveLength(0);
    expect(result.rejected).toBe(1);
  });
});
