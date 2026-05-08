import { expect, test } from "@playwright/test";

test("shell primary navigation adapts between compact bottom nav and desktop drawer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/home", { waitUntil: "networkidle" });

  const compactBottomNav = page.locator(".shell-layout__bottom-nav");
  await expect(compactBottomNav).toBeVisible();
  await expect(compactBottomNav.getByRole("link", { name: "Home", exact: true })).toBeVisible();
  await expect(compactBottomNav.getByRole("link", { name: "Settings", exact: true })).toBeVisible();

  const compactDrawer = page.locator(".v-navigation-drawer").first();
  await expect(compactDrawer).toHaveClass(/v-navigation-drawer--temporary/);

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/home", { waitUntil: "networkidle" });

  await expect(page.locator(".shell-layout__bottom-nav")).toHaveCount(0);
  const desktopDrawer = page.locator(".v-navigation-drawer").first();
  await expect(desktopDrawer).toBeVisible();
  await expect(desktopDrawer).toHaveClass(/v-navigation-drawer--active/);
  await expect(desktopDrawer.getByRole("link", { name: "Home", exact: true })).toBeVisible();
  await expect(desktopDrawer.getByRole("link", { name: "Settings", exact: true })).toBeVisible();
});
