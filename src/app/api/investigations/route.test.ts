import { describe, expect, it, vi } from "vitest";
import { GitHubIssueFetchError } from "@/lib/github";
import {
  InvalidGitHubIssueUrlError,
  type CreateInvestigationResult,
} from "@/lib/investigations";
import { RepositoryPolicyError } from "@/lib/repository-policy";
import type { InvestigationHistoryItem } from "@/lib/investigation-history";
import { handleCreateInvestigation, handleListInvestigations } from "./handler";

const investigation: CreateInvestigationResult = {
  id: "36d3ae7d-d3a6-43f6-9006-b482823f67fd",
  status: "queued",
  repository: { owner: "example", name: "project" },
  issue: {
    number: 42,
    title: "Example bug",
    body: "Steps to reproduce...",
    url: "https://github.com/example/project/issues/42",
    state: "open",
    author: "reporter",
    labels: ["bug"],
    updatedAt: "2026-11-03T15:00:00.000Z",
  },
  createdAt: "2026-11-03T15:01:00.000Z",
};

function request(body: string) {
  return new Request("http://localhost/api/investigations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

describe("POST /api/investigations", () => {
  it("returns the saved investigation with a 201 status", async () => {
    const create = vi.fn().mockResolvedValue(investigation);

    const response = await handleCreateInvestigation(
      request(JSON.stringify({ issueUrl: investigation.issue.url })),
      create,
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ investigation });
    expect(create).toHaveBeenCalledWith(investigation.issue.url);
  });

  it("rejects malformed JSON", async () => {
    const response = await handleCreateInvestigation(request("{"), vi.fn());

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: "INVALID_JSON",
        message: "The request body must be valid JSON",
      },
    });
  });

  it("rejects missing or extra request fields", async () => {
    const response = await handleCreateInvestigation(
      request(JSON.stringify({ issueUrl: investigation.issue.url, unexpected: true })),
      vi.fn(),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("INVALID_REQUEST");
  });

  it("returns a clear error for a non-issue URL", async () => {
    const create = vi.fn().mockRejectedValue(new InvalidGitHubIssueUrlError());
    const response = await handleCreateInvestigation(
      request(JSON.stringify({ issueUrl: "https://example.com/not-an-issue" })),
      create,
    );

    expect(response.status).toBe(422);
    expect((await response.json()).error.code).toBe("INVALID_ISSUE_URL");
  });

  it("preserves safe GitHub fetch error statuses", async () => {
    const create = vi
      .fn()
      .mockRejectedValue(new GitHubIssueFetchError("The GitHub issue was not found", 404));
    const response = await handleCreateInvestigation(
      request(JSON.stringify({ issueUrl: investigation.issue.url })),
      create,
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: {
        code: "GITHUB_ISSUE_FETCH_FAILED",
        message: "The GitHub issue was not found",
      },
    });
  });

  it("rejects repositories outside the explicit public allowlist", async () => {
    const create = vi.fn().mockRejectedValue(
      new RepositoryPolicyError(
        "REPOSITORY_NOT_ALLOWED",
        "This repository is not explicitly approved for IssueLens analysis",
        403,
      ),
    );
    const response = await handleCreateInvestigation(
      request(JSON.stringify({ issueUrl: investigation.issue.url })),
      create,
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: {
        code: "REPOSITORY_NOT_ALLOWED",
        message: "This repository is not explicitly approved for IssueLens analysis",
      },
    });
  });
});

describe("GET /api/investigations", () => {
  it("returns completed investigation summaries", async () => {
    const history: InvestigationHistoryItem[] = [
      {
        id: investigation.id,
        repository: investigation.repository,
        issue: {
          number: investigation.issue.number,
          title: investigation.issue.title,
          url: investigation.issue.url,
        },
        classification: "bug",
        severity: "medium",
        model: "gpt-5.4-mini-test",
        completedAt: "2026-11-03T15:02:00.000Z",
      },
    ];
    const list = vi.fn().mockResolvedValue(history);

    const response = await handleListInvestigations(list);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ investigations: history });
    expect(list).toHaveBeenCalledOnce();
  });

  it("returns a safe error when history cannot be loaded", async () => {
    const response = await handleListInvestigations(
      vi.fn().mockRejectedValue(new Error("database details")),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "IssueLens could not load investigation history",
      },
    });
  });
});
