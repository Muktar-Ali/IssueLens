import { App } from "@octokit/app";
import { Octokit } from "@octokit/rest";
import { readFileSync } from "node:fs";

export function createGitHubApp() {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = getPrivateKey();
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!appId || !privateKey) {
    throw new Error("GitHub App credentials are not configured");
  }

  const options = {
    appId,
    privateKey,
    Octokit,
  };

  return webhookSecret
    ? new App({ ...options, webhooks: { secret: webhookSecret } })
    : new App(options);
}

function getPrivateKey() {
  const inlinePrivateKey = process.env.GITHUB_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (inlinePrivateKey) return inlinePrivateKey;

  const privateKeyPath = process.env.GITHUB_PRIVATE_KEY_PATH;
  if (privateKeyPath) return readFileSync(privateKeyPath, "utf8");

  return undefined;
}
