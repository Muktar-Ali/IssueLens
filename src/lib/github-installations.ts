import { and, eq, ilike, notInArray } from "drizzle-orm";
import { githubInstallations, githubRepositories } from "@/db/schema";
import { getDatabase } from "@/lib/database";
import { createGitHubApp } from "@/lib/github-app";
import type { GitHubIssueReference } from "@/lib/github-url";

export type GitHubRepositorySnapshot = {
  id: number;
  owner: string;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  archived: boolean;
  updatedAt: Date | null;
};

export type GitHubInstallationSnapshot = {
  id: number;
  accountLogin: string;
  accountType: string;
  repositorySelection: string;
  permissions: Record<string, string>;
  suspendedAt: Date | null;
  installedAt: Date;
  updatedAt: Date;
  repositories: GitHubRepositorySnapshot[];
};

type SyncDependencies = {
  fetchInstallations: () => Promise<GitHubInstallationSnapshot[]>;
  persistInstallations: (installations: GitHubInstallationSnapshot[]) => Promise<void>;
};

export type GitHubSyncSummary = {
  installations: number;
  repositories: number;
};

const defaultDependencies: SyncDependencies = {
  fetchInstallations: fetchGitHubInstallations,
  persistInstallations: persistGitHubInstallations,
};

export async function syncGitHubInstallations(
  dependencies: SyncDependencies = defaultDependencies,
): Promise<GitHubSyncSummary> {
  const installations = await dependencies.fetchInstallations();
  await dependencies.persistInstallations(installations);

  return {
    installations: installations.length,
    repositories: installations.reduce(
      (total, installation) => total + installation.repositories.length,
      0,
    ),
  };
}

export async function findGitHubInstallationId(
  reference: Pick<GitHubIssueReference, "owner" | "repository">,
) {
  const database = getDatabase();
  const [repository] = await database
    .select({ installationId: githubRepositories.installationId })
    .from(githubRepositories)
    .where(
      and(
        ilike(githubRepositories.owner, reference.owner),
        ilike(githubRepositories.name, reference.repository),
      ),
    )
    .limit(1);

  return repository?.installationId;
}

async function fetchGitHubInstallations(): Promise<GitHubInstallationSnapshot[]> {
  const app = createGitHubApp();
  const installations: GitHubInstallationSnapshot[] = [];

  for await (const { installation } of app.eachInstallation.iterator()) {
    const accountLogin = getAccountLogin(installation.account);
    if (!accountLogin) {
      throw new Error(`GitHub installation ${installation.id} has no identifiable account`);
    }

    const repositories: GitHubRepositorySnapshot[] = [];
    for await (const { repository } of app.eachRepository.iterator({
      installationId: installation.id,
    })) {
      repositories.push({
        id: toSafeId(repository.id, "repository"),
        owner: repository.owner.login,
        name: repository.name,
        fullName: repository.full_name,
        private: repository.private,
        defaultBranch: repository.default_branch,
        archived: repository.archived ?? false,
        updatedAt: toOptionalDate(repository.updated_at),
      });
    }

    installations.push({
      id: installation.id,
      accountLogin,
      accountType: installation.target_type,
      repositorySelection: installation.repository_selection,
      permissions: installation.permissions as Record<string, string>,
      suspendedAt: toOptionalDate(installation.suspended_at),
      installedAt: new Date(installation.created_at),
      updatedAt: new Date(installation.updated_at),
      repositories,
    });
  }

  return installations;
}

async function persistGitHubInstallations(installations: GitHubInstallationSnapshot[]) {
  const database = getDatabase();
  const syncedAt = new Date();

  await database.transaction(async (transaction) => {
    for (const installation of installations) {
      await transaction
        .insert(githubInstallations)
        .values({
          id: installation.id,
          accountLogin: installation.accountLogin,
          accountType: installation.accountType,
          repositorySelection: installation.repositorySelection,
          permissions: installation.permissions,
          suspendedAt: installation.suspendedAt,
          installedAt: installation.installedAt,
          githubUpdatedAt: installation.updatedAt,
          syncedAt,
          updatedAt: syncedAt,
        })
        .onConflictDoUpdate({
          target: githubInstallations.id,
          set: {
            accountLogin: installation.accountLogin,
            accountType: installation.accountType,
            repositorySelection: installation.repositorySelection,
            permissions: installation.permissions,
            suspendedAt: installation.suspendedAt,
            installedAt: installation.installedAt,
            githubUpdatedAt: installation.updatedAt,
            syncedAt,
            updatedAt: syncedAt,
          },
        });

      for (const repository of installation.repositories) {
        await transaction
          .insert(githubRepositories)
          .values({
            id: repository.id,
            installationId: installation.id,
            owner: repository.owner,
            name: repository.name,
            fullName: repository.fullName,
            private: repository.private,
            defaultBranch: repository.defaultBranch,
            archived: repository.archived,
            githubUpdatedAt: repository.updatedAt,
            syncedAt,
            updatedAt: syncedAt,
          })
          .onConflictDoUpdate({
            target: githubRepositories.id,
            set: {
              installationId: installation.id,
              owner: repository.owner,
              name: repository.name,
              fullName: repository.fullName,
              private: repository.private,
              defaultBranch: repository.defaultBranch,
              archived: repository.archived,
              githubUpdatedAt: repository.updatedAt,
              syncedAt,
              updatedAt: syncedAt,
            },
          });
      }

      const repositoryIds = installation.repositories.map((repository) => repository.id);
      const staleRepositoryFilter = repositoryIds.length
        ? and(
            eq(githubRepositories.installationId, installation.id),
            notInArray(githubRepositories.id, repositoryIds),
          )
        : eq(githubRepositories.installationId, installation.id);

      await transaction.delete(githubRepositories).where(staleRepositoryFilter);
    }

    const installationIds = installations.map((installation) => installation.id);
    if (installationIds.length) {
      await transaction
        .delete(githubInstallations)
        .where(notInArray(githubInstallations.id, installationIds));
    } else {
      await transaction.delete(githubInstallations);
    }
  });
}

function getAccountLogin(account: unknown) {
  if (typeof account === "string") return account;
  if (typeof account !== "object" || account === null) return undefined;

  if ("login" in account && typeof account.login === "string") return account.login;
  if ("slug" in account && typeof account.slug === "string") return account.slug;
  return undefined;
}

function toOptionalDate(value: string | null | undefined) {
  return value ? new Date(value) : null;
}

function toSafeId(value: number | bigint, resource: string) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new Error(`GitHub returned an invalid ${resource} ID`);
  }
  return id;
}
