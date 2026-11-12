import { investigations } from "@/db/schema";
import { getDatabase } from "@/lib/database";
import {
  fetchGitHubIssue,
  type GitHubIssueSnapshot,
} from "@/lib/github";
import {
  parseGitHubIssueUrl,
  type GitHubIssueReference,
} from "@/lib/github-url";
import { assertRepositoryIsAllowedPublic } from "@/lib/repository-policy";

export class InvalidGitHubIssueUrlError extends Error {
  constructor() {
    super("Provide a GitHub issue URL such as https://github.com/owner/repository/issues/123");
    this.name = "InvalidGitHubIssueUrlError";
  }
}

type SavedInvestigation = {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  createdAt: Date;
};

type InvestigationDependencies = {
  verifyRepository: (reference: GitHubIssueReference) => Promise<void>;
  fetchIssue: (reference: GitHubIssueReference) => Promise<GitHubIssueSnapshot>;
  saveInvestigation: (
    reference: GitHubIssueReference,
    issue: GitHubIssueSnapshot,
  ) => Promise<SavedInvestigation>;
};

export type CreateInvestigationResult = {
  id: string;
  status: SavedInvestigation["status"];
  repository: {
    owner: string;
    name: string;
  };
  issue: {
    number: number;
    title: string;
    body: string | null;
    url: string;
    state: string;
    author: string | null;
    labels: string[];
    updatedAt: string;
  };
  createdAt: string;
};

const defaultDependencies: InvestigationDependencies = {
  verifyRepository: assertRepositoryIsAllowedPublic,
  fetchIssue: fetchGitHubIssue,
  saveInvestigation,
};

export async function createInvestigation(
  issueUrl: string,
  dependencies: InvestigationDependencies = defaultDependencies,
): Promise<CreateInvestigationResult> {
  const reference = parseGitHubIssueUrl(issueUrl);
  if (!reference) throw new InvalidGitHubIssueUrlError();

  await dependencies.verifyRepository(reference);
  const issue = await dependencies.fetchIssue(reference);
  const saved = await dependencies.saveInvestigation(reference, issue);

  return {
    id: saved.id,
    status: saved.status,
    repository: {
      owner: reference.owner,
      name: reference.repository,
    },
    issue: {
      number: reference.issueNumber,
      title: issue.title,
      body: issue.body,
      url: issue.url,
      state: issue.state,
      author: issue.author,
      labels: issue.labels,
      updatedAt: issue.updatedAt.toISOString(),
    },
    createdAt: saved.createdAt.toISOString(),
  };
}

async function saveInvestigation(
  reference: GitHubIssueReference,
  issue: GitHubIssueSnapshot,
): Promise<SavedInvestigation> {
  const database = getDatabase();
  const [saved] = await database
    .insert(investigations)
    .values({
      repositoryOwner: reference.owner,
      repositoryName: reference.repository,
      issueNumber: reference.issueNumber,
      issueTitle: issue.title,
      issueBody: issue.body,
      issueUrl: issue.url,
      issueState: issue.state,
      issueAuthor: issue.author,
      issueLabels: issue.labels,
      issueUpdatedAt: issue.updatedAt,
      status: "queued",
    })
    .returning({
      id: investigations.id,
      status: investigations.status,
      createdAt: investigations.createdAt,
    });

  if (!saved) throw new Error("The investigation could not be saved");
  return saved;
}
