import { test, expect } from "@playwright/test";
import {
  addDays,
  createDbConnection,
  dayOfWeekFromDate,
  devLoginAs,
  formatLocalDateOnly,
  normalizeDbDateOnly,
  seedProgramCopyAssignment,
  withUserFixture
} from "./support/convictTestSupport.js";

const DEV_USER_EMAIL = "slice2-playwright@convict.local";
const USERNAME = "slice2-playwright";
const DISPLAY_NAME = "Slice 2 Playwright";
const SUPERMAX_SCHEDULE = Object.freeze({
  1: ["Pull-ups", "Squats"],
  2: ["Push-ups", "Leg Raises"],
  3: ["Handstand Push-ups", "Bridges"],
  4: ["Pull-ups", "Squats"],
  5: ["Push-ups", "Leg Raises"],
  6: ["Handstand Push-ups", "Bridges"],
  7: []
});

function buildTodayFixturePlan() {
  const todayDate = formatLocalDateOnly(new Date());
  const startOn = addDays(todayDate, -4);
  const todayDayOfWeek = dayOfWeekFromDate(todayDate);
  const todayExercises = SUPERMAX_SCHEDULE[todayDayOfWeek] || [];
  const overdueDates = [];

  for (let cursor = startOn; cursor < todayDate; cursor = addDays(cursor, 1)) {
    if ((SUPERMAX_SCHEDULE[dayOfWeekFromDate(cursor)] || []).length > 0) {
      overdueDates.push(cursor);
    }
  }

  if (overdueDates.length < 2) {
    throw new Error(`Fixture plan expected at least two overdue training days between ${startOn} and ${todayDate}.`);
  }

  return {
    todayDate,
    startOn,
    todayDayOfWeek,
    todayExercises,
    overdueDates,
    primaryOverdueDate: overdueDates[0],
    secondaryOverdueDate: overdueDates[1] || overdueDates[0]
  };
}

