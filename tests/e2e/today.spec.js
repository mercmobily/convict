import "dotenv/config";
import mysql from "mysql2/promise";
import { test, expect } from "@playwright/test";

const DEV_USER_EMAIL = "slice2-playwright@convict.local";
const WORKSPACE_SLUG = "slice2-playwright";
const WORKSPACE_NAME = "Slice 2 Playwright";
const SUPERMAX_SCHEDULE = Object.freeze({
  1: ["Pull-ups", "Squats"],
  2: ["Push-ups", "Leg Raises"],
  3: ["Handstand Push-ups", "Bridges"],
  4: ["Pull-ups", "Squats"],
  5: ["Push-ups", "Leg Raises"],
  6: ["Handstand Push-ups", "Bridges"],
  7: []
});

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

function normalizeDbDateOnly(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatLocalDateOnly(value);
  }

  const source = String(value).trim();
  const match = source.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : source;
}

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

      const [revisionInsertResult] = await connection.query(
        [
          "INSERT INTO user_program_assignment_revisions",
          "(user_program_assignment_id, program_id, effective_from_date, change_reason, notes)",
          "VALUES (?, ?, ?, ?, ?)"
        ].join(" "),
        [assignmentId, programId, startOn, "initial", null]
      );

      await connection.commit();

      return {
        userId: String(userId),
        workspaceId: String(workspaceId),
        assignmentId: String(assignmentId),
        revisionId: String(revisionInsertResult.insertId)
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } finally {
    await connection.end();
  }
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

test("active assignment shows today's projection and resolves overdue workouts", async ({ page }) => {
  const fixturePlan = buildTodayFixturePlan();
  const fixtureState = await ensureTodayFixture({
    email: DEV_USER_EMAIL,
    workspaceSlug: WORKSPACE_SLUG,
    workspaceName: WORKSPACE_NAME,
    startOn: fixturePlan.startOn
  });

  await devLoginAs(page, {
    email: DEV_USER_EMAIL
  });

  await page.goto(`/w/${WORKSPACE_SLUG}/`);

  const activeProgramCard = page.locator(".active-program-card");
  const todayCard = page.locator(".today-card");
  const overdueCard = page.locator(".overdue-card");
  await expect(page.getByRole("heading", { name: "Your active program" })).toBeVisible();
  await expect(activeProgramCard.getByText("Supermax").first()).toBeVisible();
  await expect(todayCard.getByRole("heading", { name: "Today", exact: true })).toBeVisible();
  await expect(overdueCard.getByRole("heading", { name: "Missed workouts", exact: true })).toBeVisible();

  const primaryOverdueCard = page.locator(".overdue-workout-card").filter({
    hasText: fixturePlan.primaryOverdueDate
  }).first();
  const secondaryOverdueCard = page.locator(".overdue-workout-card").filter({
    hasText: fixturePlan.secondaryOverdueDate
  }).first();

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

    await expect(page).toHaveURL(new RegExp(`/w/${WORKSPACE_SLUG}/workouts/${fixturePlan.todayDate}$`));
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
    await expect(todayCard.getByText("Today is a rest day")).toBeVisible();
  }

  await primaryOverdueCard.getByRole("button", { name: "Start overdue workout" }).click();

  await expect(page).toHaveURL(new RegExp(`/w/${WORKSPACE_SLUG}/workouts/${fixturePlan.primaryOverdueDate}$`));
  await expect(page.getByRole("button", { name: "Back to today" })).toBeVisible();

  const overdueOccurrence = await fetchOccurrence(fixtureState.userId, fixturePlan.primaryOverdueDate);
  expect(overdueOccurrence?.status).toBe("in_progress");
  expect(String(overdueOccurrence?.performedOnDate || "")).toContain(fixturePlan.todayDate);

  const overdueExerciseCount = await fetchOccurrenceExerciseCount(overdueOccurrence.id);
  expect(overdueExerciseCount).toBe(2);

  await page.getByRole("button", { name: "Back to today" }).click();
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible();
  await expect(
    primaryOverdueCard.getByText("This overdue workout is already open. Resume it to keep logging sets.")
  ).toBeVisible();

  await secondaryOverdueCard.getByRole("button", { name: "Mark definitely missed" }).click();

  await expect(page.getByRole("status").getByText("Workout marked definitely missed.")).toBeVisible();
  await expect(page.locator(".overdue-workout-card").filter({
    hasText: fixturePlan.secondaryOverdueDate
  })).toHaveCount(0);

  const missedOccurrence = await fetchOccurrence(fixtureState.userId, fixturePlan.secondaryOverdueDate);
  expect(missedOccurrence?.status).toBe("definitely_missed");
  expect(missedOccurrence?.performedOnDate).toBeNull();
});
