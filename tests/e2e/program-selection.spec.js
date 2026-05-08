import { test, expect } from "@playwright/test";
import { devLoginAs, withUserFixture } from "./support/convictTestSupport.js";

const DEV_USER_EMAIL = "slice1-playwright@convict.local";
const USERNAME = "slice1-playwright";
const DISPLAY_NAME = "Slice 1 Playwright";
const STARTS_ON = "2026-05-06";

async function ensureProgramSelectionFixture({ email, username, displayName }) {
  await withUserFixture({
    email,
    username,
    displayName
  });
}

test("user can choose and start a Convict Conditioning program", async ({ page }) => {
  await ensureProgramSelectionFixture({
    email: DEV_USER_EMAIL,
    username: USERNAME,
    displayName: DISPLAY_NAME
  });
  await devLoginAs(page, {
    email: DEV_USER_EMAIL
  });

  await page.goto("/app");

  await expect(page.getByRole("heading", { name: "Start your first program" })).toBeVisible();
  await expect(page.getByText("New Blood")).toBeVisible();
  await expect(page.getByText("Good Behavior")).toBeVisible();

  await page.getByText("New Blood").first().click();
  await page.locator('input[type="date"]').fill(STARTS_ON);
  await page.getByRole("button", { name: "Start Program" }).click();

  const activeProgramCard = page.locator(".active-program-card");
  await expect(page.getByRole("status").getByText("Program started.")).toBeVisible();
  await expect(activeProgramCard.getByRole("heading", { name: "New Blood" })).toBeVisible();
  await expect(activeProgramCard.getByRole("button", { name: "Show details" })).toBeVisible();
  await expect(activeProgramCard.getByText("working sets")).toHaveCount(0);

  await activeProgramCard.getByRole("button", { name: "Show details" }).click();
  await expect(activeProgramCard.getByRole("button", { name: "Hide details" })).toBeVisible();
  await expect(page.getByText("Started Wednesday, 6 May 2026")).toBeVisible();
  await expect(activeProgramCard.getByText("Canonical Convict Conditioning template")).toHaveCount(0);
  await expect(activeProgramCard.getByText("New Blood").first()).toBeVisible();
  await expect(activeProgramCard.getByText("working sets").first()).toBeVisible();

  await page.reload();

  await expect(activeProgramCard.getByRole("heading", { name: "New Blood" })).toBeVisible();
  await expect(activeProgramCard.getByRole("button", { name: "Show details" })).toBeVisible();
  await expect(activeProgramCard.getByText("working sets")).toHaveCount(0);
});
