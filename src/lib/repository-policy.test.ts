import { describe, expect, it, vi } from "vitest";
import {
  assertRepositoryIsAllowedPublic,
  parseAllowedRepositories,
} from "./repository-policy";

const reference = {
  owner: "Muktar-Ali",
  repository: "IssueLens",
  issueNumber: 42,
};

describe("repository policy", () => {
  it("treats a missing or empty allowlist as allowing nothing", () => {
    expect(parseAllowedRepositories(undefined)).toEqual(new Set());
    expect(parseAllowedRepositories("   ")).toEqual(new Set());
  });

  it("ignores wildcards and malformed repository entries", () => {
    expect(parseAllowedRepositories("*,openai/*,invalid,Muktar-Ali/IssueLens")).toEqual(
      new Set(["muktar-ali/issuelens"]),
    );
  });

  it("rejects an unlisted repository without contacting GitHub", async () => {
    const isPrivateRepository = vi.fn();

    await expect(
      assertRepositoryIsAllowedPublic(reference, {
        allowedRepositories: new Set(),
        isPrivateRepository,
      }),
    ).rejects.toMatchObject({
      code: "REPOSITORY_NOT_ALLOWED",
      httpStatus: 403,
    });

    expect(isPrivateRepository).not.toHaveBeenCalled();
  });

  it("matches explicitly approved repositories case-insensitively", async () => {
    const isPrivateRepository = vi.fn().mockResolvedValue(false);

    await expect(
      assertRepositoryIsAllowedPublic(reference, {
        allowedRepositories: new Set(["muktar-ali/issuelens"]),
        isPrivateRepository,
      }),
    ).resolves.toBeUndefined();

    expect(isPrivateRepository).toHaveBeenCalledWith(reference);
  });

  it("rejects private repositories even when they are explicitly listed", async () => {
    await expect(
      assertRepositoryIsAllowedPublic(reference, {
        allowedRepositories: new Set(["muktar-ali/issuelens"]),
        isPrivateRepository: vi.fn().mockResolvedValue(true),
      }),
    ).rejects.toMatchObject({
      code: "PRIVATE_REPOSITORY_NOT_ALLOWED",
      httpStatus: 403,
    });
  });

  it("fails closed when GitHub visibility cannot be verified", async () => {
    await expect(
      assertRepositoryIsAllowedPublic(reference, {
        allowedRepositories: new Set(["muktar-ali/issuelens"]),
        isPrivateRepository: vi.fn().mockRejectedValue(new Error("GitHub unavailable")),
      }),
    ).rejects.toMatchObject({
      code: "REPOSITORY_VERIFICATION_FAILED",
      httpStatus: 503,
    });
  });
});
