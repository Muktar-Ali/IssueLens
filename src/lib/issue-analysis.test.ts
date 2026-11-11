import { describe, expect, it, vi } from "vitest";
import { testIssueAnalysis } from "@/test-fixtures/issue-analysis";
import {
  generateIssueAnalysis,
  OpenAIAnalysisResponseError,
  type IssueAnalysisInput,
} from "./issue-analysis";

const issue: IssueAnalysisInput = {
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

describe("generateIssueAnalysis", () => {
  it("requests and returns a validated structured analysis", async () => {
    const parseResponse = vi.fn().mockResolvedValue({
      id: "resp_123",
      model: "test-model",
      status: "completed",
      output_parsed: testIssueAnalysis,
      incomplete_details: null,
      output: [],
    });

    const result = await generateIssueAnalysis(issue, {
      model: "test-model",
      parseResponse,
    });

    expect(result).toEqual({
      result: testIssueAnalysis,
      responseId: "resp_123",
      model: "test-model",
    });
    expect(parseResponse).toHaveBeenCalledOnce();

    const request = parseResponse.mock.calls[0][0];
    expect(request.store).toBe(false);
    expect(request.text.format.type).toBe("json_schema");
    expect(JSON.parse(request.input)).toMatchObject({
      repository: { owner: "example", name: "project" },
      issue: { number: 42, title: issue.issueTitle },
      availableDuplicateCandidates: [],
      availableRepositoryEvidence: [],
    });
  });

  it("rejects an incomplete response", async () => {
    const parseResponse = vi.fn().mockResolvedValue({
      id: "resp_incomplete",
      model: "test-model",
      status: "incomplete",
      output_parsed: null,
      incomplete_details: { reason: "max_output_tokens" },
      output: [],
    });

    await expect(
      generateIssueAnalysis(issue, { model: "test-model", parseResponse }),
    ).rejects.toThrow("max_output_tokens");
  });

  it("reports a model refusal instead of trying to parse it", async () => {
    const parseResponse = vi.fn().mockResolvedValue({
      id: "resp_refusal",
      model: "test-model",
      status: "completed",
      output_parsed: null,
      incomplete_details: null,
      output: [
        {
          type: "message",
          content: [{ type: "refusal", refusal: "I cannot analyze this content." }],
        },
      ],
    });

    await expect(
      generateIssueAnalysis(issue, { model: "test-model", parseResponse }),
    ).rejects.toThrow(OpenAIAnalysisResponseError);
  });
});
