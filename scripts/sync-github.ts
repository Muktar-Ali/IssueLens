import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const { syncGitHubInstallations } = await import("../src/lib/github-installations");
const { closeDatabase } = await import("../src/lib/database");

try {
  const summary = await syncGitHubInstallations();
  console.log(
    `Synced ${summary.installations} GitHub installation(s) and ${summary.repositories} repository record(s).`,
  );
} catch (error) {
  console.error("GitHub installation sync failed", error);
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
