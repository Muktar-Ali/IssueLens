import { describe, expect, it } from "vitest";
import { testIssueAnalysis } from "@/test-fixtures/issue-analysis";
import {
  buildFollowUpQuestionsMarkdown,
  buildInvestigationMarkdown,
  buildReproductionMarkdown,
  investigationMarkdownFilename,
} from "./investigation-markdown";

describe("investigation Markdown", () => {
  it("formats the complete analysis for human review", () => {
    const markdown = buildInvestigationMarkdown({
      repository: { owner: "example", name: "project" },
      issue: {
        number: 42,
        title: "Crash with empty configuration",
        url: "https://github.com/example/project/issues/42",
      },
      result: testIssueAnalysis,
      model: "gpt-5.4-mini-test",
    });

    expect(markdown).toContain("# Crash with empty configuration");
    expect(markdown).toContain("[#42](https://github.com/example/project/issues/42)");
    expect(markdown).toContain("## Reproduction plan");
    expect(markdown).toContain("## Evidence ledger");
    expect(markdown).toContain("## Follow-up questions");
    expect(markdown).toContain("No GitHub changes were made.");
  });

  it("formats focused copy sections", () => {
    expect(buildReproductionMarkdown(testIssueAnalysis)).toContain(
      "1. Start the application with the empty configuration file.",
    );
    expect(buildFollowUpQuestionsMarkdown(testIssueAnalysis)).toContain(
      "1. Which application version is affected?",
    );
  });

  it("creates a safe and descriptive filename", () => {
    expect(
      investigationMarkdownFilename({ owner: "Example Org", name: "Project/App" }, 42),
    ).toBe("example-org-project-app-issue-42-triage.md");
  });
});
