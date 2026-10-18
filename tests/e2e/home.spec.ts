import { expect, test } from "@playwright/test";

test("shows the IssueLens foundation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /turn issue reports/i })).toBeVisible();
  await expect(page.getByText("Standard stack ready")).toBeVisible();
});