async function ensureTodayFixture({
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

async function fetchOccurrence(userId, scheduledForDate) {
  const connection = await createDbConnection();

  try {
    const [rows] = await connection.query(
      [
        "SELECT id, status, scheduled_for_date AS scheduledForDate, performed_on_date AS performedOnDate",
        "FROM workout_occurrences",
        "WHERE user_id = ? AND scheduled_for_date = ?",
        "LIMIT 1"
      ].join(" "),
      [userId, scheduledForDate]
    );

    const row = rows?.[0] || null;
    if (!row) {
      return null;
    }

    return {
      ...row,
      scheduledForDate: normalizeDbDateOnly(row.scheduledForDate),
      performedOnDate: normalizeDbDateOnly(row.performedOnDate)
    };
  } finally {
    await connection.end();
  }
}

async function fetchOccurrenceExerciseCount(occurrenceId) {
  const connection = await createDbConnection();

  try {
    const [rows] = await connection.query(
      [
        "SELECT COUNT(*) AS count",
        "FROM workout_occurrence_exercises",
        "WHERE workout_occurrence_id = ?"
      ].join(" "),
      [occurrenceId]
    );

    return Number(rows?.[0]?.count || 0);
  } finally {
    await connection.end();
  }
}

test("active assignment shows today's projection and resolves overdue workouts", async ({ page }) => {
  const fixturePlan = buildTodayFixturePlan();
  const fixtureState = await ensureTodayFixture({
    email: DEV_USER_EMAIL,
    username: USERNAME,
    displayName: DISPLAY_NAME,
    startOn: fixturePlan.startOn
  });

  await devLoginAs(page, {
    email: DEV_USER_EMAIL
  });

  await page.goto("/app");

  const activeProgramCard = page.locator(".active-program-card");
  const todayCard = page.locator(".today-card");
  const overdueCard = page.locator(".overdue-card");
  await expect(activeProgramCard.getByRole("heading", { name: "Supermax" })).toBeVisible();
  await expect(activeProgramCard.getByText("Supermax").first()).toBeVisible();
  await expect(todayCard.getByRole("heading", { name: "Today", exact: true })).toBeVisible();
  await expect(overdueCard.getByRole("heading", { name: "Missed workouts", exact: true })).toBeVisible();

  const primaryOverdueCard = page.locator(`.overdue-workout-card[data-scheduled-for-date="${fixturePlan.primaryOverdueDate}"]`).first();
  const secondaryOverdueCard = page.locator(`.overdue-workout-card[data-scheduled-for-date="${fixturePlan.secondaryOverdueDate}"]`).first();

  await expect(primaryOverdueCard).toBeVisible();
  await expect(secondaryOverdueCard).toBeVisible();
  await expect(primaryOverdueCard.getByText("Step 1").first()).toBeVisible();
  await expect(primaryOverdueCard.getByText(/Progression /).first()).toBeVisible();

  if (fixturePlan.todayExercises.length > 0) {
    await expect(todayCard.getByText("Scheduled")).toBeVisible();
    await expect(todayCard.getByText("Step 1").first()).toBeVisible();
    await expect(todayCard.getByText(/Progression /).first()).toBeVisible();
    for (const exerciseName of fixturePlan.todayExercises) {
      await expect(todayCard.getByText(exerciseName).first()).toBeVisible();
    }

    await todayCard.getByRole("button", { name: "Start today's workout" }).click();

    await expect(page).toHaveURL(new RegExp(`/app/workouts/${fixturePlan.todayDate}$`));
    await expect(page.getByRole("button", { name: "Back to today" })).toBeVisible();

    const todayOccurrence = await fetchOccurrence(fixtureState.userId, fixturePlan.todayDate);
    expect(todayOccurrence?.status).toBe("in_progress");
    expect(String(todayOccurrence?.performedOnDate || "")).toContain(fixturePlan.todayDate);

    const todayExerciseCount = await fetchOccurrenceExerciseCount(todayOccurrence.id);
    expect(todayExerciseCount).toBe(fixturePlan.todayExercises.length);

    await page.getByRole("button", { name: "Back to today" }).click();
    await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible();
  } else {
    await expect(todayCard.getByText("Rest day")).toBeVisible();
    await expect(todayCard.getByText("No prescribed work today.")).toBeVisible();
  }

  await primaryOverdueCard.getByRole("button", { name: "Start overdue workout" }).click();

  await expect(page).toHaveURL(new RegExp(`/app/workouts/${fixturePlan.primaryOverdueDate}$`));
  await expect(page.getByRole("button", { name: "Back to today" })).toBeVisible();

  const overdueOccurrence = await fetchOccurrence(fixtureState.userId, fixturePlan.primaryOverdueDate);
  expect(overdueOccurrence?.status).toBe("in_progress");
  expect(String(overdueOccurrence?.performedOnDate || "")).toContain(fixturePlan.todayDate);

  const overdueExerciseCount = await fetchOccurrenceExerciseCount(overdueOccurrence.id);
  expect(overdueExerciseCount).toBe(2);

  await page.getByRole("button", { name: "Back to today" }).click();
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible();
  await expect(primaryOverdueCard.getByRole("button", { name: "Resume workout" })).toBeVisible();
  await expect(primaryOverdueCard.getByText("Open workout")).toHaveCount(0);

  await secondaryOverdueCard.getByRole("button", { name: "Mark definitely missed" }).click();

  await expect(page.getByRole("status").getByText("Workout marked definitely missed.")).toBeVisible();
  await expect(page.locator(`.overdue-workout-card[data-scheduled-for-date="${fixturePlan.secondaryOverdueDate}"]`)).toHaveCount(0);

  const missedOccurrence = await fetchOccurrence(fixtureState.userId, fixturePlan.secondaryOverdueDate);
  expect(missedOccurrence?.status).toBe("definitely_missed");
  expect(missedOccurrence?.performedOnDate).toBeNull();
});
