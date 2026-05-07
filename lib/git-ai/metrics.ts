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
  unsupported: number;
};

type MetricsUploadRow = {
  metrics?: unknown[];
  attrs?: unknown[];
  timestamp?: unknown;
  v?: unknown[] | Record<string, unknown>;
  a?: unknown[] | Record<string, unknown>;
  t?: unknown;
  e?: unknown;
};

const HUMAN_ADDITIONS_METRIC_INDEX = 0;
const AI_ADDITIONS_METRIC_INDEX = 1;
const COMMITTED_EVENT_ID = 1;
const COMMITTED_AI_ADDITIONS_INDEX = 5;
const COMMITTED_TOTAL_AI_ADDITIONS_INDEX = 7;
const GIT_AI_AGGREGATE_ARRAY_INDEX = 0;
const REPO_URL_ATTR_INDEX = 1;
const AUTHOR_ATTR_INDEX = 2;

export function parseMetricsUpload(
  payload: unknown,
  receivedAt: Date = new Date(),
): MetricsParseResult {
  const uploadRows = getUploadRows(payload);
  const rows: MetricInsertRow[] = [];
  let rejected = 0;
  let unsupported = 0;

  for (const uploadRow of uploadRows) {
    const parsedRow = parseMetricsRow(uploadRow, receivedAt);

    if (parsedRow === "unsupported") {
      unsupported += 1;
      continue;
    }

    if (parsedRow === "invalid") {
      rejected += 1;
      continue;
    }

    rows.push(parsedRow);
  }

  return { rows, rejected, unsupported };
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

  if (Array.isArray(payload.events)) {
    return payload.events;
  }

  return [];
}

function parseMetricsRow(
  row: unknown,
  receivedAt: Date,
): MetricInsertRow | "invalid" | "unsupported" {
  if (!isMetricsUploadRow(row)) {
    return "invalid";
  }

  if (row.e !== undefined && row.e !== COMMITTED_EVENT_ID) {
    return "unsupported";
  }

  const values = row.metrics ?? row.v;
  const attrs = row.attrs ?? row.a;
  const humanAdditions = getPosition(values, HUMAN_ADDITIONS_METRIC_INDEX);
  const aiAdditions = getAiAdditions(values, Array.isArray(row.metrics));
  const repoUrl = getPosition(attrs, REPO_URL_ATTR_INDEX);
  const author = getPosition(attrs, AUTHOR_ATTR_INDEX);

  if (
    !isValidAddition(humanAdditions) ||
    !isValidAddition(aiAdditions) ||
    !isNonEmptyString(repoUrl) ||
    !isNonEmptyString(author)
  ) {
    return "invalid";
  }

  const timestamp = parseTimestamp(row.timestamp ?? row.t, receivedAt);

  if (timestamp === null) {
    return "invalid";
  }

  const totalAdditions = humanAdditions + aiAdditions;

  if (!Number.isSafeInteger(totalAdditions)) {
    return "invalid";
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
  if (!isRecord(value)) {
    return false;
  }

  const hasLegacyShape = Array.isArray(value.metrics) && Array.isArray(value.attrs);
  const hasGitAiShape =
    (Array.isArray(value.v) || isRecord(value.v)) && (Array.isArray(value.a) || isRecord(value.a));

  return hasLegacyShape || hasGitAiShape;
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

  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) {
    return new Date(value * 1000).toISOString();
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

function getPosition(source: unknown, index: number): unknown {
  if (Array.isArray(source)) {
    return source[index];
  }

  if (isRecord(source)) {
    return source[String(index)];
  }

  return undefined;
}

function getAiAdditions(values: unknown, isLegacyMetricsArray: boolean): unknown {
  if (isLegacyMetricsArray) {
    return getPosition(values, AI_ADDITIONS_METRIC_INDEX);
  }

  const totalAiAdditions = getPosition(values, COMMITTED_TOTAL_AI_ADDITIONS_INDEX);

  if (totalAiAdditions !== undefined) {
    return totalAiAdditions;
  }

  const aiAdditionsByTool = getPosition(values, COMMITTED_AI_ADDITIONS_INDEX);

  if (Array.isArray(aiAdditionsByTool)) {
    return aiAdditionsByTool[GIT_AI_AGGREGATE_ARRAY_INDEX];
  }

  return aiAdditionsByTool;
}
