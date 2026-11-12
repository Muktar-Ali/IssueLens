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

    const owner = match[1];
    const repository = match[2];
    if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(owner)) return null;
    if (!/^[A-Za-z0-9._-]{1,100}$/.test(repository)) return null;

    const issueNumber = Number(match[3]);
    if (!Number.isSafeInteger(issueNumber) || issueNumber < 1) return null;

    return {
      owner,
      repository,
      issueNumber,
    };
  } catch {
    return null;
  }
}
