import "dotenv/config";
import mysql from "mysql2/promise";
import { test, expect } from "@playwright/test";

const DEV_USER_EMAIL = "slice4-playwright@convict.local";
const WORKSPACE_SLUG = "slice4-playwright";
const WORKSPACE_NAME = "Slice 4 Playwright";
const MONDAY_DAY_OF_WEEK = 1;
const PROGRAM_SLUG = "new-blood";

function createDbConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });
}

async function deleteUserTrainingRows(connection, userId) {
  await connection.query(
    [
      "DELETE wsl FROM workout_set_logs wsl",
      "INNER JOIN workout_occurrence_exercises woe",
      "ON woe.id = wsl.workout_occurrence_exercise_id",
      "INNER JOIN workout_occurrences wo",
      "ON wo.id = woe.workout_occurrence_id",
      "WHERE wo.user_id = ?"
    ].join(" "),
    [userId]
  );

  await connection.query(
    [
      "DELETE woe FROM workout_occurrence_exercises woe",
      "INNER JOIN workout_occurrences wo",
      "ON wo.id = woe.workout_occurrence_id",
      "WHERE wo.user_id = ?"
    ].join(" "),
    [userId]
  );

  await connection.query(
    "DELETE FROM user_exercise_progress WHERE user_id = ?",
    [userId]
  );
  await connection.query(
    "DELETE FROM personal_step_variations WHERE user_id = ?",
    [userId]
  );
  await connection.query(
    "DELETE FROM workout_occurrences WHERE user_id = ?",
    [userId]
  );
  await connection.query(
    [
      "DELETE FROM user_program_assignment_revisions",
      "WHERE user_program_assignment_id IN (",
      "  SELECT id FROM user_program_assignments WHERE user_id = ?",
      ")"
    ].join(" "),
    [userId]
  );
  await connection.query(
    "DELETE FROM user_program_assignments WHERE user_id = ?",
    [userId]
  );
}

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

function formatLocalDateOnly(date) {
  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate())
  ].join("-");
}

