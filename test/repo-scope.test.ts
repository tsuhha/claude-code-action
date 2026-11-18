import { describe, expect, it } from "bun:test";
import {
  assertAllowedCommentId,
  resolveRepoScope,
} from "../src/mcp/repo-scope";
import { prepareMcpConfig } from "../src/mcp/install-mcp-server";

const allowed = { owner: "acme", repo: "public-repo" };

describe("resolveRepoScope", () => {
  it("returns the configured repository when owner/repo match", () => {
    expect(
      resolveRepoScope({ owner: "acme", repo: "public-repo" }, allowed),
    ).toEqual(allowed);
  });

  it("matches owner/repo case-insensitively but returns configured values", () => {
    expect(
      resolveRepoScope({ owner: "ACME", repo: "Public-Repo" }, allowed),
    ).toEqual(allowed);
  });

  it("falls back to the configured repository when owner/repo are omitted", () => {
    expect(resolveRepoScope({}, allowed)).toEqual(allowed);
  });

  it("rejects a different owner", () => {
    expect(() =>
      resolveRepoScope({ owner: "mallory", repo: "public-repo" }, allowed),
    ).toThrow(/not allowed/);
  });

  it("rejects a different repository", () => {
    expect(() =>
      resolveRepoScope({ owner: "acme", repo: "private-repo" }, allowed),
    ).toThrow(/not allowed/);
  });

  it("rejects path traversal in owner/repo", () => {
    expect(() =>
      resolveRepoScope(
        { owner: "acme/private-repo/../..", repo: "x" },
        allowed,
      ),
    ).toThrow(/not allowed/);
    expect(() =>
      resolveRepoScope(
        { owner: "acme", repo: "public-repo/../private-repo" },
        allowed,
      ),
    ).toThrow(/not allowed/);
  });
});

describe("assertAllowedCommentId", () => {
  it("allows the tracking comment id", () => {
    expect(assertAllowedCommentId("12345", "12345")).toBe("12345");
    expect(assertAllowedCommentId(12345, "12345")).toBe("12345");
  });

  it("rejects other comment ids", () => {
    expect(() => assertAllowedCommentId("99999", "12345")).toThrow(
      /not allowed/,
    );
  });

  it("rejects non-numeric comment ids", () => {
    expect(() => assertAllowedCommentId("12345/../1", "12345")).toThrow(
      /not allowed/,
    );
  });

  it("rejects all updates when no tracking comment is configured", () => {
    expect(() => assertAllowedCommentId("12345", undefined)).toThrow(
      /not allowed/,
    );
    expect(() => assertAllowedCommentId("12345", "")).toThrow(/not allowed/);
  });
});

describe("prepareMcpConfig", () => {
  it("passes the repository and tracking comment id to the MCP server", async () => {
    const config = JSON.parse(
      await prepareMcpConfig("token", "acme", "public-repo", "main", "12345"),
    );
    const env = config.mcpServers.github_file_ops.env;
    expect(env.REPO_OWNER).toBe("acme");
    expect(env.REPO_NAME).toBe("public-repo");
    expect(env.CLAUDE_COMMENT_ID).toBe("12345");
  });
});
