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

type MetricsUploadRow = {
  metrics: unknown[];
  attrs: unknown[];
  timestamp?: unknown;
};

const HUMAN_ADDITIONS_METRIC_INDEX = 0;
const AI_ADDITIONS_METRIC_INDEX = 1;
const REPO_URL_ATTR_INDEX = 1;
const AUTHOR_ATTR_INDEX = 2;

export function parseMetricsUpload(
  payload: unknown,
  receivedAt: Date = new Date(),
): MetricsParseResult {
  const uploadRows = getUploadRows(payload);
  const rows: MetricInsertRow[] = [];
  let rejected = 0;

  for (const uploadRow of uploadRows) {
    const parsedRow = parseMetricsRow(uploadRow, receivedAt);

    if (parsedRow === null) {
      rejected += 1;
      continue;
    }

    rows.push(parsedRow);
  }

  return { rows, rejected };
}

function getUploadRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return [];
  }

  if (Array.isArray(payload.rows)) {
    return payload.rows;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
}

function parseMetricsRow(row: unknown, receivedAt: Date): MetricInsertRow | null {
  if (!isMetricsUploadRow(row)) {
    return null;
  }

  const humanAdditions = row.metrics[HUMAN_ADDITIONS_METRIC_INDEX];
  const aiAdditions = row.metrics[AI_ADDITIONS_METRIC_INDEX];
  const repoUrl = row.attrs[REPO_URL_ATTR_INDEX];
  const author = row.attrs[AUTHOR_ATTR_INDEX];

  if (
    !isValidAddition(humanAdditions) ||
    !isValidAddition(aiAdditions) ||
    !isNonEmptyString(repoUrl) ||
    !isNonEmptyString(author)
  ) {
    return null;
  }

  const timestamp = parseTimestamp(row.timestamp, receivedAt);

  if (timestamp === null) {
    return null;
  }

  const totalAdditions = humanAdditions + aiAdditions;

  if (!Number.isSafeInteger(totalAdditions)) {
    return null;
  }

  return {
    repo_url: repoUrl,
    author,
    timestamp,
    human_additions: humanAdditions,
    ai_additions: aiAdditions,
    total_additions: totalAdditions,
    ai_ratio: totalAdditions === 0 ? 0 : aiAdditions / totalAdditions,
    raw_payload: row,
  };
}

function isMetricsUploadRow(value: unknown): value is MetricsUploadRow {
  return isRecord(value) && Array.isArray(value.metrics) && Array.isArray(value.attrs);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidAddition(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseTimestamp(value: unknown, receivedAt: Date): string | null {
  if (value === undefined) {
    return receivedAt.toISOString();
  }

  if (!isNonEmptyString(value)) {
    return null;
  }

  const parsedTimestamp = new Date(value);

  if (Number.isNaN(parsedTimestamp.getTime())) {
    return null;
  }

  return value;
}
