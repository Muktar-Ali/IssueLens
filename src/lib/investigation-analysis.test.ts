import { describe, expect, it, vi } from "vitest";
import { testIssueAnalysis } from "@/test-fixtures/issue-analysis";
import {
  analyzeInvestigation,
  InvestigationAnalysisFailedError,
  InvestigationNotFoundError,
} from "./investigation-analysis";

const investigation = {
  id: "36d3ae7d-d3a6-43f6-9006-b482823f67fd",
  repositoryOwner: "example",
  repositoryName: "project",
  issueNumber: 42,
  issueTitle: "Crash with empty configuration",
  issueBody: "It crashes immediately with an empty config.",
  issueUrl: "https://github.com/example/project/issues/42",
  issueState: "open",
  issueAuthor: "reporter",
  issueLabels: ["bug"],
};

const generated = {
  result: testIssueAnalysis,
  responseId: "resp_123",
  model: "test-model",
};

describe("analyzeInvestigation", () => {
  it("claims, analyzes, and completes an investigation", async () => {
    const claimInvestigation = vi.fn().mockResolvedValue(investigation);
    const generateAnalysis = vi.fn().mockResolvedValue(generated);
    const completeInvestigation = vi.fn().mockResolvedValue(undefined);
    const failInvestigation = vi.fn();

    const result = await analyzeInvestigation(investigation.id, {
      claimInvestigation,
      generateAnalysis,
      completeInvestigation,
      failInvestigation,
    });

    expect(generateAnalysis).toHaveBeenCalledWith(investigation);
    expect(completeInvestigation).toHaveBeenCalledWith(investigation.id, generated);
    expect(failInvestigation).not.toHaveBeenCalled();
    expect(result).toEqual({
      investigationId: investigation.id,
      status: "completed",
      ...generated,
    });
  });

  it("marks a running investigation failed when analysis throws", async () => {
    const error = new Error("OpenAI unavailable");
    const failInvestigation = vi.fn().mockResolvedValue(undefined);

    await expect(
      analyzeInvestigation(investigation.id, {
        claimInvestigation: vi.fn().mockResolvedValue(investigation),
        generateAnalysis: vi.fn().mockRejectedValue(error),
        completeInvestigation: vi.fn(),
        failInvestigation,
      }),
    ).rejects.toThrow(InvestigationAnalysisFailedError);

    expect(failInvestigation).toHaveBeenCalledWith(investigation.id, "OpenAI unavailable");
  });

  it("does not mark anything failed when the investigation cannot be claimed", async () => {
    const failInvestigation = vi.fn();

    await expect(
      analyzeInvestigation(investigation.id, {
        claimInvestigation: vi.fn().mockRejectedValue(new InvestigationNotFoundError()),
        generateAnalysis: vi.fn(),
        completeInvestigation: vi.fn(),
        failInvestigation,
      }),
    ).rejects.toThrow(InvestigationNotFoundError);

    expect(failInvestigation).not.toHaveBeenCalled();
  });
});
