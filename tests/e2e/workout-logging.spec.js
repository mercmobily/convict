import "dotenv/config";
import mysql from "mysql2/promise";
import { test, expect } from "@playwright/test";

const DEV_USER_EMAIL = "slice3-playwright@convict.local";
const WORKSPACE_SLUG = "slice3-playwright";
const WORKSPACE_NAME = "Slice 3 Playwright";
const WEDNESDAY_DAY_OF_WEEK = 3;

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
        ["supermax"]
      );
      const programId = programRows?.[0]?.id || null;
      if (!programId) {
        throw new Error("Missing canonical 'supermax' program fixture.");
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
