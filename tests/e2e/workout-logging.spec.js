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

function locateSavedSetRow(card, displaySetNumber, valueText) {
  return card.locator(".set-log-row").filter({
    hasText: `Set ${displaySetNumber}`
  }).filter({
    hasText: valueText
  }).first();
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
  await expect(handstandCard.getByText("Add set 1")).toBeVisible();
  await expect(bridgesCard.getByText("Add set 1")).toBeVisible();

  await handstandCard.locator('input[type="number"]').first().fill("35");
  await handstandCard.getByRole("button", { name: "Save set" }).click();
  await expect(handstandCard.getByText("Add set 2")).toBeVisible();
  await handstandCard.locator('input[type="number"]').first().fill("45");
  await handstandCard.getByRole("button", { name: "Save set" }).click();
  await expect(locateSavedSetRow(handstandCard, 2, "45 seconds")).toBeVisible();
  await expect(handstandCard.getByText("Add set 3")).toBeVisible();
  await expect(handstandCard.getByText("LOG NOT SAVED")).not.toBeVisible();
  await expect(bridgesCard.getByText("LOG NOT SAVED")).toBeVisible();
  await expect(page.locator(".workout-detail-page").getByText("Set logs saved.")).toHaveCount(0);

  const editHandstandSetOne = handstandCard.locator(".set-log-editor").filter({
    hasText: "Edit set 1"
  }).first();
  await handstandCard.getByRole("button", { name: "Edit set 1" }).click();
  await expect(editHandstandSetOne).toBeVisible();
  await editHandstandSetOne.locator('input[type="number"]').fill("36");
  await editHandstandSetOne.getByRole("button", { name: "Save set" }).click();
  await expect(locateSavedSetRow(handstandCard, 1, "36 seconds")).toBeVisible();

  await bridgesCard.locator('input[type="number"]').first().fill("20");
  await bridgesCard.getByRole("button", { name: "Save set" }).click();
  await expect(locateSavedSetRow(bridgesCard, 1, "20 reps")).toBeVisible();
  await expect(bridgesCard.getByText("Add set 2")).toBeVisible();
  await expect(bridgesCard.getByText("LOG NOT SAVED")).not.toBeVisible();
  await expect(page.locator(".workout-detail-page").getByText("Set logs saved.")).toHaveCount(0);

  const savedSetLogs = await fetchSavedSetLogs(fixtureState.userId, fixturePlan.targetWorkoutDate);
  expect(savedSetLogs).toEqual([
    {
      exerciseName: "Handstand Push-ups",
      setNumber: 1,
      measurementUnit: "seconds",
      performedValue: 36
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

  await expect(locateSavedSetRow(reloadedHandstandCard, 1, "36 seconds")).toBeVisible();
  await expect(locateSavedSetRow(reloadedHandstandCard, 2, "45 seconds")).toBeVisible();
  await expect(reloadedHandstandCard.getByText("Add set 3")).toBeVisible();
  await expect(locateSavedSetRow(reloadedBridgesCard, 1, "20 reps")).toBeVisible();
  await expect(reloadedBridgesCard.getByText("Add set 2")).toBeVisible();
});

test("deleting the middle saved set renumbers the visible list without gaps", async ({ page }) => {
  const fixturePlan = buildWorkoutLoggingFixturePlan();
  await ensureWorkoutLoggingFixture({
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
  await targetWorkoutCard.getByRole("button", { name: "Start overdue workout" }).click();

  const handstandCard = page.locator(".exercise-card").filter({
    hasText: "Handstand Push-ups"
  }).first();

  await handstandCard.locator('input[type="number"]').first().fill("35");
  await handstandCard.getByRole("button", { name: "Save set" }).click();
  await expect(handstandCard.getByText("Add set 2")).toBeVisible();
  await handstandCard.locator('input[type="number"]').first().fill("45");
  await handstandCard.getByRole("button", { name: "Save set" }).click();
  await expect(handstandCard.getByText("Add set 3")).toBeVisible();
  await handstandCard.locator('input[type="number"]').first().fill("55");
  await handstandCard.getByRole("button", { name: "Save set" }).click();

  await expect(locateSavedSetRow(handstandCard, 1, "35 seconds")).toBeVisible();
  await expect(locateSavedSetRow(handstandCard, 2, "45 seconds")).toBeVisible();
  await expect(locateSavedSetRow(handstandCard, 3, "55 seconds")).toBeVisible();

  await handstandCard.getByRole("button", { name: "Delete set 2" }).click();

  await expect(locateSavedSetRow(handstandCard, 1, "35 seconds")).toBeVisible();
  await expect(locateSavedSetRow(handstandCard, 2, "55 seconds")).toBeVisible();
  await expect(locateSavedSetRow(handstandCard, 3, "55 seconds")).toHaveCount(0);
  await expect(handstandCard.getByText("Add set 3")).toBeVisible();

  await handstandCard.locator('input[type="number"]').first().fill("65");
  await handstandCard.getByRole("button", { name: "Save set" }).click();

  await expect(locateSavedSetRow(handstandCard, 3, "65 seconds")).toBeVisible();
  await expect(handstandCard.getByText("Add set 4")).toBeVisible();
});
