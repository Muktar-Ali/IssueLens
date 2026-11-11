import { z } from "zod";

const confidenceSchema = z
  .number()
  .min(0)
  .max(1)
  .describe("Confidence from 0 (uncertain) to 1 (certain), based only on supplied evidence.");

const classificationSchema = z
  .object({
    category: z
      .enum([
        "bug",
        "feature_request",
        "question",
        "documentation",
        "maintenance",
        "security",
        "other",
      ])
      .describe("The issue's primary category."),
    confidence: confidenceSchema,
    rationale: z.string().describe("A concise explanation grounded in the issue evidence."),
  })
  .strict();

const severitySchema = z
  .object({
    level: z
      .enum(["critical", "high", "medium", "low", "unknown"])
      .describe("Likely impact if the report is a bug; unknown when evidence is insufficient."),
    confidence: confidenceSchema,
    rationale: z.string().describe("Why this severity level fits the available evidence."),
  })
  .strict();

const missingInformationSchema = z
  .object({
    category: z.enum([
      "reproduction_steps",
      "environment",
      "version",
      "logs_or_errors",
      "expected_behavior",
      "actual_behavior",
      "sample_code",
      "screenshots_or_recording",
      "other",
    ]),
    status: z.enum(["present", "partial", "missing"]),
    explanation: z.string().describe("What is present or absent and why it matters."),
    followUpQuestion: z
      .string()
      .nullable()
      .describe("A specific question for the reporter, or null when no question is needed."),
  })
  .strict();

const duplicateCandidateSchema = z
  .object({
    issueNumber: z.number().int().positive(),
    title: z.string(),
    url: z.string(),
    similarity: confidenceSchema,
    matchingSignals: z
      .array(z.string())
      .describe("Concrete similarities such as error text, affected component, or symptoms."),
    explanation: z.string().describe("Why this issue may or may not be a duplicate."),
  })
  .strict();

const reproductionSchema = z
  .object({
    readiness: z
      .enum(["ready", "partial", "blocked"])
      .describe("Whether the supplied evidence supports a usable reproduction."),
    prerequisites: z.array(z.string()),
    steps: z.array(z.string()),
    expectedBehavior: z.string().nullable(),
    actualBehavior: z.string().nullable(),
    notes: z
      .array(z.string())
      .describe("Assumptions, uncertainties, and cautions about the drafted reproduction."),
  })
  .strict();

const probableCauseSchema = z
  .object({
    title: z.string(),
    explanation: z.string(),
    confidence: confidenceSchema,
    evidenceIds: z
      .array(z.string())
      .describe("IDs from the evidence array that support this hypothesis."),
  })
  .strict();

const evidenceSchema = z
  .object({
    id: z.string().describe("A short identifier unique within this analysis."),
    source: z.enum([
      "issue_title",
      "issue_body",
      "issue_comment",
      "repository_file",
      "repository_metadata",
      "related_issue",
    ]),
    reference: z
      .string()
      .describe("A field name, issue URL, repository path, or other traceable location."),
    excerpt: z
      .string()
      .nullable()
      .describe("A short supporting excerpt, or null when an excerpt is unavailable."),
    supports: z.string().describe("The specific conclusion this evidence supports."),
  })
  .strict();

export const issueAnalysisSchema = z
  .object({
    summary: z.string().describe("A concise, factual summary of the report and its triage state."),
    classification: classificationSchema,
    severity: severitySchema,
    missingInformation: z.array(missingInformationSchema),
    suggestedLabels: z
      .array(z.string())
      .describe("Repository labels worth human review; never claims they were applied."),
    duplicateCandidates: z
      .array(duplicateCandidateSchema)
      .describe("Only candidates supplied in the analysis context; empty when none are supported."),
    reproduction: reproductionSchema,
    probableCauses: z
      .array(probableCauseSchema)
      .describe("Evidence-backed hypotheses, not assertions of confirmed root cause."),
    evidence: z.array(evidenceSchema),
    followUpQuestions: z
      .array(z.string())
      .describe("Prioritized questions that would most improve the investigation."),
    limitations: z
      .array(z.string())
      .describe("Important facts the analysis could not verify from the supplied context."),
  })
  .strict();

export type IssueAnalysisResult = z.infer<typeof issueAnalysisSchema>;
