import { describe, expect, it } from "vitest";
import { parseCasUpload } from "@/lib/git-ai/cas";

describe("parseCasUpload", () => {
  it("maps payload.objects CAS objects to upsert rows", () => {
    const payload = {
      objects: [
        {
          hash: "  abc123  ",
          content: { path: "app/page.tsx", chunks: ["hello"] },
          metadata: {
            repo_url: " https://github.com/acme/dashboard ",
            author: " loic@example.com ",
            branch: "main",
          },
        },
      ],
    };

    const result = parseCasUpload(payload);

    expect(result.rejected).toBe(0);
    expect(result.rows).toEqual([
      {
        hash: "abc123",
        content: { path: "app/page.tsx", chunks: ["hello"] },
        metadata: {
          repo_url: " https://github.com/acme/dashboard ",
          author: " loic@example.com ",
          branch: "main",
        },
        repo_url: "https://github.com/acme/dashboard",
        author: "loic@example.com",
      },
    ]);
  });

  it("accepts top-level repo_url and author when object metadata lacks them", () => {
    const payload = {
      repo_url: " https://github.com/acme/api ",
      author: " mai@example.com ",
      objects: [
        {
          hash: "def456",
          content: "module source",
          metadata: { language: "ts" },
        },
        {
          hash: "ghi789",
          content: ["a", "b"],
          repo_url: " https://github.com/acme/worker ",
          author: " dev@example.com ",
        },
      ],
    };

    const result = parseCasUpload(payload);

    expect(result.rejected).toBe(0);
    expect(result.rows).toEqual([
      {
        hash: "def456",
        content: "module source",
        metadata: { language: "ts" },
        repo_url: "https://github.com/acme/api",
        author: "mai@example.com",
      },
      {
        hash: "ghi789",
        content: ["a", "b"],
        metadata: {},
        repo_url: "https://github.com/acme/worker",
        author: "dev@example.com",
      },
    ]);
  });

  it("rejects CAS objects without hash or JSON content while accepting valid ones", () => {
    const payload = {
      data: [
        {
          hash: "valid-null",
          content: null,
        },
        {
          hash: "",
          content: { path: "missing-hash.ts" },
        },
        {
          hash: "missing-content",
        },
        {
          hash: "function-content",
          content: () => "not json",
        },
        {
          hash: "symbol-content",
          content: Symbol("not json"),
        },
        {
          hash: "nested-undefined",
          content: { path: undefined },
        },
      ],
    };

    const result = parseCasUpload(payload);

    expect(result.rows).toEqual([
      {
        hash: "valid-null",
        content: null,
        metadata: {},
        repo_url: null,
        author: null,
      },
    ]);
    expect(result.rejected).toBe(5);
  });

  it("supports array uploads", () => {
    const result = parseCasUpload([
      {
        hash: "array-hash",
        content: { ok: true },
      },
    ]);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.hash).toBe("array-hash");
  });

  it("rejects CAS objects with non-JSON metadata while accepting valid ones", () => {
    const payload = {
      objects: [
        {
          hash: "valid-metadata",
          content: { ok: true },
          metadata: {
            repo_url: "https://github.com/acme/dashboard",
            labels: ["cas", null, 1],
          },
        },
        {
          hash: "bigint-metadata",
          content: { ok: true },
          metadata: { value: BigInt(1) },
        },
        {
          hash: "nested-undefined-metadata",
          content: { ok: true },
          metadata: { nested: undefined },
        },
        {
          hash: "nan-metadata",
          content: { ok: true },
          metadata: { score: Number.NaN },
        },
      ],
    };

    const result = parseCasUpload(payload);

    expect(result.rows).toEqual([
      {
        hash: "valid-metadata",
        content: { ok: true },
        metadata: {
          repo_url: "https://github.com/acme/dashboard",
          labels: ["cas", null, 1],
        },
        repo_url: "https://github.com/acme/dashboard",
        author: null,
      },
    ]);
    expect(result.rejected).toBe(3);
  });
});
