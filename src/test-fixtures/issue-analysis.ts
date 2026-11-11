import type { IssueAnalysisResult } from "@/lib/issue-analysis-schema";

export const testIssueAnalysis: IssueAnalysisResult = {
  summary: "The application crashes when an empty configuration file is loaded.",
  classification: {
    category: "bug",
    confidence: 0.96,
    rationale: "The report describes repeatable behavior that differs from the expected result.",
  },
  severity: {
    level: "medium",
    confidence: 0.72,
    rationale: "The crash blocks startup, but the broader impact is not established.",
  },
  missingInformation: [],
  suggestedLabels: ["bug", "needs-info"],
  duplicateCandidates: [],
  reproduction: {
    readiness: "partial",
    prerequisites: ["Create an empty configuration file."],
    steps: ["Start the application with the empty configuration file."],
    expectedBehavior: "The application should show a validation error.",
    actualBehavior: "The application exits unexpectedly.",
    notes: ["The exact application version is unknown."],
  },
  probableCauses: [],
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
