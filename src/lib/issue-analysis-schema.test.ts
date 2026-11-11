import { describe, expect, it } from "vitest";
import { issueAnalysisTextFormat } from "./issue-analysis-format";
import { issueAnalysisSchema } from "./issue-analysis-schema";

const validAnalysis = {
  summary: "The application crashes when an empty configuration file is loaded.",
  classification: {
    category: "bug",
    confidence: 0.96,
    rationale: "The report describes repeatable behavior that differs from the expected result.",
  },
  severity: {
    level: "medium",
    confidence: 0.72,
    rationale: "The crash blocks startup but a workaround may exist.",
  },
  missingInformation: [
    {
      category: "environment",
      status: "missing",
      explanation: "The operating system and runtime versions are not included.",
      followUpQuestion: "Which operating system and runtime versions reproduce the crash?",
    },
  ],
  suggestedLabels: ["bug", "needs-info"],
  duplicateCandidates: [],
  reproduction: {
    readiness: "partial",
    prerequisites: ["Create an empty configuration file."],
    steps: ["Start the application with the empty configuration file."],
    expectedBehavior: "The application should show a validation error.",
    actualBehavior: "The application exits unexpectedly.",
    notes: ["The reporter did not provide an exact application version."],
  },
  probableCauses: [
    {
      title: "Missing empty-file validation",
      explanation: "The loader may parse the file before checking that it contains data.",
      confidence: 0.58,
      evidenceIds: ["e1"],
    },
  ],
  evidence: [
    {
      id: "e1",
      source: "issue_body",
      reference: "issue body",
      excerpt: "It crashes immediately with an empty config.",
      supports: "The crash is associated with an empty configuration file.",
    },
  ],
  followUpQuestions: ["Which application version is affected?"],
  limitations: ["No logs, stack trace, or repository code were supplied."],
};

describe("issueAnalysisSchema", () => {
  it("accepts a complete evidence-based analysis", () => {
    expect(issueAnalysisSchema.parse(validAnalysis)).toEqual(validAnalysis);
  });

  it("rejects unspecified fields", () => {
    expect(
      issueAnalysisSchema.safeParse({
        ...validAnalysis,
        unverifiedFix: "Delete the configuration file",
      }).success,
    ).toBe(false);
  });

  it("rejects invalid categories and confidence values", () => {
    expect(
      issueAnalysisSchema.safeParse({
        ...validAnalysis,
        classification: {
          ...validAnalysis.classification,
          category: "definitely_a_bug",
          confidence: 1.5,
        },
      }).success,
    ).toBe(false);
  });

  it("requires nullable fields to be present even when their value is unknown", () => {
    const incomplete = structuredClone(validAnalysis) as Record<string, unknown>;
    const reproduction = incomplete.reproduction as Record<string, unknown>;
    delete reproduction.expectedBehavior;

    expect(issueAnalysisSchema.safeParse(incomplete).success).toBe(false);

    reproduction.expectedBehavior = null;
    expect(issueAnalysisSchema.safeParse(incomplete).success).toBe(true);
  });

  it("produces a strict root JSON schema for OpenAI Structured Outputs", () => {
    expect(issueAnalysisTextFormat.type).toBe("json_schema");
    expect(issueAnalysisTextFormat.strict).toBe(true);
    expect(issueAnalysisTextFormat.schema).toMatchObject({
      type: "object",
      additionalProperties: false,
      required: [
        "summary",
        "classification",
        "severity",
        "missingInformation",
        "suggestedLabels",
        "duplicateCandidates",
        "reproduction",
        "probableCauses",
        "evidence",
        "followUpQuestions",
        "limitations",
      ],
    });
  });
});
