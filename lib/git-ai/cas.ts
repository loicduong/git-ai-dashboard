export type JsonValue = null | string | number | boolean | JsonValue[] | { [key: string]: JsonValue };

export type CasUpsertRow = {
  hash: string;
  content: JsonValue;
  metadata: Record<string, unknown>;
  repo_url: string | null;
  author: string | null;
};

export type CasParseResult = {
  rows: CasUpsertRow[];
  rejected: number;
};

type CasUploadObject = Record<string, unknown> & {
  hash?: unknown;
  content?: unknown;
  metadata?: unknown;
  repo_url?: unknown;
  author?: unknown;
};

export function parseCasUpload(payload: unknown): CasParseResult {
  const uploadObjects = getUploadObjects(payload);
  const rows: CasUpsertRow[] = [];
  let rejected = 0;

  for (const uploadObject of uploadObjects) {
    const parsedObject = parseCasObject(uploadObject, payload);

    if (parsedObject === null) {
      rejected += 1;
      continue;
    }

    rows.push(parsedObject);
  }

  return { rows, rejected };
}

function getUploadObjects(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return [];
  }

  if (Array.isArray(payload.objects)) {
    return payload.objects;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
}

function parseCasObject(value: unknown, payload: unknown): CasUpsertRow | null {
  if (!isRecord(value) || !hasOwn(value, "content")) {
    return null;
  }

  const uploadObject = value as CasUploadObject;
  const hash = parseNonEmptyString(uploadObject.hash);

  if (hash === null || !isJsonValue(uploadObject.content)) {
    return null;
  }

  const metadata = parseMetadata(uploadObject.metadata);

  if (metadata === null) {
    return null;
  }

  const topLevelMetadata = isRecord(payload) ? payload : {};

  return {
    hash,
    content: uploadObject.content,
    metadata,
    repo_url: resolveMetadataString(metadata, uploadObject, topLevelMetadata, "repo_url"),
    author: resolveMetadataString(metadata, uploadObject, topLevelMetadata, "author"),
  };
}

function parseMetadata(value: unknown): Record<string, unknown> | null {
  if (value === undefined || !isRecord(value)) {
    return {};
  }

  if (!isPlainRecord(value)) {
    return {};
  }

  return isJsonValue(value) ? value : null;
}

function resolveMetadataString(
  metadata: Record<string, unknown>,
  uploadObject: CasUploadObject,
  topLevelMetadata: Record<string, unknown>,
  key: "repo_url" | "author",
): string | null {
  return (
    parseNonEmptyString(metadata[key]) ??
    parseNonEmptyString(uploadObject[key]) ??
    parseNonEmptyString(topLevelMetadata[key])
  );
}

function isJsonValue(value: unknown): value is JsonValue {
  if (value === null) {
    return true;
  }

  if (typeof value === "string" || typeof value === "boolean") {
    return true;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  if (isPlainRecord(value)) {
    return Object.values(value).every(isJsonValue);
  }

  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function parseNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}
