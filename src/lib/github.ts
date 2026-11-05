import { App } from "@octokit/app";
import { Octokit } from "@octokit/rest";
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

export class GitHubIssueFetchError extends Error {
  constructor(
    message: string,
    public readonly httpStatus: number,
  ) {
    super(message);
    this.name = "GitHubIssueFetchError";
  }
}

export function createGitHubClient() {
  const token = process.env.GITHUB_TOKEN;
  return new Octokit(token ? { auth: token } : undefined);
}

export async function fetchGitHubIssue(
  reference: GitHubIssueReference,
  client = createGitHubClient(),
): Promise<GitHubIssueSnapshot> {
  try {
    const { data } = await client.rest.issues.get({
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

export function createGitHubApp() {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!appId || !privateKey || !webhookSecret) {
    throw new Error("GitHub App credentials are not configured");
  }

  return new App({
    appId,
    privateKey,
    webhooks: { secret: webhookSecret },
  });
}
