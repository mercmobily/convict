import { expect, test } from "@playwright/test";
import { devLoginAs, withUserFixture } from "./support/convictTestSupport.js";

const DEV_USER_EMAIL = "surface-routes-playwright@convict.local";
const USERNAME = "surface-routes-playwright";
const DISPLAY_NAME = "Surface Routes Playwright";

async function ensureSurfaceRoutesFixture() {
  return withUserFixture(
    {
      email: DEV_USER_EMAIL,
      username: USERNAME,
      displayName: DISPLAY_NAME
    },
    async ({ connection, userId }) => {
      await connection.query(
        "UPDATE console_settings SET owner_user_id = ? WHERE id = 1",
        [userId]
      );

      return {};
    }
  );
}

test("console settings lands on the app settings page and console can route back home", async ({ page }) => {
  await ensureSurfaceRoutesFixture();

  await devLoginAs(page, {
    email: DEV_USER_EMAIL
  });

  await page.goto("/console/settings");
  await expect(page).toHaveURL(/\/console\/settings\/?$/);
  await expect(page.getByText("Console settings", { exact: true })).toBeVisible();
  await expect(page.getByText("No app-level console settings are enabled")).toBeVisible();

  await page.goto("/console");
  await expect(page.getByRole("link", { name: "Back to app" })).toHaveAttribute("href", "/app");

  await page.goto("/home");
  await expect(page).toHaveURL(/\/app\/?$/);
});
