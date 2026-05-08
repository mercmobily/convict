import "dotenv/config";
import mysql from "mysql2/promise";

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
  await connection.query(
    "DELETE FROM program_schedule_entries WHERE user_id = ?",
    [userId]
  );
  await connection.query(
    "DELETE FROM programs WHERE user_id = ?",
    [userId]
  );
}

async function ensureUserInTransaction(connection, { email, username, displayName }) {
  const authProvider = "supabase";
  const authProviderUserSid = `playwright-${username}`;

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

  return {
    userId
  };
}

async function withUserFixture({ email, username, displayName }, callback = async () => ({})) {
  const connection = await createDbConnection();

  try {
    await connection.beginTransaction();

    try {
      const baseState = await ensureUserInTransaction(connection, {
        email,
        username,
        displayName
      });

      await deleteUserTrainingRows(connection, baseState.userId);

      const result = await callback({
        connection,
        ...baseState
      });

      await connection.commit();

      return {
        userId: String(baseState.userId),
        ...(result || {})
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } finally {
    await connection.end();
  }
}

async function seedProgramCopyAssignment(
  connection,
  { userId, programSlug, startOn }
) {
  const [templateRows] = await connection.query(
    "SELECT id, name, description FROM program_templates WHERE slug = ? LIMIT 1",
    [programSlug]
  );
  const programTemplate = templateRows?.[0] || null;
  if (!programTemplate?.id) {
    throw new Error(`Missing canonical '${programSlug}' program template fixture.`);
  }

  const [programInsertResult] = await connection.query(
    [
      "INSERT INTO programs (user_id, program_template_id, name, description)",
      "VALUES (?, ?, ?, ?)"
    ].join(" "),
    [userId, programTemplate.id, programTemplate.name, programTemplate.description]
  );
  const programId = programInsertResult.insertId;

  await connection.query(
    [
      "INSERT INTO program_schedule_entries",
      "(user_id, program_id, day_of_week, slot_number, exercise_id, work_sets_min, work_sets_max)",
      "SELECT ?, ?, day_of_week, slot_number, exercise_id, work_sets_min, work_sets_max",
      "FROM program_template_schedule_entries",
      "WHERE program_template_id = ?"
    ].join(" "),
    [userId, programId, programTemplate.id]
  );

  const [assignmentInsertResult] = await connection.query(
    [
      "INSERT INTO user_program_assignments (user_id, starts_on, status)",
      "VALUES (?, ?, ?)"
    ].join(" "),
    [userId, startOn, "active"]
  );
  const assignmentId = assignmentInsertResult.insertId;

  const [revisionInsertResult] = await connection.query(
    [
      "INSERT INTO user_program_assignment_revisions",
      "(user_program_assignment_id, user_id, program_id, effective_from_date, change_reason, notes)",
      "VALUES (?, ?, ?, ?, ?, ?)"
    ].join(" "),
    [assignmentId, userId, programId, startOn, "initial", null]
  );

  return {
    programTemplate,
    programId: String(programId),
    assignmentId: String(assignmentId),
    revisionId: String(revisionInsertResult.insertId)
  };
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

export {
  addDays,
  createDbConnection,
  dayOfWeekFromDate,
  devLoginAs,
  findMostRecentPastDateForDayOfWeek,
  formatLocalDateOnly,
  normalizeDbDateOnly,
  seedProgramCopyAssignment,
  withUserFixture
};
