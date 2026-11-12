import { expect, test } from "@playwright/test";
import { testIssueAnalysis } from "../../src/test-fixtures/issue-analysis";

const investigationId = "36d3ae7d-d3a6-43f6-9006-b482823f67fd";
const issueUrl = "https://github.com/example/project/issues/42";

test("shows the IssueLens investigation workspace", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /a clearer first pass/i })).toBeVisible();
  await expect(page.getByLabel("GitHub issue URL")).toBeVisible();
  await expect(page.getByRole("button", { name: "Analyze issue" })).toBeDisabled();
  await expect(page.getByText(/no repository files downloaded/i)).toBeVisible();
});

test("submits an issue and renders the structured analysis dashboard", async ({ page }) => {
  await page.route(`**/api/investigations/${investigationId}/analyze`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        investigation: {
          investigationId,
          status: "completed",
          result: testIssueAnalysis,
          responseId: "resp_test",
          model: "gpt-5.4-mini-test",
        },
      }),
    });
  });
  await page.route("**/api/investigations", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        investigation: {
          id: investigationId,
          status: "queued",
          repository: { owner: "example", name: "project" },
          issue: {
            number: 42,
            title: "Crash with empty configuration",
            url: issueUrl,
            state: "open",
            author: "reporter",
            labels: ["bug"],
            updatedAt: "2026-11-12T12:00:00.000Z",
          },
          createdAt: "2026-11-12T12:01:00.000Z",
        },
      }),
    });
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("GitHub issue URL").pressSequentially(issueUrl);
  const analyzeButton = page.getByRole("button", { name: "Analyze issue" });
  await expect(analyzeButton).toBeEnabled();
  await analyzeButton.click();

  await expect(page.getByText("Analysis complete")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Crash with empty configuration" })).toBeVisible();
  await expect(page.getByText("96% confidence")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Reproduction plan" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Evidence ledger" })).toBeVisible();
  await expect(page.getByText("gpt-5.4-mini-test")).toBeVisible();
});
