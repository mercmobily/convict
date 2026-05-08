import { expect, test } from "@playwright/test";
import { devLoginAs, withUserFixture } from "./support/convictTestSupport.js";

const DEV_USER_EMAIL = "adaptive-shell-playwright@convict.local";
const USERNAME = "adaptive-shell-playwright";
const DISPLAY_NAME = "Adaptive Shell Playwright";

test("shell primary navigation adapts between compact bottom nav and desktop drawer", async ({ page }) => {
  await withUserFixture({
    email: DEV_USER_EMAIL,
    username: USERNAME,
    displayName: DISPLAY_NAME
  });
  await devLoginAs(page, {
    email: DEV_USER_EMAIL
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app", { waitUntil: "networkidle" });

  const compactBottomNav = page.locator(".shell-layout__bottom-nav");
  await expect(compactBottomNav).toBeVisible();
  await expect(compactBottomNav.getByRole("link", { name: "Home", exact: true })).toBeVisible();
  await expect(compactBottomNav.getByRole("link", { name: "Progress", exact: true })).toBeVisible();
  await expect(compactBottomNav.getByRole("link", { name: "History", exact: true })).toBeVisible();

  const compactDrawer = page.locator(".v-navigation-drawer").first();
  await expect(compactDrawer).toHaveClass(/v-navigation-drawer--temporary/);

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/app", { waitUntil: "networkidle" });

  await expect(page.locator(".shell-layout__bottom-nav")).toHaveCount(0);
  const desktopDrawer = page.locator(".v-navigation-drawer").first();
  await expect(desktopDrawer).toBeVisible();
  await expect(desktopDrawer).toHaveClass(/v-navigation-drawer--active/);
  await expect(desktopDrawer.getByRole("link", { name: "Home", exact: true })).toBeVisible();
  await expect(desktopDrawer.getByRole("link", { name: "Progress", exact: true })).toBeVisible();
  await expect(desktopDrawer.getByRole("link", { name: "History", exact: true })).toBeVisible();
});
