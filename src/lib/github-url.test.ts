import { describe, expect, it } from "vitest";
import { parseGitHubIssueUrl } from "./github-url";

describe("parseGitHubIssueUrl", () => {
  it("parses a standard issue URL", () => {
    expect(parseGitHubIssueUrl("https://github.com/openai/openai-node/issues/123")).toEqual({
      owner: "openai",
      repository: "openai-node",
      issueNumber: 123,
    });
  });

  it("rejects pull requests and non-GitHub URLs", () => {
    expect(parseGitHubIssueUrl("https://github.com/openai/openai-node/pull/123")).toBeNull();
    expect(parseGitHubIssueUrl("https://example.com/openai/openai-node/issues/123")).toBeNull();
  });

  it("rejects encoded repository names that could alter a GitHub search query", () => {
    expect(
      parseGitHubIssueUrl("https://github.com/openai/openai-node%20is:pr/issues/123"),
    ).toBeNull();
  });
});
