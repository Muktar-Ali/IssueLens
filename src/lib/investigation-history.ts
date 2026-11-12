import { and, desc, eq, isNotNull } from "drizzle-orm";
import { investigations } from "@/db/schema";
import { getDatabase } from "@/lib/database";
import type { IssueAnalysisResult } from "@/lib/issue-analysis-schema";

export type InvestigationHistoryItem = {
  id: string;
  repository: {
    owner: string;
    name: string;
  };
  issue: {
    number: number;
    title: string;
    url: string;
  };
  classification: IssueAnalysisResult["classification"]["category"];
  severity: IssueAnalysisResult["severity"]["level"];
  model: string;
  completedAt: string;
};

export type SavedInvestigationDetail = {
  id: string;
  status: "completed";
  repository: {
    owner: string;
    name: string;
  };
  issue: {
    number: number;
    title: string;
    url: string;
    state: string;
    author: string | null;
    labels: string[];
    updatedAt: string;
  };
  result: IssueAnalysisResult;
  model: string;
  createdAt: string;
  completedAt: string;
};

export async function listCompletedInvestigations(
  limit = 12,
): Promise<InvestigationHistoryItem[]> {
  const rows = await getDatabase()
    .select({
      id: investigations.id,
      repositoryOwner: investigations.repositoryOwner,
      repositoryName: investigations.repositoryName,
      issueNumber: investigations.issueNumber,
      issueTitle: investigations.issueTitle,
      issueUrl: investigations.issueUrl,
      result: investigations.result,
      analysisModel: investigations.analysisModel,
      completedAt: investigations.completedAt,
    })
    .from(investigations)
    .where(
      and(
        eq(investigations.status, "completed"),
        isNotNull(investigations.result),
        isNotNull(investigations.analysisModel),
        isNotNull(investigations.completedAt),
      ),
    )
    .orderBy(desc(investigations.completedAt))
    .limit(Math.min(Math.max(limit, 1), 50));

  return rows.flatMap((row) => {
    if (!row.result || !row.analysisModel || !row.completedAt) return [];

    return [
      {
        id: row.id,
        repository: {
          owner: row.repositoryOwner,
          name: row.repositoryName,
        },
        issue: {
          number: row.issueNumber,
          title: row.issueTitle,
          url: row.issueUrl,
        },
        classification: row.result.classification.category,
        severity: row.result.severity.level,
        model: row.analysisModel,
        completedAt: row.completedAt.toISOString(),
      },
    ];
  });
}

export async function getCompletedInvestigation(
  id: string,
): Promise<SavedInvestigationDetail | null> {
  const [row] = await getDatabase()
    .select()
    .from(investigations)
    .where(
      and(
        eq(investigations.id, id),
        eq(investigations.status, "completed"),
        isNotNull(investigations.result),
        isNotNull(investigations.analysisModel),
        isNotNull(investigations.completedAt),
      ),
    )
    .limit(1);

  if (!row?.result || !row.analysisModel || !row.completedAt) return null;

  return {
    id: row.id,
    status: "completed",
    repository: {
      owner: row.repositoryOwner,
      name: row.repositoryName,
    },
    issue: {
      number: row.issueNumber,
      title: row.issueTitle,
      url: row.issueUrl,
      state: row.issueState,
      author: row.issueAuthor,
      labels: row.issueLabels,
      updatedAt: row.issueUpdatedAt.toISOString(),
    },
    result: row.result,
    model: row.analysisModel,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt.toISOString(),
  };
}
