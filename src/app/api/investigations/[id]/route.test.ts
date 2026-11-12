import { describe, expect, it, vi } from "vitest";
import type { SavedInvestigationDetail } from "@/lib/investigation-history";
import { testIssueAnalysis } from "@/test-fixtures/issue-analysis";
import { handleGetInvestigation } from "./handler";

const investigationId = "36d3ae7d-d3a6-43f6-9006-b482823f67fd";

const savedInvestigation: SavedInvestigationDetail = {
  id: investigationId,
  status: "completed",
  repository: { owner: "example", name: "project" },
  issue: {
    number: 42,
    title: "Example bug",
    url: "https://github.com/example/project/issues/42",
    state: "open",
    author: "reporter",
    labels: ["bug"],
    updatedAt: "2026-11-03T15:00:00.000Z",
  },
  result: testIssueAnalysis,
  model: "gpt-5.4-mini-test",
  createdAt: "2026-11-03T15:01:00.000Z",
  completedAt: "2026-11-03T15:02:00.000Z",
};

describe("GET /api/investigations/:id", () => {
  it("returns a completed saved investigation", async () => {
    const getInvestigation = vi.fn().mockResolvedValue(savedInvestigation);

    const response = await handleGetInvestigation(investigationId, getInvestigation);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ investigation: savedInvestigation });
    expect(getInvestigation).toHaveBeenCalledWith(investigationId);
  });

  it("rejects a malformed investigation ID", async () => {
    const getInvestigation = vi.fn();

    const response = await handleGetInvestigation("not-a-uuid", getInvestigation);

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("INVALID_INVESTIGATION_ID");
    expect(getInvestigation).not.toHaveBeenCalled();
  });

  it("returns 404 when no completed investigation exists", async () => {
    const response = await handleGetInvestigation(
      investigationId,
      vi.fn().mockResolvedValue(null),
    );

    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("INVESTIGATION_NOT_FOUND");
  });
});
