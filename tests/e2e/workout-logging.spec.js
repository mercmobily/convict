import { test, expect } from "@playwright/test";
import {
  addDays,
  createDbConnection,
  devLoginAs,
  findMostRecentPastDateForDayOfWeek,
  formatLocalDateOnly,
  seedProgramCopyAssignment,
  withUserWorkspaceFixture
} from "./support/convictTestSupport.js";

const DEV_USER_EMAIL = "slice3-playwright@convict.local";
const WORKSPACE_SLUG = "slice3-playwright";
const WORKSPACE_NAME = "Slice 3 Playwright";
const WEDNESDAY_DAY_OF_WEEK = 3;

function buildWorkoutLoggingFixturePlan() {
  const todayDate = formatLocalDateOnly(new Date());
  const targetWorkoutDate = findMostRecentPastDateForDayOfWeek(todayDate, WEDNESDAY_DAY_OF_WEEK);
  return {
    todayDate,
    targetWorkoutDate,
    startOn: addDays(targetWorkoutDate, -1)
  };
}

async function ensureWorkoutLoggingFixture({
  email,
  workspaceSlug,
  workspaceName,
  startOn
}) {
  return withUserWorkspaceFixture(
    {
      email,
      workspaceSlug,
      workspaceName
    },
    async ({ connection, userId, workspaceId }) => seedProgramCopyAssignment(connection, {
      userId,
      workspaceId,
      programSlug: "supermax",
      startOn
    })
  );
}

async function fetchSavedSetLogs(userId, scheduledForDate) {
  const connection = await createDbConnection();

  try {
    const [rows] = await connection.query(
      [
        "SELECT",
        "  woe.exercise_name_snapshot AS exerciseName,",
        "  wsl.set_number AS setNumber,",
        "  wsl.measurement_unit_snapshot AS measurementUnit,",
        "  wsl.performed_value AS performedValue",
        "FROM workout_occurrences wo",
        "INNER JOIN workout_occurrence_exercises woe",
        "ON woe.workout_occurrence_id = wo.id",
        "INNER JOIN workout_set_logs wsl",
        "ON wsl.workout_occurrence_exercise_id = woe.id",
        "WHERE wo.user_id = ?",
        "AND wo.scheduled_for_date = ?",
        "ORDER BY woe.slot_number ASC, wsl.set_number ASC"
      ].join(" "),
      [userId, scheduledForDate]
    );

    return rows.map((row) => ({
      exerciseName: String(row.exerciseName || "").trim(),
      setNumber: Number(row.setNumber || 0),
      measurementUnit: String(row.measurementUnit || "").trim().toLowerCase(),
      performedValue: Number(row.performedValue || 0)
    }));
  } finally {
    await connection.end();
  }
}

test("user can log reps and seconds on an in-progress workout and see them after reload", async ({ page }) => {
  const fixturePlan = buildWorkoutLoggingFixturePlan();
  const fixtureState = await ensureWorkoutLoggingFixture({
    email: DEV_USER_EMAIL,
    workspaceSlug: WORKSPACE_SLUG,
    workspaceName: WORKSPACE_NAME,
    startOn: fixturePlan.startOn
  });

  await devLoginAs(page, {
    email: DEV_USER_EMAIL
  });

  await page.goto(`/w/${WORKSPACE_SLUG}/`);

  const targetWorkoutCard = page.locator(".overdue-workout-card").filter({
    hasText: fixturePlan.targetWorkoutDate
  }).first();
  await expect(targetWorkoutCard).toBeVisible();

  await targetWorkoutCard.getByRole("button", { name: "Start overdue workout" }).click();

  await expect(page).toHaveURL(new RegExp(`/w/${WORKSPACE_SLUG}/workouts/${fixturePlan.targetWorkoutDate}$`));
  await expect(page.getByRole("heading", { name: /workout$/i })).toBeVisible();

  const handstandCard = page.locator(".exercise-card").filter({
    hasText: "Handstand Push-ups"
  }).first();
  const bridgesCard = page.locator(".exercise-card").filter({
    hasText: "Bridges"
  }).first();

  await expect(handstandCard.getByText("Step 1: Wall Headstands")).toBeVisible();
  await expect(handstandCard.getByText("Progression 1 x 120 seconds")).toBeVisible();
  await expect(handstandCard.getByText(/tripod headstand with light wall support/i)).toBeVisible();
  await expect(bridgesCard.getByText("Step 1: Short Bridges")).toBeVisible();
  await expect(bridgesCard.getByText("Progression 3 x 50 reps")).toBeVisible();
  await expect(bridgesCard.getByText(/lift the hips into a short bridge/i)).toBeVisible();
  await expect(handstandCard.locator(".v-chip").filter({ hasText: "seconds" }).first()).toBeVisible();
  await expect(bridgesCard.locator(".v-chip").filter({ hasText: "reps" }).first()).toBeVisible();
  await expect(handstandCard.getByText("LOG NOT SAVED")).toBeVisible();
  await expect(bridgesCard.getByText("LOG NOT SAVED")).toBeVisible();

  await handstandCard.locator('input[type="number"]').first().fill("35");
  await handstandCard.getByRole("button", { name: "Add set" }).click();
  await handstandCard.locator('input[type="number"]').nth(1).fill("45");
  await handstandCard.getByRole("button", { name: "Save logs" }).click();
  await expect(handstandCard.getByText("Set 2: 45 seconds")).toBeVisible();
  await expect(handstandCard.getByText("LOG NOT SAVED")).not.toBeVisible();
  await expect(bridgesCard.getByText("LOG NOT SAVED")).toBeVisible();
  await expect(page.locator(".workout-detail-page").getByText("Set logs saved.")).toHaveCount(0);

  await bridgesCard.locator('input[type="number"]').first().fill("20");
  await bridgesCard.getByRole("button", { name: "Save logs" }).click();
  await expect(bridgesCard.getByText("Set 1: 20 reps")).toBeVisible();
  await expect(bridgesCard.getByText("LOG NOT SAVED")).not.toBeVisible();
  await expect(page.locator(".workout-detail-page").getByText("Set logs saved.")).toHaveCount(0);

  const savedSetLogs = await fetchSavedSetLogs(fixtureState.userId, fixturePlan.targetWorkoutDate);
  expect(savedSetLogs).toEqual([
    {
      exerciseName: "Handstand Push-ups",
      setNumber: 1,
      measurementUnit: "seconds",
      performedValue: 35
    },
    {
      exerciseName: "Handstand Push-ups",
      setNumber: 2,
      measurementUnit: "seconds",
      performedValue: 45
    },
    {
      exerciseName: "Bridges",
      setNumber: 1,
      measurementUnit: "reps",
      performedValue: 20
    }
  ]);

  await page.reload();

  const reloadedHandstandCard = page.locator(".exercise-card").filter({
    hasText: "Handstand Push-ups"
  }).first();
  const reloadedBridgesCard = page.locator(".exercise-card").filter({
    hasText: "Bridges"
  }).first();

  await expect(reloadedHandstandCard.locator('input[type="number"]').nth(0)).toHaveValue("35");
  await expect(reloadedHandstandCard.locator('input[type="number"]').nth(1)).toHaveValue("45");
  await expect(reloadedBridgesCard.locator('input[type="number"]').nth(0)).toHaveValue("20");
});
