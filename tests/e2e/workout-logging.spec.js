import { test, expect } from "@playwright/test";
import {
  addDays,
  createDbConnection,
  devLoginAs,
  findMostRecentPastDateForDayOfWeek,
  formatLocalDateOnly,
  seedProgramCopyAssignment,
  withUserFixture
} from "./support/convictTestSupport.js";

const DEV_USER_EMAIL = "slice3-playwright@convict.local";
const USERNAME = "slice3-playwright";
const DISPLAY_NAME = "Slice 3 Playwright";
const LIVE_SYNC_USER_EMAIL = "slice3-live-sync@convict.local";
const LIVE_SYNC_USERNAME = "slice3-live-sync";
const LIVE_SYNC_DISPLAY_NAME = "Slice 3 Live Sync";
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

async function fetchSavedWorkoutSets(userId, scheduledForDate) {
  const connection = await createDbConnection();

  try {
    const [rows] = await connection.query(
      [
        "SELECT",
        "  we.exercise_name_snapshot AS exerciseName,",
        "  ws.measurement_unit_snapshot AS measurementUnit,",
        "  ws.performed_value AS performedValue",
        "FROM workouts w",
        "INNER JOIN workout_exercises we",
        "ON we.workout_id = w.id",
        "INNER JOIN workout_sets ws",
        "ON ws.workout_exercise_id = we.id",
        "WHERE w.user_id = ?",
        "AND w.scheduled_for_date = ?",
        "ORDER BY we.slot_number ASC, ws.logged_at ASC, ws.id ASC"
      ].join(" "),
      [userId, scheduledForDate]
    );

    return rows.map((row) => ({
      exerciseName: String(row.exerciseName || "").trim(),
      measurementUnit: String(row.measurementUnit || "").trim().toLowerCase(),
      performedValue: Number(row.performedValue || 0)
    }));
  } finally {
    await connection.end();
  }
}

function locateSavedSetRow(card, displaySetNumber, valueText) {
  return card.locator(".workout-set-row").filter({
    hasText: `Set ${displaySetNumber}`
  }).filter({
    hasText: valueText
  }).first();
}

