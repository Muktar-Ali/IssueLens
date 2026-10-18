import { App } from "@octokit/app";

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
