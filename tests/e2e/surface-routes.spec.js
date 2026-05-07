import { expect, test } from "@playwright/test";
import { devLoginAs, withUserWorkspaceFixture } from "./support/convictTestSupport.js";

const DEV_USER_EMAIL = "surface-routes-playwright@convict.local";
const WORKSPACE_SLUG = "surface-routes-playwright";
const WORKSPACE_NAME = "Surface Routes Playwright";

async function ensureSurfaceRoutesFixture() {
  return withUserWorkspaceFixture(
    {
      email: DEV_USER_EMAIL,
      workspaceSlug: WORKSPACE_SLUG,
      workspaceName: WORKSPACE_NAME
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

test("console settings lands on its real child and console can route back home", async ({ page }) => {
  await ensureSurfaceRoutesFixture();

  await devLoginAs(page, {
    email: DEV_USER_EMAIL
  });

  await page.goto("/console/settings");
  await expect(page).toHaveURL(/\/console\/settings\/admin-assistant\/?$/);
  await expect(page.getByText("Console settings")).toBeVisible();

  await page.goto("/console");
  await expect(page.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/home");
});

test("workspace settings route shows a real landing page instead of a blank shell", async ({ page }) => {
  await ensureSurfaceRoutesFixture();

  await devLoginAs(page, {
    email: DEV_USER_EMAIL
  });

  await page.goto(`/w/${WORKSPACE_SLUG}/admin/workspace/settings`);
  await expect(page.getByText("Workspace settings")).toBeVisible();
  await expect(page.getByText("Current workspace", { exact: true })).toBeVisible();
  await expect(page.getByText("Settings in this section apply to the current cell only.")).toBeVisible();
});
