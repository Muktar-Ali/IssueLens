import { Octokit } from "@octokit/rest";
import { createGitHubApp } from "@/lib/github-app";
import { findGitHubInstallationId } from "@/lib/github-installations";
import type { GitHubIssueReference } from "./github-url";

export type GitHubIssueSnapshot = {
  title: string;
  body: string | null;
  url: string;
  state: string;
  author: string | null;
  labels: string[];
  updatedAt: Date;
};

export type GitHubIssueSearchResult = {
  number: number;
  title: string;
  body: string | null;
  state: string;
  labels: Array<string | { name?: string | null }>;
  repositoryUrl: string;
  pullRequest: boolean;
};

export class GitHubIssueFetchError extends Error {
  constructor(
    message: string,
    public readonly httpStatus: number,
  ) {
    super(message);
    this.name = "GitHubIssueFetchError";
  }
}

async function createGitHubClient(reference?: GitHubIssueReference) {
  const installationId = reference ? await findGitHubInstallationId(reference) : undefined;
  if (installationId) {
    return createGitHubApp().getInstallationOctokit(installationId);
  }

  const token = process.env.GITHUB_TOKEN;
  return new Octokit(token ? { auth: token } : undefined);
}

// Keep repository access behind narrow, data-only functions. IssueLens does not expose
// the Octokit client to analysis code and must not fetch files, archives, artifacts,
// releases, attachments, or URLs embedded in issue content.
export async function isGitHubRepositoryPrivate(reference: GitHubIssueReference) {
  const github = await createGitHubClient(reference);
  const { data } = await github.rest.repos.get({
    owner: reference.owner,
    repo: reference.repository,
  });
  return data.private;
}

export async function searchGitHubIssues(
  reference: GitHubIssueReference,
  query: string,
  resultLimit: number,
): Promise<GitHubIssueSearchResult[]> {
  const github = await createGitHubClient(reference);
  const { data } = await github.rest.search.issuesAndPullRequests({
    q: query,
    sort: "updated",
    order: "desc",
    per_page: resultLimit,
  });

  return data.items.map((item) => ({
    number: item.number,
    title: item.title,
    body: item.body ?? null,
    state: item.state,
    labels: item.labels,
    repositoryUrl: item.repository_url,
    pullRequest: "pull_request" in item,
  }));
}

export async function fetchGitHubIssue(
  reference: GitHubIssueReference,
  client?: Octokit,
): Promise<GitHubIssueSnapshot> {
  try {
    const github = client ?? (await createGitHubClient(reference));
    const { data } = await github.rest.issues.get({
      owner: reference.owner,
      repo: reference.repository,
      issue_number: reference.issueNumber,
    });

    if (data.pull_request) {
      throw new GitHubIssueFetchError("The supplied URL points to a pull request, not an issue", 422);
    }

    return {
      title: data.title,
      body: data.body ?? null,
      url: data.html_url,
      state: data.state,
      author: data.user?.login ?? null,
      labels: data.labels.flatMap((label) => {
        if (typeof label === "string") return [label];
        return label.name ? [label.name] : [];
      }),
      updatedAt: new Date(data.updated_at ?? data.created_at),
    };
  } catch (error) {
    if (error instanceof GitHubIssueFetchError) throw error;

    const status = getErrorStatus(error);
    if (status === 404) {
      throw new GitHubIssueFetchError("The GitHub issue was not found or is not accessible", 404);
    }
    if (status === 403 || status === 429) {
      throw new GitHubIssueFetchError("GitHub denied or rate-limited the request", 503);
    }

    throw new GitHubIssueFetchError("IssueLens could not fetch the issue from GitHub", 502);
  }
}

function getErrorStatus(error: unknown) {
  if (typeof error !== "object" || error === null || !("status" in error)) return undefined;
  return typeof error.status === "number" ? error.status : undefined;
}
