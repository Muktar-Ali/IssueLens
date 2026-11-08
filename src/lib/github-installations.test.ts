import { describe, expect, it, vi } from "vitest";
import {
  syncGitHubInstallations,
  type GitHubInstallationSnapshot,
} from "./github-installations";

const installations: GitHubInstallationSnapshot[] = [
  {
    id: 179133481,
    accountLogin: "Muktar-Ali",
    accountType: "User",
    repositorySelection: "selected",
    permissions: {
      contents: "read",
      issues: "read",
      metadata: "read",
    },
    suspendedAt: null,
    installedAt: new Date("2026-11-05T12:00:00.000Z"),
    updatedAt: new Date("2026-11-05T12:00:00.000Z"),
    repositories: [
      {
        id: 123456,
        owner: "Muktar-Ali",
        name: "IssueLens",
        fullName: "Muktar-Ali/IssueLens",
        private: false,
        defaultBranch: "main",
        archived: false,
        updatedAt: new Date("2026-11-05T13:00:00.000Z"),
      },
    ],
  },
];

describe("syncGitHubInstallations", () => {
  it("persists fetched installations and returns a useful summary", async () => {
    const fetchInstallations = vi.fn().mockResolvedValue(installations);
    const persistInstallations = vi.fn().mockResolvedValue(undefined);

    const summary = await syncGitHubInstallations({
      fetchInstallations,
      persistInstallations,
    });

    expect(persistInstallations).toHaveBeenCalledWith(installations);
    expect(summary).toEqual({ installations: 1, repositories: 1 });
  });

  it("does not alter the database when fetching from GitHub fails", async () => {
    const fetchInstallations = vi.fn().mockRejectedValue(new Error("GitHub unavailable"));
    const persistInstallations = vi.fn();

    await expect(
      syncGitHubInstallations({ fetchInstallations, persistInstallations }),
    ).rejects.toThrow("GitHub unavailable");
    expect(persistInstallations).not.toHaveBeenCalled();
  });
});
