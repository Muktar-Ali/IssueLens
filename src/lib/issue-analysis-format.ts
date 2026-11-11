import { zodTextFormat } from "openai/helpers/zod";
import { issueAnalysisSchema } from "@/lib/issue-analysis-schema";

export const issueAnalysisTextFormat = zodTextFormat(issueAnalysisSchema, "issue_analysis", {
  description: "Evidence-based triage analysis for a GitHub issue.",
});
