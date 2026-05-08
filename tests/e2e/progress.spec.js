import { expect, test } from "@playwright/test";
import {
  createDbConnection,
  devLoginAs,
  findMostRecentPastDateForDayOfWeek,
  formatLocalDateOnly,
  seedProgramCopyAssignment,
  withUserFixture
} from "./support/convictTestSupport.js";

const DEV_USER_EMAIL = "progress-playwright@convict.local";
const USERNAME = "progress-playwright";
const DISPLAY_NAME = "Progress Playwright";
const MONDAY_DAY_OF_WEEK = 1;
const PROGRAM_SLUG = "new-blood";

function buildProgressFixturePlan() {
  const todayDate = formatLocalDateOnly(new Date());
  const targetWorkoutDate = findMostRecentPastDateForDayOfWeek(todayDate, MONDAY_DAY_OF_WEEK);
  return {
    todayDate,
    targetWorkoutDate,
    startOn: targetWorkoutDate
  };
}

async function ensureProgressFixture({
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
      programSlug: PROGRAM_SLUG,
      startOn
    })
  );
}

async function fetchPushupProgress(userId) {
  const connection = await createDbConnection();

  try {
    const [rows] = await connection.query(
      [
        "SELECT cs.step_name AS currentStepName, rs.step_name AS readyStepName",
        "FROM user_exercise_progress uep",
        "INNER JOIN exercises e ON e.id = uep.exercise_id",
        "INNER JOIN exercise_steps cs ON cs.id = uep.current_step_id",
        "LEFT JOIN exercise_steps rs ON rs.id = uep.ready_to_advance_step_id",
        "WHERE uep.user_id = ? AND e.slug = 'push-ups'",
        "LIMIT 1"
      ].join(" "),
      [userId]
    );

    if (rows.length < 1) {
      return null;
    }

    return {
      currentStepName: String(rows[0].currentStepName || "").trim(),
      readyStepName: rows[0].readyStepName == null ? null : String(rows[0].readyStepName).trim()
    };
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

test("progress page shows earned advancement and applies it", async ({ page }) => {
  const fixturePlan = buildProgressFixturePlan();
  const fixtureState = await ensureProgressFixture({
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

  const pushupsCard = page.locator(".exercise-card").filter({
    hasText: "Push-ups"
  }).first();
  const legRaisesCard = page.locator(".exercise-card").filter({
    hasText: "Leg Raises"
  }).first();

  await pushupsCard.locator('input[type="number"]').first().fill("50");
  await pushupsCard.getByRole("button", { name: "Save set" }).click();
  await expect(pushupsCard.getByText("Add set 2")).toBeVisible();
  await pushupsCard.locator('input[type="number"]').first().fill("50");
  await pushupsCard.getByRole("button", { name: "Save set" }).click();
  await expect(pushupsCard.getByText("Add set 3")).toBeVisible();
  await pushupsCard.locator('input[type="number"]').first().fill("50");
  await pushupsCard.getByRole("button", { name: "Save set" }).click();
  await expect(locateSavedSetRow(pushupsCard, 3, "50 reps")).toBeVisible();

  await legRaisesCard.locator('input[type="number"]').first().fill("10");
  await legRaisesCard.getByRole("button", { name: "Save set" }).click();
  await expect(legRaisesCard.getByText("Add set 2")).toBeVisible();
  await legRaisesCard.locator('input[type="number"]').first().fill("10");
  await legRaisesCard.getByRole("button", { name: "Save set" }).click();
  await expect(locateSavedSetRow(legRaisesCard, 2, "10 reps")).toBeVisible();

  await page.getByRole("button", { name: "Finish workout" }).click();
  await expect(page.getByText("This workout is completed.")).toBeVisible();

  await page.goto("/app/progress");

  await expect(page.getByRole("heading", { name: "Progress" })).toBeVisible();
  await expect(page.getByTestId("progress-summary-ready")).toContainText("1");

  const progressPushupsCard = page.getByTestId("progress-exercise-push-ups");
  const progressSquatsCard = page.getByTestId("progress-exercise-squats");

  await expect(progressPushupsCard.getByText("Step 1: Wall Push-ups")).toBeVisible();
  await expect(progressPushupsCard.getByText("Step 2: Incline Push-ups")).toBeVisible();
  await expect(progressPushupsCard.getByRole("button", { name: "Advance now" })).toBeVisible();
  await expect(progressSquatsCard.getByText("Not started")).toBeVisible();

  const progressRowBeforeAdvance = await fetchPushupProgress(fixtureState.userId);
  expect(progressRowBeforeAdvance).toEqual({
    currentStepName: "Wall Push-ups",
    readyStepName: "Incline Push-ups"
  });

  await progressPushupsCard.getByRole("button", { name: "Advance now" }).click();

  await expect(progressPushupsCard.getByText("Step 2: Incline Push-ups")).toBeVisible();
  await expect(progressPushupsCard.getByRole("button", { name: "Advance now" })).toHaveCount(0);
  await expect(page.getByTestId("progress-summary-ready")).toHaveCount(0);

  const progressRowAfterAdvance = await fetchPushupProgress(fixtureState.userId);
  expect(progressRowAfterAdvance).toEqual({
    currentStepName: "Incline Push-ups",
    readyStepName: null
  });
});
