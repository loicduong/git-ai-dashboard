import { describe, expect, it } from "vitest";

import { shortRepoName } from "@/lib/format";

describe("shortRepoName", () => {
  it("shortens https repo URLs", () => {
    expect(shortRepoName("https://github.com/acme/platform.git")).toBe("acme/platform");
  });

  it("shortens SSH SCP-style repo remotes", () => {
    expect(shortRepoName(" git@github.com:acme/platform.git ")).toBe("acme/platform");
  });
});
