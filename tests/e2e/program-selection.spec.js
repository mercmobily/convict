import { test, expect } from "@playwright/test";
import { devLoginAs, withUserWorkspaceFixture } from "./support/convictTestSupport.js";

const DEV_USER_EMAIL = "slice1-playwright@convict.local";
const WORKSPACE_SLUG = "slice1-playwright";
const WORKSPACE_NAME = "Slice 1 Playwright";
const STARTS_ON = "2026-05-06";

async function ensureProgramSelectionFixture({ email, workspaceSlug, workspaceName }) {
  await withUserWorkspaceFixture({
    email,
    workspaceSlug,
    workspaceName
  });
}

test("user can choose and start a Convict Conditioning program", async ({ page }) => {
  await ensureProgramSelectionFixture({
    email: DEV_USER_EMAIL,
    workspaceSlug: WORKSPACE_SLUG,
    workspaceName: WORKSPACE_NAME
  });
  await devLoginAs(page, {
    email: DEV_USER_EMAIL
  });

  await page.goto(`/w/${WORKSPACE_SLUG}/`);

  await expect(page.getByRole("heading", { name: "Start your first program" })).toBeVisible();
  await expect(page.getByText("New Blood")).toBeVisible();
  await expect(page.getByText("Good Behavior")).toBeVisible();

  await page.getByText("New Blood").first().click();
  await page.locator('input[type="date"]').fill(STARTS_ON);
  await page.getByRole("button", { name: "Start Program" }).click();

  const activeProgramCard = page.locator(".active-program-card");
  await expect(page.getByRole("status").getByText("Program started.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your active program" })).toBeVisible();
  await expect(activeProgramCard.getByRole("button", { name: "Show details" })).toBeVisible();
  await expect(activeProgramCard.getByText("Weekly schedule")).toHaveCount(0);

  await activeProgramCard.getByRole("button", { name: "Show details" }).click();
  await expect(activeProgramCard.getByRole("button", { name: "Hide details" })).toBeVisible();
  await expect(page.getByText(`Starts ${STARTS_ON}`)).toBeVisible();
  await expect(activeProgramCard.getByText("New Blood").first()).toBeVisible();
  await expect(activeProgramCard.getByText("Weekly schedule")).toBeVisible();

  await page.reload();

  await expect(page.getByRole("heading", { name: "Your active program" })).toBeVisible();
  await expect(activeProgramCard.getByRole("button", { name: "Show details" })).toBeVisible();
  await expect(activeProgramCard.getByText("Weekly schedule")).toHaveCount(0);
});
