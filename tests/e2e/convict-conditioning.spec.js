import { expect, test } from "@playwright/test";
import { devLoginAs, withUserFixture } from "./support/convictTestSupport.js";

const DEV_USER_EMAIL = "convict-conditioning-playwright@convict.local";
const USERNAME = "convict-conditioning-playwright";
const DISPLAY_NAME = "Convict Conditioning Playwright";

test("secondary Convict Conditioning page is linked from the app shell", async ({ page }) => {
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

  await expect(page.locator(".shell-layout__bottom-nav").getByRole("link", {
    name: "Convict Conditioning",
    exact: true
  })).toHaveCount(0);

  await page.getByRole("button", { name: "Toggle navigation menu" }).click();
  const drawer = page.locator(".v-navigation-drawer").first();
  const secondaryLink = drawer.getByRole("link", {
    name: "Convict Conditioning",
    exact: true
  });
  await expect(secondaryLink).toBeVisible();
  await secondaryLink.click();

  await expect(page).toHaveURL(/\/app\/convict-conditioning$/);
  await expect(page.getByTestId("convict-conditioning-page")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Convict Conditioning" })).toBeVisible();
  await expect(page.getByText('Paul "Coach" Wade')).toBeVisible();
  await expect(page.getByText("Dragon Door Publications").first()).toBeVisible();
  await expect(page.getByTestId("convict-conditioning-principles")).toContainText("Six movements");

  const hasHorizontalOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  expect(hasHorizontalOverflow).toBe(false);
});
