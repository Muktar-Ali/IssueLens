export type GitHubIssueReference = {
  owner: string;
  repository: string;
  issueNumber: number;
};

export function parseGitHubIssueUrl(value: string): GitHubIssueReference | null {
  try {
    const url = new URL(value);
    if (url.hostname !== "github.com") return null;

    const match = url.pathname.match(/^\/([^/]+)\/([^/]+)\/issues\/(\d+)\/?$/);
    if (!match) return null;

    const issueNumber = Number(match[3]);
    if (!Number.isSafeInteger(issueNumber) || issueNumber < 1) return null;

    return {
      owner: match[1],
      repository: match[2],
      issueNumber,
    };
  } catch {
    return null;
  }
}
