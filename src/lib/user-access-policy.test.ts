import { describe, expect, it } from "vitest";
import {
  getAllowedGitHubUserIds,
  isAuthorizedSession,
  isGitHubUserAllowed,
} from "./user-access-policy";

describe("GitHub user access policy", () => {
  it("denies everyone when the allowlist is missing or empty", () => {
    expect(isGitHubUserAllowed("123", undefined)).toBe(false);
    expect(isGitHubUserAllowed("123", "   ")).toBe(false);
  });

  it("allows only exact numeric GitHub user IDs", () => {
    expect(isGitHubUserAllowed("123", "123, 456")).toBe(true);
    expect(isGitHubUserAllowed("12", "123, 456")).toBe(false);
    expect(isGitHubUserAllowed("Muktar-Ali", "Muktar-Ali")).toBe(false);
  });

  it("ignores malformed entries and wildcards", () => {
    expect([...getAllowedGitHubUserIds("*, abc, 789, 12x")]).toEqual(["789"]);
  });

  it("rechecks the current allowlist for an existing session", () => {
    const session = { user: { githubId: "123" } };

    expect(isAuthorizedSession(session, "123")).toBe(true);
    expect(isAuthorizedSession(session, "456")).toBe(false);
  });
});
