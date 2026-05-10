import { expect, test } from "@playwright/test";
import {
  addDays,
  dayOfWeekFromDate,
  devLoginAs,
  formatLocalDateOnly,
  seedProgramCopyAssignment,
  withUserFixture
} from "./support/convictTestSupport.js";

const DEV_USER_EMAIL = "history-playwright@convict.local";
const USERNAME = "history-playwright";
const DISPLAY_NAME = "History Playwright";
const SUPERMAX_SCHEDULE = Object.freeze({
  1: ["Pull-ups", "Squats"],
  2: ["Push-ups", "Leg Raises"],
  3: ["Handstand Push-ups", "Bridges"],
  4: ["Pull-ups", "Squats"],
  5: ["Push-ups", "Leg Raises"],
  6: ["Handstand Push-ups", "Bridges"],
  7: []
});

function buildHistoryFixturePlan() {
  const todayDate = formatLocalDateOnly(new Date());
  const startOn = addDays(todayDate, -4);
  const overdueDates = [];

  for (let cursor = startOn; cursor < todayDate; cursor = addDays(cursor, 1)) {
    if ((SUPERMAX_SCHEDULE[dayOfWeekFromDate(cursor)] || []).length > 0) {
      overdueDates.push(cursor);
    }
  }

  if (overdueDates.length < 1) {
    throw new Error(`Fixture plan expected at least one overdue day between ${startOn} and ${todayDate}.`);
  }

  return {
    todayDate,
    startOn,
    targetHistoryDate: overdueDates[0],
    targetHistoryExercises: SUPERMAX_SCHEDULE[dayOfWeekFromDate(overdueDates[0])] || []
  };
}

async function ensureHistoryFixture({
  email,
  username,
  displayName,
  startOn
}) {
  return withUserFixture(
    {
      email,
      username,
      displayName
    },
    async ({ connection, userId }) => seedProgramCopyAssignment(connection, {
      userId,
      programSlug: "supermax",
      startOn
    })
  );
}

function monthTitleFor(dateString) {
  const [year, month, day] = String(dateString || "").split("-").map(Number);
  return new Intl.DateTimeFormat("en-AU", {
    month: "long",
    year: "numeric"
  }).format(new Date(year, month - 1, day));
}

function shiftMonth(dateString, monthOffset) {
  const [year, month] = String(dateString || "").split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() + Number(monthOffset || 0));
  return formatLocalDateOnly(date).slice(0, 7);
}

test("history page shows month projection and links into workout detail", async ({ page }) => {
  const fixturePlan = buildHistoryFixturePlan();
  await ensureHistoryFixture({
    email: DEV_USER_EMAIL,
    username: USERNAME,
    displayName: DISPLAY_NAME,
    startOn: fixturePlan.startOn
  });

  await devLoginAs(page, {
    email: DEV_USER_EMAIL
  });

  await page.goto("/app/history");

  await expect(page.getByRole("heading", { name: "History" })).toBeVisible();
  await expect(page.getByText(monthTitleFor(fixturePlan.todayDate), { exact: true })).toBeVisible();
  await expect(page.getByTestId(`history-day-${fixturePlan.targetHistoryDate}`)).toBeVisible();

  const targetDayButton = page.getByTestId(`history-day-${fixturePlan.targetHistoryDate}`);
  await expect(targetDayButton).toContainText("Overdue");
  await targetDayButton.click();

  await expect(page).toHaveURL(new RegExp(`day=${fixturePlan.targetHistoryDate}`));
  await expect(page.locator(`.history-day-detail-card[data-scheduled-for-date="${fixturePlan.targetHistoryDate}"]`)).toBeVisible();
  for (const exerciseName of fixturePlan.targetHistoryExercises) {
    await expect(page.getByText(exerciseName).last()).toBeVisible();
  }

  await page.getByRole("link", { name: "Open workout detail" }).click();
  await expect(page).toHaveURL(new RegExp(`/app/workouts/${fixturePlan.targetHistoryDate}(\\?.*)?$`));

  await page.goto("/app/history");

  const nextMonthKey = shiftMonth(fixturePlan.todayDate, 1);
  await page.getByRole("button", { name: "Next calendar month" }).click();
  await expect(page).toHaveURL(new RegExp(`month=${nextMonthKey}`));
  await expect(page.getByText(monthTitleFor(`${nextMonthKey}-01`), { exact: true })).toBeVisible();
});
