import { isGitHubRepositoryPrivate } from "@/lib/github";
import type { GitHubIssueReference } from "@/lib/github-url";

const REPOSITORY_SLUG_PATTERN =
  /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?\/[A-Za-z0-9._-]{1,100}$/;

export type RepositoryPolicyErrorCode =
  | "REPOSITORY_NOT_ALLOWED"
  | "PRIVATE_REPOSITORY_NOT_ALLOWED"
  | "REPOSITORY_VERIFICATION_FAILED";

export class RepositoryPolicyError extends Error {
  constructor(
    public readonly code: RepositoryPolicyErrorCode,
    message: string,
    public readonly httpStatus: number,
  ) {
    super(message);
    this.name = "RepositoryPolicyError";
  }
}

type RepositoryPolicyDependencies = {
  allowedRepositories?: ReadonlySet<string>;
  isPrivateRepository?: (reference: GitHubIssueReference) => Promise<boolean>;
};

export function parseAllowedRepositories(value: string | undefined) {
  const repositories = new Set<string>();

  for (const entry of value?.split(",") ?? []) {
    const repository = entry.trim();
    if (REPOSITORY_SLUG_PATTERN.test(repository)) {
      repositories.add(repository.toLowerCase());
    }
  }

  return repositories;
}

export async function assertRepositoryIsAllowedPublic(
  reference: GitHubIssueReference,
  dependencies: RepositoryPolicyDependencies = {},
) {
  const allowedRepositories =
    dependencies.allowedRepositories ??
    parseAllowedRepositories(process.env.GITHUB_ALLOWED_REPOSITORIES);
  const repositorySlug = `${reference.owner}/${reference.repository}`.toLowerCase();

  if (!allowedRepositories.has(repositorySlug)) {
    throw new RepositoryPolicyError(
      "REPOSITORY_NOT_ALLOWED",
      "This repository is not explicitly approved for IssueLens analysis",
      403,
    );
  }

  try {
    const isPrivate = await (
      dependencies.isPrivateRepository ?? isGitHubRepositoryPrivate
    )(reference);

    if (isPrivate) {
      throw new RepositoryPolicyError(
        "PRIVATE_REPOSITORY_NOT_ALLOWED",
        "IssueLens only analyzes explicitly approved public repositories",
        403,
      );
    }
  } catch (error) {
    if (error instanceof RepositoryPolicyError) throw error;

    throw new RepositoryPolicyError(
      "REPOSITORY_VERIFICATION_FAILED",
      "IssueLens could not verify that the repository is public",
      503,
    );
  }
}
