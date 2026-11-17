export function getAllowedGitHubUserIds(
  configuredValue = process.env.ISSUELENS_ALLOWED_GITHUB_USER_IDS,
) {
  if (!configuredValue?.trim()) return new Set<string>();

  return new Set(
    configuredValue
      .split(",")
      .map((value) => value.trim())
      .filter((value) => /^\d+$/.test(value)),
  );
}

export function isGitHubUserAllowed(
  githubUserId: string | null | undefined,
  configuredValue = process.env.ISSUELENS_ALLOWED_GITHUB_USER_IDS,
) {
  if (!githubUserId || !/^\d+$/.test(githubUserId)) return false;
  return getAllowedGitHubUserIds(configuredValue).has(githubUserId);
}

export function isAuthorizedSession(
  session: { user?: { githubId?: string } } | null | undefined,
  configuredValue = process.env.ISSUELENS_ALLOWED_GITHUB_USER_IDS,
) {
  return isGitHubUserAllowed(session?.user?.githubId, configuredValue);
}