function parseDateOnly(dateString) {
  const [year, month, day] = String(dateString || "").split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(dateString, dayOffset) {
  const date = parseDateOnly(dateString);
  date.setDate(date.getDate() + Number(dayOffset || 0));
  return formatLocalDateOnly(date);
}

function dayOfWeekFromDate(dateString) {
  const jsDay = parseDateOnly(dateString).getDay();
  return jsDay === 0 ? 7 : jsDay;
}

function findMostRecentPastDateForDayOfWeek(dateString, targetDayOfWeek) {
  for (let offset = 1; offset <= 14; offset += 1) {
    const candidate = addDays(dateString, -offset);
    if (dayOfWeekFromDate(candidate) === targetDayOfWeek) {
      return candidate;
    }
  }

  throw new Error(`Unable to find a past day-of-week ${targetDayOfWeek} before ${dateString}.`);
}

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
  workspaceSlug,
  workspaceName,
  startOn
}) {
  const connection = await createDbConnection();

  try {
    await connection.beginTransaction();

    try {
      const username = workspaceSlug;
      const displayName = workspaceName;
      const authProvider = "supabase";
      const authProviderUserSid = `playwright-${workspaceSlug}`;

      const [userRows] = await connection.query(
        "SELECT id FROM users WHERE email = ? LIMIT 1",
        [email]
      );
      let userId = userRows?.[0]?.id || null;

      if (!userId) {
        const [insertUserResult] = await connection.query(
          [
            "INSERT INTO users (auth_provider, auth_provider_user_sid, email, username, display_name)",
            "VALUES (?, ?, ?, ?, ?)"
          ].join(" "),
          [authProvider, authProviderUserSid, email, username, displayName]
        );
        userId = insertUserResult.insertId;
      } else {
        await connection.query(
          [
            "UPDATE users",
            "SET username = ?, display_name = ?",
            "WHERE id = ?"
          ].join(" "),
          [username, displayName, userId]
        );
      }

      const [workspaceRows] = await connection.query(
        "SELECT id FROM workspaces WHERE slug = ? LIMIT 1",
        [workspaceSlug]
      );
      let workspaceId = workspaceRows?.[0]?.id || null;

      if (!workspaceId) {
        const [insertWorkspaceResult] = await connection.query(
          [
            "INSERT INTO workspaces (slug, name, owner_user_id, is_personal, avatar_url)",
            "VALUES (?, ?, ?, ?, ?)"
          ].join(" "),
          [workspaceSlug, workspaceName, userId, 1, ""]
        );
        workspaceId = insertWorkspaceResult.insertId;
      } else {
        await connection.query(
          [
            "UPDATE workspaces",
            "SET name = ?, owner_user_id = ?, is_personal = ?, avatar_url = ?, deleted_at = NULL, updated_at = CURRENT_TIMESTAMP",
            "WHERE id = ?"
          ].join(" "),
          [workspaceName, userId, 1, "", workspaceId]
        );
      }

      await connection.query(
        [
          "INSERT INTO workspace_memberships (workspace_id, user_id, role_sid, status)",
          "VALUES (?, ?, ?, ?)",
          "ON DUPLICATE KEY UPDATE",
          "role_sid = VALUES(role_sid),",
          "status = VALUES(status),",
          "updated_at = CURRENT_TIMESTAMP"
        ].join(" "),
        [workspaceId, userId, "owner", "active"]
      );

      await connection.query(
        [
          "INSERT INTO workspace_settings (workspace_id)",
          "VALUES (?)",
          "ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP"
        ].join(" "),
        [workspaceId]
      );

      await deleteUserTrainingRows(connection, userId);

      const [programRows] = await connection.query(
        "SELECT id FROM programs WHERE slug = ? LIMIT 1",
        [PROGRAM_SLUG]
      );
      const programId = programRows?.[0]?.id || null;
      if (!programId) {
        throw new Error("Missing canonical 'new-blood' program fixture.");
      }

      const [assignmentInsertResult] = await connection.query(
        [
          "INSERT INTO user_program_assignments (user_id, workspace_id, starts_on, status)",
          "VALUES (?, ?, ?, ?)"
        ].join(" "),
        [userId, workspaceId, startOn, "active"]
      );
      const assignmentId = assignmentInsertResult.insertId;

      await connection.query(
        [
          "INSERT INTO user_program_assignment_revisions",
          "(user_program_assignment_id, program_id, effective_from_date, change_reason, notes)",
          "VALUES (?, ?, ?, ?, ?)"
        ].join(" "),
        [assignmentId, programId, startOn, "initial", null]
      );

      await connection.commit();

      return {
        userId: String(userId)
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } finally {
    await connection.end();
  }
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
        "  e.name AS exerciseName,",
        "  cs.step_name AS currentStepName,",
        "  rs.step_name AS readyStepName",
        "FROM user_exercise_progress uep",
        "INNER JOIN exercises e ON e.id = uep.exercise_id",
        "INNER JOIN exercise_steps cs ON cs.id = uep.current_step_id",
        "LEFT JOIN exercise_steps rs ON rs.id = uep.ready_to_advance_step_id",
        "WHERE uep.user_id = ?",
        "ORDER BY e.name ASC"
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

async function devLoginAs(page, { email }) {
  await page.goto("/");

  await page.evaluate(async ({ email: targetEmail }) => {
    const sessionResponse = await fetch("/api/session", {
      credentials: "include"
    });
    if (!sessionResponse.ok) {
      throw new Error(`Session bootstrap failed: ${sessionResponse.status}`);
    }

    const sessionPayload = await sessionResponse.json();
    const csrfToken = String(sessionPayload?.csrfToken || "");
    if (!csrfToken) {
      throw new Error("Missing csrfToken from /api/session.");
    }

    const loginResponse = await fetch("/api/dev-auth/login-as", {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        "csrf-token": csrfToken
      },
      body: JSON.stringify({ email: targetEmail })
    });

    if (!loginResponse.ok) {
      throw new Error(`Dev login failed: ${loginResponse.status} ${await loginResponse.text()}`);
    }
  }, { email });
}

test("user can finish a workout and manually apply earned advancement", async ({ page }) => {
  const fixturePlan = buildWorkoutSubmitFixturePlan();
  const fixtureState = await ensureWorkoutSubmitFixture({
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

  const pushupsCard = page.locator(".exercise-card").filter({
    hasText: "Push-ups"
  }).first();
  const legRaisesCard = page.locator(".exercise-card").filter({
    hasText: "Leg Raises"
  }).first();

  await pushupsCard.locator('input[type="number"]').first().fill("50");
  await pushupsCard.getByRole("button", { name: "Add set" }).click();
  await pushupsCard.locator('input[type="number"]').nth(1).fill("50");
  await pushupsCard.getByRole("button", { name: "Add set" }).click();
  await pushupsCard.locator('input[type="number"]').nth(2).fill("50");
  await pushupsCard.getByRole("button", { name: "Save logs" }).click();
  await expect(pushupsCard.getByText("Set 3: 50 reps")).toBeVisible();

  await legRaisesCard.locator('input[type="number"]').first().fill("10");
  await legRaisesCard.getByRole("button", { name: "Add set" }).click();
  await legRaisesCard.locator('input[type="number"]').nth(1).fill("10");
  await legRaisesCard.getByRole("button", { name: "Save logs" }).click();
  await expect(legRaisesCard.getByText("Set 2: 10 reps")).toBeVisible();

  const finishWorkoutButton = page.getByRole("button", { name: "Finish workout" });
  await expect(finishWorkoutButton).toBeEnabled();
  await finishWorkoutButton.click();

  await expect(page.getByText("This workout is completed.")).toBeVisible();
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

  await expect(pushupsCard.getByText("Current training step: Incline Push-ups")).toBeVisible();
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

  const pushupsCard = page.locator(".exercise-card").filter({
    hasText: "Push-ups"
  }).first();
  const legRaisesCard = page.locator(".exercise-card").filter({
    hasText: "Leg Raises"
  }).first();

  await pushupsCard.locator('input[type="number"]').first().fill("15");
  await pushupsCard.getByRole("button", { name: "Save logs" }).click();

  await expect(page.getByText("You can finish now, but 2 exercises are below the programmed minimum.")).toBeVisible();

  const finishWorkoutButton = page.getByRole("button", { name: "Finish workout" });
  await expect(finishWorkoutButton).toBeEnabled();
  await finishWorkoutButton.click();

  await expect(page.getByText("This workout is completed.")).toBeVisible();
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
