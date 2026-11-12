import { searchGitHubIssues } from "@/lib/github";
import type { GitHubIssueReference } from "@/lib/github-url";
import { sanitizeModelText } from "@/lib/model-input-safety";
import { assertRepositoryIsAllowedPublic } from "@/lib/repository-policy";

const MAX_CANDIDATES = 5;
const SEARCH_RESULT_LIMIT = 10;
const MAX_TITLE_LENGTH = 300;
const MAX_BODY_EXCERPT_LENGTH = 1_200;
const MAX_LABEL_LENGTH = 80;
const STOP_WORDS = new Set([
  "about",
  "after",
  "before",
  "does",
  "from",
  "have",
  "into",
  "issue",
  "that",
  "the",
  "this",
  "when",
  "with",
]);

export type DuplicateCandidateContext = {
  issueNumber: number;
  title: string;
  url: string;
  state: string;
  labels: string[];
  bodyExcerpt: string | null;
};

export type DuplicateSearchResult = {
  status: "completed" | "unavailable";
  candidates: DuplicateCandidateContext[];
  limitation: string | null;
};

type DuplicateSearchIssue = {
  repositoryOwner: string;
  repositoryName: string;
  issueNumber: number;
  issueTitle: string;
};

type SearchIssue = {
  number: number;
  title: string;
  body: string | null;
  state: string;
  labels: Array<string | { name?: string | null }>;
  repositoryUrl: string;
  pullRequest: boolean;
};

type DuplicateSearchDependencies = {
  verifyRepository: (reference: GitHubIssueReference) => Promise<void>;
  searchIssues: (reference: GitHubIssueReference, query: string) => Promise<SearchIssue[]>;
};

const defaultDependencies: DuplicateSearchDependencies = {
  verifyRepository: assertRepositoryIsAllowedPublic,
  searchIssues,
};

export async function findDuplicateCandidates(
  issue: DuplicateSearchIssue,
  dependencies: DuplicateSearchDependencies = defaultDependencies,
): Promise<DuplicateSearchResult> {
  const reference = {
    owner: issue.repositoryOwner,
    repository: issue.repositoryName,
    issueNumber: issue.issueNumber,
  };

  await dependencies.verifyRepository(reference);

  const terms = buildSearchTerms(issue.issueTitle);
  if (!terms.length) {
    return {
      status: "unavailable",
      candidates: [],
      limitation: "Duplicate search could not derive safe search terms from the issue title.",
    };
  }

  const query = `${terms.join(" ")} in:title repo:${reference.owner}/${reference.repository} is:issue`;

  let results: SearchIssue[];
  try {
    results = await dependencies.searchIssues(reference, query);
  } catch {
    return {
      status: "unavailable",
      candidates: [],
      limitation: "GitHub duplicate search was unavailable for this analysis.",
    };
  }

  const expectedRepositoryUrl =
    `https://api.github.com/repos/${reference.owner}/${reference.repository}`.toLowerCase();
  const seenIssueNumbers = new Set<number>();
  const candidates: DuplicateCandidateContext[] = [];

  for (const result of results) {
    if (candidates.length >= MAX_CANDIDATES) break;
    if (result.pullRequest || result.number === issue.issueNumber) continue;
    if (!Number.isSafeInteger(result.number) || result.number < 1) continue;
    if (result.repositoryUrl.toLowerCase() !== expectedRepositoryUrl) continue;
    if (seenIssueNumbers.has(result.number)) continue;
    seenIssueNumbers.add(result.number);

    candidates.push({
      issueNumber: result.number,
      title: sanitizeModelText(result.title, MAX_TITLE_LENGTH),
      url: `https://github.com/${reference.owner}/${reference.repository}/issues/${result.number}`,
      state: result.state === "open" || result.state === "closed" ? result.state : "unknown",
      labels: result.labels
        .flatMap((label) => (typeof label === "string" ? [label] : label.name ? [label.name] : []))
        .slice(0, 10)
        .map((label) => sanitizeModelText(label, MAX_LABEL_LENGTH)),
      bodyExcerpt: result.body
        ? sanitizeModelText(result.body, MAX_BODY_EXCERPT_LENGTH)
        : null,
    });
  }

  return { status: "completed", candidates, limitation: null };
}

function buildSearchTerms(title: string) {
  const words = title.toLowerCase().match(/[a-z0-9][a-z0-9._-]*/g) ?? [];
  return [...new Set(words)]
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word))
    .slice(0, 6);
}

async function searchIssues(reference: GitHubIssueReference, query: string) {
  return searchGitHubIssues(reference, query, SEARCH_RESULT_LIMIT);
}
