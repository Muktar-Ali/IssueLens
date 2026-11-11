import { describe, expect, it, vi } from "vitest";
import { testIssueAnalysis } from "@/test-fixtures/issue-analysis";
import {
  InvestigationAnalysisFailedError,
  InvestigationNotFoundError,
  InvestigationNotQueuedError,
} from "@/lib/investigation-analysis";
import { handleAnalyzeInvestigation } from "./handler";

const id = "36d3ae7d-d3a6-43f6-9006-b482823f67fd";
const completed = {
  investigationId: id,
  status: "completed" as const,
  result: testIssueAnalysis,
  responseId: "resp_123",
  model: "test-model",
};

describe("POST /api/investigations/[id]/analyze", () => {
  it("returns a completed analysis", async () => {
    const response = await handleAnalyzeInvestigation(id, vi.fn().mockResolvedValue(completed));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ investigation: completed });
  });

  it("rejects invalid UUIDs before analysis starts", async () => {
    const analyze = vi.fn();
    const response = await handleAnalyzeInvestigation("not-a-uuid", analyze);

    expect(response.status).toBe(400);
    expect(analyze).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown investigation", async () => {
    const analyze = vi.fn().mockRejectedValue(new InvestigationNotFoundError());
    const response = await handleAnalyzeInvestigation(id, analyze);

    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("INVESTIGATION_NOT_FOUND");
  });

  it("returns 409 when the investigation is not queued", async () => {
    const analyze = vi.fn().mockRejectedValue(new InvestigationNotQueuedError("completed"));
    const response = await handleAnalyzeInvestigation(id, analyze);

    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe("INVESTIGATION_NOT_QUEUED");
  });

  it("returns 502 after an analysis execution failure", async () => {
    const analyze = vi.fn().mockRejectedValue(new InvestigationAnalysisFailedError());
    const response = await handleAnalyzeInvestigation(id, analyze);

    expect(response.status).toBe(502);
    expect((await response.json()).error.code).toBe("ANALYSIS_FAILED");
  });
});
