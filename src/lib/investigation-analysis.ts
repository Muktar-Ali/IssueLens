import { and, eq } from "drizzle-orm";
import { investigations } from "@/db/schema";
import { getDatabase } from "@/lib/database";
import {
  findDuplicateCandidates,
  type DuplicateSearchResult,
} from "@/lib/duplicate-candidates";
import {
  generateIssueAnalysis,
  type GeneratedIssueAnalysis,
  type IssueAnalysisInput,
} from "@/lib/issue-analysis";

type ClaimedInvestigation = IssueAnalysisInput & {
  id: string;
};

type AnalysisDependencies = {
  claimInvestigation: (id: string) => Promise<ClaimedInvestigation>;
  findDuplicates: (issue: IssueAnalysisInput) => Promise<DuplicateSearchResult>;
  generateAnalysis: (issue: IssueAnalysisInput) => Promise<GeneratedIssueAnalysis>;
  completeInvestigation: (id: string, analysis: GeneratedIssueAnalysis) => Promise<void>;
  failInvestigation: (id: string, reason: string) => Promise<void>;
};

export type AnalyzeInvestigationResult = GeneratedIssueAnalysis & {
  investigationId: string;
  status: "completed";
};

export class InvestigationNotFoundError extends Error {
  constructor() {
    super("The investigation was not found");
    this.name = "InvestigationNotFoundError";
  }
}

export class InvestigationNotQueuedError extends Error {
  constructor(public readonly status: string) {
    super(`The investigation cannot be analyzed while its status is ${status}`);
    this.name = "InvestigationNotQueuedError";
  }
}

export class InvestigationAnalysisFailedError extends Error {
  constructor(options?: ErrorOptions) {
    super("IssueLens could not complete the analysis", options);
    this.name = "InvestigationAnalysisFailedError";
  }
}

const defaultDependencies: AnalysisDependencies = {
  claimInvestigation,
  findDuplicates: findDuplicateCandidates,
  generateAnalysis: generateIssueAnalysis,
  completeInvestigation,
  failInvestigation,
};

export async function analyzeInvestigation(
  id: string,
  overrides: Partial<AnalysisDependencies> = {},
): Promise<AnalyzeInvestigationResult> {
  const dependencies = { ...defaultDependencies, ...overrides };
  const investigation = await dependencies.claimInvestigation(id);

  try {
    const duplicateSearch = await dependencies.findDuplicates(investigation);
    const analysis = await dependencies.generateAnalysis({
      ...investigation,
      duplicateSearch,
    });
    await dependencies.completeInvestigation(id, analysis);
    return {
      investigationId: id,
      status: "completed",
      ...analysis,
    };
  } catch (error) {
    await dependencies.failInvestigation(id, getErrorMessage(error));
    throw new InvestigationAnalysisFailedError({ cause: error });
  }
}

async function claimInvestigation(id: string): Promise<ClaimedInvestigation> {
  const database = getDatabase();
  const startedAt = new Date();
  const [claimed] = await database
    .update(investigations)
    .set({
      status: "running",
      result: null,
      failureReason: null,
      analysisModel: null,
      openaiResponseId: null,
      startedAt,
      completedAt: null,
      updatedAt: startedAt,
    })
    .where(and(eq(investigations.id, id), eq(investigations.status, "queued")))
    .returning({
      id: investigations.id,
      repositoryOwner: investigations.repositoryOwner,
      repositoryName: investigations.repositoryName,
      issueNumber: investigations.issueNumber,
      issueTitle: investigations.issueTitle,
      issueBody: investigations.issueBody,
      issueUrl: investigations.issueUrl,
      issueState: investigations.issueState,
      issueAuthor: investigations.issueAuthor,
      issueLabels: investigations.issueLabels,
    });

  if (claimed) return claimed;

  const [existing] = await database
    .select({ status: investigations.status })
    .from(investigations)
    .where(eq(investigations.id, id))
    .limit(1);

  if (!existing) throw new InvestigationNotFoundError();
  throw new InvestigationNotQueuedError(existing.status);
}

async function completeInvestigation(id: string, analysis: GeneratedIssueAnalysis) {
  const completedAt = new Date();
  const [completed] = await getDatabase()
    .update(investigations)
    .set({
      status: "completed",
      result: analysis.result,
      analysisModel: analysis.model,
      openaiResponseId: analysis.responseId,
      failureReason: null,
      completedAt,
      updatedAt: completedAt,
    })
    .where(and(eq(investigations.id, id), eq(investigations.status, "running")))
    .returning({ id: investigations.id });

  if (!completed) throw new Error("The running investigation could not be completed");
}

async function failInvestigation(id: string, reason: string) {
  const completedAt = new Date();
  await getDatabase()
    .update(investigations)
    .set({
      status: "failed",
      failureReason: reason,
      completedAt,
      updatedAt: completedAt,
    })
    .where(and(eq(investigations.id, id), eq(investigations.status, "running")));
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unknown analysis error";
}
