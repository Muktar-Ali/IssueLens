import { defineConfig, devices } from "@playwright/test";
import {
  TEST_AUTH_SECRET,
  TEST_GITHUB_USER_ID,
} from "./tests/e2e/auth-session";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    env: {
      AUTH_SECRET: TEST_AUTH_SECRET,
      AUTH_TRUST_HOST: "true",
      GITHUB_CLIENT_ID: "test-client-id",
      GITHUB_CLIENT_SECRET: "test-client-secret",
      ISSUELENS_ALLOWED_GITHUB_USER_IDS: TEST_GITHUB_USER_ID,
    },
  },
  projects: [
    {
      name: "desktop-chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["iPhone 13"], browserName: "chromium", channel: "chrome" },
    },
  ],
});
