import { describe, expect, it, vi } from "vitest";
import {
  createInvestigation,
  InvalidGitHubIssueUrlError,
} from "./investigations";

const issueSnapshot = {
  title: "The application crashes on startup",
  body: "Steps to reproduce...",
  url: "https://github.com/example/project/issues/42",
  state: "open",
  author: "reporter",
  labels: ["bug"],
  updatedAt: new Date("2026-11-03T15:00:00.000Z"),
};

describe("createInvestigation", () => {
  it("fetches the GitHub issue and saves a queued investigation", async () => {
    const fetchIssue = vi.fn().mockResolvedValue(issueSnapshot);
    const saveInvestigation = vi.fn().mockResolvedValue({
      id: "36d3ae7d-d3a6-43f6-9006-b482823f67fd",
      status: "queued" as const,
      createdAt: new Date("2026-11-03T15:01:00.000Z"),
    });

    const result = await createInvestigation(
      "https://github.com/example/project/issues/42",
      { fetchIssue, saveInvestigation },
    );

    expect(fetchIssue).toHaveBeenCalledWith({
      owner: "example",
      repository: "project",
      issueNumber: 42,
    });
    expect(saveInvestigation).toHaveBeenCalledWith(
      {
        owner: "example",
        repository: "project",
        issueNumber: 42,
      },
      issueSnapshot,
    );
    expect(result).toEqual({
      id: "36d3ae7d-d3a6-43f6-9006-b482823f67fd",
      status: "queued",
      repository: { owner: "example", name: "project" },
      issue: {
        number: 42,
        title: issueSnapshot.title,
        body: issueSnapshot.body,
        url: issueSnapshot.url,
        state: issueSnapshot.state,
        author: issueSnapshot.author,
        labels: issueSnapshot.labels,
        updatedAt: "2026-11-03T15:00:00.000Z",
      },
      createdAt: "2026-11-03T15:01:00.000Z",
    });
  });

  it("rejects invalid URLs before calling GitHub or PostgreSQL", async () => {
    const fetchIssue = vi.fn();
    const saveInvestigation = vi.fn();

    await expect(
      createInvestigation("https://example.com/not-an-issue", {
        fetchIssue,
        saveInvestigation,
      }),
    ).rejects.toBeInstanceOf(InvalidGitHubIssueUrlError);

    expect(fetchIssue).not.toHaveBeenCalled();
    expect(saveInvestigation).not.toHaveBeenCalled();
  });
});
