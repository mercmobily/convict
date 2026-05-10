import { test, expect } from "@playwright/test";
import {
  createDbConnection,
  devLoginAs,
  findMostRecentPastDateForDayOfWeek,
  formatLocalDateOnly,
  seedProgramCopyAssignment,
  withUserFixture
} from "./support/convictTestSupport.js";

const DEV_USER_EMAIL = "slice4-playwright@convict.local";
const USERNAME = "slice4-playwright";
const DISPLAY_NAME = "Slice 4 Playwright";
const MONDAY_DAY_OF_WEEK = 1;
const PROGRAM_SLUG = "new-blood";

function buildWorkoutSubmitFixturePlan() {
  const todayDate = formatLocalDateOnly(new Date());
  const targetWorkoutDate = findMostRecentPastDateForDayOfWeek(todayDate, MONDAY_DAY_OF_WEEK);
  return {
    todayDate,
    targetWorkoutDate,
    startOn: targetWorkoutDate
  };
}

async function ensureWorkoutSubmitFixture({
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

async function fetchWorkoutOccurrenceStatus(userId, scheduledForDate) {
  const connection = await createDbConnection();

  try {
    const [rows] = await connection.query(
      [
        "SELECT status, submitted_at AS submittedAt",
        "FROM workout_occurrences",
        "WHERE user_id = ? AND scheduled_for_date = ?",
        "LIMIT 1"
      ].join(" "),
      [userId, scheduledForDate]
    );

    if (rows.length < 1) {
      return null;
    }

    return {
      status: String(rows[0].status || "").trim().toLowerCase(),
      submittedAt: rows[0].submittedAt || null
    };
  } finally {
    await connection.end();
  }
}

async function fetchExerciseProgressRows(userId) {
  const connection = await createDbConnection();

  try {
    const [rows] = await connection.query(
      [
        "SELECT",
        "  REPLACE(pt.name, 'Convict ', '') AS exerciseName,",
        "  cs.step_label AS currentStepName,",
        "  rs.step_label AS readyStepName",
        "FROM user_progression_track_progress uptp",
        "INNER JOIN progression_tracks pt ON pt.id = uptp.progression_track_id",
        "INNER JOIN progression_track_steps cs ON cs.id = uptp.current_progression_track_step_id",
        "LEFT JOIN progression_track_steps rs ON rs.id = uptp.ready_to_advance_progression_track_step_id",
        "WHERE uptp.user_id = ?",
        "ORDER BY exerciseName ASC"
      ].join(" "),
      [userId]
    );

    return rows.map((row) => ({
      exerciseName: String(row.exerciseName || "").trim(),
      currentStepName: String(row.currentStepName || "").trim(),
      readyStepName: row.readyStepName == null ? null : String(row.readyStepName).trim()
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

test("user can finish a workout and manually apply earned advancement", async ({ page }) => {
  const fixturePlan = buildWorkoutSubmitFixturePlan();
  const fixtureState = await ensureWorkoutSubmitFixture({
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

  const pushupsCard = page.locator(".exercise-card").filter({
    hasText: "Push-ups"
  }).first();
  const legRaisesCard = page.locator(".exercise-card").filter({
    hasText: "Leg Raises"
  }).first();

  await pushupsCard.locator('input[type="number"]').first().fill("50");
  await pushupsCard.getByRole("button", { name: "Save set" }).click();
  await expect(locateSavedSetRow(pushupsCard, 1, "50 reps")).toBeVisible();
  await pushupsCard.locator('input[type="number"]').first().fill("50");
  await pushupsCard.getByRole("button", { name: "Save set" }).click();
  await expect(locateSavedSetRow(pushupsCard, 2, "50 reps")).toBeVisible();
  await pushupsCard.locator('input[type="number"]').first().fill("50");
  await pushupsCard.getByRole("button", { name: "Save set" }).click();
  await expect(locateSavedSetRow(pushupsCard, 3, "50 reps")).toBeVisible();

  await legRaisesCard.locator('input[type="number"]').first().fill("10");
  await legRaisesCard.getByRole("button", { name: "Save set" }).click();
  await expect(locateSavedSetRow(legRaisesCard, 1, "10 reps")).toBeVisible();
  await legRaisesCard.locator('input[type="number"]').first().fill("10");
  await legRaisesCard.getByRole("button", { name: "Save set" }).click();
  await expect(locateSavedSetRow(legRaisesCard, 2, "10 reps")).toBeVisible();

  const finishWorkoutButton = page.getByRole("button", { name: "Finish workout" });
  await expect(finishWorkoutButton).toBeEnabled();
  await finishWorkoutButton.click();

  await expect(page.locator(".workout-detail-card__status").getByText("Completed", { exact: true })).toBeVisible();
  await expect(page.getByText("This workout is completed.")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Finish workout" })).toHaveCount(0);

  const pushupAdvancementButton = pushupsCard.getByRole("button", { name: "Advance now" });
  await expect(pushupAdvancementButton).toBeVisible();
  await expect(pushupsCard.getByText("Ready to advance to Incline Push-ups")).toBeVisible();
  await expect(legRaisesCard.getByRole("button", { name: "Advance now" })).toHaveCount(0);

  const occurrenceStateAfterSubmit = await fetchWorkoutOccurrenceStatus(
    fixtureState.userId,
    fixturePlan.targetWorkoutDate
  );
  expect(occurrenceStateAfterSubmit).toMatchObject({
    status: "completed"
  });
  expect(occurrenceStateAfterSubmit?.submittedAt).toBeTruthy();

  const progressRowsAfterSubmit = await fetchExerciseProgressRows(fixtureState.userId);
  expect(progressRowsAfterSubmit).toEqual([
    {
      exerciseName: "Leg Raises",
      currentStepName: "Knee Tucks",
      readyStepName: null
    },
    {
      exerciseName: "Push-ups",
      currentStepName: "Wall Push-ups",
      readyStepName: "Incline Push-ups"
    }
  ]);

  await pushupAdvancementButton.click();

  await expect(pushupsCard.getByText("Incline Push-ups")).toBeVisible();
  await expect(pushupsCard.getByRole("button", { name: "Advance now" })).toHaveCount(0);

  const progressRowsAfterAdvancement = await fetchExerciseProgressRows(fixtureState.userId);
  expect(progressRowsAfterAdvancement).toEqual([
    {
      exerciseName: "Leg Raises",
      currentStepName: "Knee Tucks",
      readyStepName: null
    },
    {
      exerciseName: "Push-ups",
      currentStepName: "Incline Push-ups",
      readyStepName: null
    }
  ]);
});

test("user can finish a workout below the programmed minimum volume", async ({ page }) => {
  const fixturePlan = buildWorkoutSubmitFixturePlan();
  const fixtureState = await ensureWorkoutSubmitFixture({
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

  await pushupsCard.locator('input[type="number"]').first().fill("15");
  await pushupsCard.getByRole("button", { name: "Save set" }).click();

  const finishWorkoutButton = page.getByRole("button", { name: "Finish workout" });
  await expect(finishWorkoutButton).toBeEnabled();
  await finishWorkoutButton.click();

  await expect(page.locator(".workout-detail-card__status").getByText("Completed", { exact: true })).toBeVisible();
  await expect(page.getByText("This workout is completed.")).toHaveCount(0);
  await expect(pushupsCard.getByRole("button", { name: "Advance now" })).toHaveCount(0);
  await expect(legRaisesCard.getByRole("button", { name: "Advance now" })).toHaveCount(0);

  const occurrenceStateAfterSubmit = await fetchWorkoutOccurrenceStatus(
    fixtureState.userId,
    fixturePlan.targetWorkoutDate
  );
  expect(occurrenceStateAfterSubmit).toMatchObject({
    status: "completed"
  });

  const progressRowsAfterSubmit = await fetchExerciseProgressRows(fixtureState.userId);
  expect(progressRowsAfterSubmit).toEqual([
    {
      exerciseName: "Leg Raises",
      currentStepName: "Knee Tucks",
      readyStepName: null
    },
    {
      exerciseName: "Push-ups",
      currentStepName: "Wall Push-ups",
      readyStepName: null
    }
  ]);
});
