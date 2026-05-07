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
  now: Date,
): DashboardAggregation {
  const rangeStart = getRangeStart(range, now);
  const scopedRecords = records
    .filter((record) => {
      const timestamp = new Date(record.timestamp).getTime();

      return !Number.isNaN(timestamp) && timestamp >= rangeStart.getTime();
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const aiAdditions = sum(scopedRecords, "ai_additions");
  const humanAdditions = sum(scopedRecords, "human_additions");
  const totalAdditions = aiAdditions + humanAdditions;

  return {
    kpis: {
      aiAdditions,
      humanAdditions,
      totalAdditions,
      aiShare: ratio(aiAdditions, totalAdditions),
      estimatedHoursSaved: aiAdditions / 50,
    },
    trend: buildTrend(scopedRecords),
    projects: buildProjects(scopedRecords),
    leaderboard: buildLeaderboard(scopedRecords),
    activity: scopedRecords.slice(0, 30),
  };
}

function buildTrend(records: MetricRecord[]): DashboardAggregation["trend"] {
  const byDate = new Map<string, { aiAdditions: number; humanAdditions: number }>();

  for (const record of records) {
    const date = record.timestamp.slice(0, 10);
    const current = byDate.get(date) ?? { aiAdditions: 0, humanAdditions: 0 };
    current.aiAdditions += record.ai_additions;
    current.humanAdditions += record.human_additions;
    byDate.set(date, current);
  }

  return Array.from(byDate.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, value]) => {
      const totalAdditions = value.aiAdditions + value.humanAdditions;

      return {
        date,
        aiShare: ratio(value.aiAdditions, totalAdditions),
        humanShare: ratio(value.humanAdditions, totalAdditions),
      };
    });
}

function buildProjects(records: MetricRecord[]): DashboardAggregation["projects"] {
  const byRepo = new Map<
    string,
    {
      aiAdditions: number;
      humanAdditions: number;
      authors: Set<string>;
      lastActivity: string;
    }
  >();

  for (const record of records) {
    const current = byRepo.get(record.repo_url) ?? {
      aiAdditions: 0,
      humanAdditions: 0,
      authors: new Set<string>(),
      lastActivity: record.timestamp,
    };
    current.aiAdditions += record.ai_additions;
    current.humanAdditions += record.human_additions;
    current.authors.add(record.author);

    if (new Date(record.timestamp).getTime() > new Date(current.lastActivity).getTime()) {
      current.lastActivity = record.timestamp;
    }

    byRepo.set(record.repo_url, current);
  }

  return Array.from(byRepo.entries())
    .map(([repoUrl, value]) => {
      const totalAdditions = value.aiAdditions + value.humanAdditions;

      return {
        repoUrl,
        totalAdditions,
        aiAdditions: value.aiAdditions,
        humanAdditions: value.humanAdditions,
        aiShare: ratio(value.aiAdditions, totalAdditions),
        activeAuthors: value.authors.size,
        lastActivity: value.lastActivity,
      };
    })
    .sort((a, b) => b.totalAdditions - a.totalAdditions);
}

function buildLeaderboard(records: MetricRecord[]): DashboardAggregation["leaderboard"] {
  const byAuthor = new Map<
    string,
    {
      aiAdditions: number;
      humanAdditions: number;
      repos: Set<string>;
    }
  >();

  for (const record of records) {
    const current = byAuthor.get(record.author) ?? {
      aiAdditions: 0,
      humanAdditions: 0,
      repos: new Set<string>(),
    };
    current.aiAdditions += record.ai_additions;
    current.humanAdditions += record.human_additions;
    current.repos.add(record.repo_url);
    byAuthor.set(record.author, current);
  }

  return Array.from(byAuthor.entries())
    .map(([author, value]) => {
      const totalAdditions = value.aiAdditions + value.humanAdditions;

      return {
        author,
        aiAdditions: value.aiAdditions,
        totalAdditions,
        aiShare: ratio(value.aiAdditions, totalAdditions),
        reposTouched: value.repos.size,
        estimatedHoursSaved: value.aiAdditions / 50,
        isLowVolume: totalAdditions < MIN_LEADERBOARD_VOLUME,
      };
    })
    .sort((a, b) => b.aiAdditions - a.aiAdditions);
}

function sum(records: MetricRecord[], key: "ai_additions" | "human_additions"): number {
  return records.reduce((total, record) => total + record[key], 0);
}

function ratio(part: number, total: number): number {
  return total === 0 ? 0 : part / total;
}