test("user can log reps and seconds on an in-progress workout and see them after reload", async ({ page }) => {
  const fixturePlan = buildWorkoutLoggingFixturePlan();
  const fixtureState = await ensureWorkoutLoggingFixture({
    email: DEV_USER_EMAIL,
    username: USERNAME,
    displayName: DISPLAY_NAME,
    startOn: fixturePlan.startOn
  });

  await devLoginAs(page, {
    email: DEV_USER_EMAIL
  });

  await page.goto("/app");

  const targetWorkoutCard = page.locator(`.overdue-workout-card[data-scheduled-for-date="${fixturePlan.targetWorkoutDate}"]`).first();
  await expect(targetWorkoutCard).toBeVisible();

  await targetWorkoutCard.getByRole("button", { name: "Start overdue workout" }).click();

  await expect(page).toHaveURL(new RegExp(`/app/workouts/${fixturePlan.targetWorkoutDate}(\\?.*)?$`));
  await expect(page.locator(".workout-detail-card")).toBeVisible();

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
  await expect(handstandCard.getByText("seconds").first()).toBeVisible();
  await expect(bridgesCard.getByText("reps").first()).toBeVisible();
  await expect(handstandCard.getByText("LOG NOT SAVED")).toHaveCount(0);
  await expect(bridgesCard.getByText("LOG NOT SAVED")).toHaveCount(0);
  await expect(handstandCard.getByLabel("Seconds in new set")).toBeVisible();
  await expect(bridgesCard.getByLabel("Reps in new set")).toBeVisible();

  const workoutCard = page.locator(".workout-detail-card");
  const cardBoxBeforeRefresh = await workoutCard.boundingBox();
  if (!cardBoxBeforeRefresh) {
    throw new Error("Unable to measure the workout card before refresh.");
  }

  let delayedRefreshRequest = false;
  let resolveDelayedRefreshStarted = () => {};
  let releaseDelayedRefresh = () => {};
  const delayedRefreshStarted = new Promise((resolve) => {
    resolveDelayedRefreshStarted = resolve;
  });
  const releaseDelayedRefreshRequest = new Promise((resolve) => {
    releaseDelayedRefresh = resolve;
  });
  await page.route(`**/api/today/workouts/${fixturePlan.targetWorkoutDate}`, async (route, request) => {
    if (request.method() !== "GET" || delayedRefreshRequest) {
      await route.continue();
      return;
    }

    delayedRefreshRequest = true;
    resolveDelayedRefreshStarted();
    await releaseDelayedRefreshRequest;
    await route.continue();
  });

  await handstandCard.locator('input[type="number"]').first().fill("35");
  await handstandCard.getByRole("button", { name: "Save set" }).click();
  await delayedRefreshStarted;
  const refreshChip = page.locator(".workout-detail-page__refresh-chip");
  await expect(refreshChip).toBeVisible();
  await expect(refreshChip).toHaveCSS("position", "fixed");
  const cardBoxDuringRefresh = await workoutCard.boundingBox();
  if (!cardBoxDuringRefresh) {
    throw new Error("Unable to measure the workout card during refresh.");
  }
  expect(Math.abs(cardBoxDuringRefresh.y - cardBoxBeforeRefresh.y)).toBeLessThan(1);
  releaseDelayedRefresh();
  await expect(locateSavedSetRow(handstandCard, 1, "35 seconds")).toBeVisible();
  await handstandCard.locator('input[type="number"]').first().fill("45");
  await handstandCard.getByRole("button", { name: "Save set" }).click();
  await expect(locateSavedSetRow(handstandCard, 2, "45 seconds")).toBeVisible();
  await expect(handstandCard.getByLabel("Seconds in new set")).toBeVisible();
  await expect(handstandCard.getByText("LOG NOT SAVED")).toHaveCount(0);
  await expect(bridgesCard.getByText("LOG NOT SAVED")).toHaveCount(0);
  await expect(page.locator(".workout-detail-page").getByText("Set logs saved.")).toHaveCount(0);

  await handstandCard.getByRole("button", { name: "Edit set 1" }).click();
  const editHandstandSetOne = handstandCard.locator(".workout-set-editor").first();
  await expect(editHandstandSetOne).toBeVisible();
  await expect(editHandstandSetOne).not.toContainText("Edit set 1");
  await expect(editHandstandSetOne).not.toContainText("Update this saved set.");
  await expect(locateSavedSetRow(handstandCard, 1, "35 seconds")).toHaveCount(0);
  const editInput = editHandstandSetOne.locator('input[type="number"]').first();
  const editCancelButton = editHandstandSetOne.getByRole("button", { name: "Cancel" });
  const editSaveButton = editHandstandSetOne.getByRole("button", { name: "Save set" });
  const editInputBox = await editInput.boundingBox();
  const editCancelButtonBox = await editCancelButton.boundingBox();
  const editSaveButtonBox = await editSaveButton.boundingBox();
  if (!editInputBox || !editCancelButtonBox || !editSaveButtonBox) {
    throw new Error("Unable to measure the edit set editor layout.");
  }
  expect(editInputBox.width).toBeGreaterThan(170);
  expect(editCancelButtonBox.x).toBeGreaterThan(editInputBox.x + editInputBox.width - 1);
  expect(editSaveButtonBox.x).toBeGreaterThan(editCancelButtonBox.x);
  expect(Math.abs(editCancelButtonBox.y - editInputBox.y)).toBeLessThan(28);
  expect(Math.abs(editSaveButtonBox.y - editInputBox.y)).toBeLessThan(28);
  await editHandstandSetOne.locator('input[type="number"]').fill("36");
  await editHandstandSetOne.getByRole("button", { name: "Save set" }).click();
  await expect(locateSavedSetRow(handstandCard, 1, "36 seconds")).toBeVisible();

  await bridgesCard.locator('input[type="number"]').first().fill("20");
  await bridgesCard.getByRole("button", { name: "Save set" }).click();
  await expect(locateSavedSetRow(bridgesCard, 1, "20 reps")).toBeVisible();
  await expect(bridgesCard.getByLabel("Reps in new set")).toBeVisible();
  await expect(bridgesCard.getByText("LOG NOT SAVED")).toHaveCount(0);
  await expect(page.locator(".workout-detail-page").getByText("Set logs saved.")).toHaveCount(0);

  const savedWorkoutSets = await fetchSavedWorkoutSets(fixtureState.userId, fixturePlan.targetWorkoutDate);
  expect(savedWorkoutSets).toEqual([
    {
      exerciseName: "Wall Headstands",
      measurementUnit: "seconds",
      performedValue: 36
    },
    {
      exerciseName: "Wall Headstands",
      measurementUnit: "seconds",
      performedValue: 45
    },
    {
      exerciseName: "Short Bridges",
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
  await expect(reloadedHandstandCard.getByLabel("Seconds in new set")).toBeVisible();
  await expect(locateSavedSetRow(reloadedBridgesCard, 1, "20 reps")).toBeVisible();
  await expect(reloadedBridgesCard.getByLabel("Reps in new set")).toBeVisible();
});

test("deleting the middle saved set renumbers the visible list without gaps", async ({ page }) => {
  const fixturePlan = buildWorkoutLoggingFixturePlan();
  await ensureWorkoutLoggingFixture({
    email: DEV_USER_EMAIL,
    username: USERNAME,
    displayName: DISPLAY_NAME,
    startOn: fixturePlan.startOn
  });

  await devLoginAs(page, {
    email: DEV_USER_EMAIL
  });

  await page.goto("/app");

  const targetWorkoutCard = page.locator(`.overdue-workout-card[data-scheduled-for-date="${fixturePlan.targetWorkoutDate}"]`).first();
  await targetWorkoutCard.getByRole("button", { name: "Start overdue workout" }).click();

  const handstandCard = page.locator(".exercise-card").filter({
    hasText: "Handstand Push-ups"
  }).first();

  await handstandCard.locator('input[type="number"]').first().fill("35");
  await handstandCard.getByRole("button", { name: "Save set" }).click();
  await expect(locateSavedSetRow(handstandCard, 1, "35 seconds")).toBeVisible();
  await handstandCard.locator('input[type="number"]').first().fill("45");
  await handstandCard.getByRole("button", { name: "Save set" }).click();
  await expect(locateSavedSetRow(handstandCard, 2, "45 seconds")).toBeVisible();
  await handstandCard.locator('input[type="number"]').first().fill("55");
  await handstandCard.getByRole("button", { name: "Save set" }).click();

  await expect(locateSavedSetRow(handstandCard, 1, "35 seconds")).toBeVisible();
  await expect(locateSavedSetRow(handstandCard, 2, "45 seconds")).toBeVisible();
  await expect(locateSavedSetRow(handstandCard, 3, "55 seconds")).toBeVisible();

  await handstandCard.getByRole("button", { name: "Delete set 2" }).click();

  await expect(locateSavedSetRow(handstandCard, 1, "35 seconds")).toBeVisible();
  await expect(locateSavedSetRow(handstandCard, 2, "55 seconds")).toBeVisible();
  await expect(locateSavedSetRow(handstandCard, 3, "55 seconds")).toHaveCount(0);
  await expect(handstandCard.getByLabel("Seconds in new set")).toBeVisible();

  await handstandCard.locator('input[type="number"]').first().fill("65");
  await handstandCard.getByRole("button", { name: "Save set" }).click();

  await expect(locateSavedSetRow(handstandCard, 3, "65 seconds")).toBeVisible();
  await expect(handstandCard.getByLabel("Seconds in new set")).toBeVisible();
});

test("saved workout sets live-update another open client", async ({ page }) => {
  const fixturePlan = buildWorkoutLoggingFixturePlan();
  await ensureWorkoutLoggingFixture({
    email: LIVE_SYNC_USER_EMAIL,
    username: LIVE_SYNC_USERNAME,
    displayName: LIVE_SYNC_DISPLAY_NAME,
    startOn: fixturePlan.startOn
  });

  await devLoginAs(page, {
    email: LIVE_SYNC_USER_EMAIL
  });

  await page.goto("/app");

  const targetWorkoutCard = page.locator(`.overdue-workout-card[data-scheduled-for-date="${fixturePlan.targetWorkoutDate}"]`).first();
  await targetWorkoutCard.getByRole("button", { name: "Start overdue workout" }).click();
  await expect(page).toHaveURL(new RegExp(`/app/workouts/${fixturePlan.targetWorkoutDate}(\\?.*)?$`));

  const secondPage = await page.context().newPage();
  await secondPage.goto(`/app/workouts/${fixturePlan.targetWorkoutDate}`);

  const firstClientHandstandCard = page.locator(".exercise-card").filter({
    hasText: "Handstand Push-ups"
  }).first();
  const secondClientHandstandCard = secondPage.locator(".exercise-card").filter({
    hasText: "Handstand Push-ups"
  }).first();
  await expect(firstClientHandstandCard).toBeVisible();
  await expect(secondClientHandstandCard).toBeVisible();

  await firstClientHandstandCard.locator('input[type="number"]').first().fill("37");
  await firstClientHandstandCard.getByRole("button", { name: "Save set" }).click();

  await expect(locateSavedSetRow(firstClientHandstandCard, 1, "37 seconds")).toBeVisible();
  await expect(locateSavedSetRow(secondClientHandstandCard, 1, "37 seconds")).toBeVisible();

  await secondClientHandstandCard.locator('input[type="number"]').first().fill("41");
  await secondClientHandstandCard.getByRole("button", { name: "Save set" }).click();

  await expect(locateSavedSetRow(secondClientHandstandCard, 2, "41 seconds")).toBeVisible();
  await expect(locateSavedSetRow(firstClientHandstandCard, 2, "41 seconds")).toBeVisible();

  await secondPage.close();
});
