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
    "DELETE FROM workout_sets WHERE user_id = ?",
    [userId]
  );
  await connection.query(
    "DELETE FROM workout_exercises WHERE user_id = ?",
    [userId]
  );
  await connection.query(
    "DELETE FROM user_progressions WHERE user_id = ?",
    [userId]
  );
  await connection.query(
    "DELETE FROM workouts WHERE user_id = ?",
    [userId]
  );
  await connection.query(
    [
      "DELETE FROM program_assignment_revisions",
      "WHERE program_assignment_id IN (",
      "  SELECT id FROM program_assignments WHERE user_id = ?",
      ")"
    ].join(" "),
    [userId]
  );
  await connection.query(
    "DELETE FROM program_assignments WHERE user_id = ?",
    [userId]
  );
  await connection.query(
    "DELETE FROM instance_routine_entries WHERE user_id = ?",
    [userId]
  );
  await connection.query(
    "DELETE FROM instance_program_routines WHERE user_id = ?",
    [userId]
  );
  await connection.query(
    "DELETE FROM instance_program_entries WHERE user_id = ?",
    [userId]
  );
  await connection.query(
    "DELETE FROM instance_progression_entries WHERE user_id = ?",
    [userId]
  );
  await connection.query(
    "DELETE FROM instance_progressions WHERE user_id = ?",
    [userId]
  );
  await connection.query(
    "DELETE FROM instance_programs WHERE user_id = ?",
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
  const [programVersionRows] = await connection.query(
    [
      "SELECT",
      "  pv.id, pv.program_id AS programId, pv.version_label AS versionLabel, pv.name, pv.description,",
      "  p.slug AS programSlug, p.name AS programName, p.description AS programDescription",
      "FROM program_versions pv",
      "INNER JOIN programs p ON p.id = pv.program_id",
      "WHERE p.slug = ? AND pv.status = 'published'",
      "ORDER BY pv.version_number DESC, pv.id DESC",
      "LIMIT 1"
    ].join(" "),
    [programSlug]
  );
  const programVersion = programVersionRows?.[0] || null;
  if (!programVersion?.id) {
    throw new Error(`Missing published '${programSlug}' program fixture.`);
  }

  const [instanceProgramInsertResult] = await connection.query(
    [
      "INSERT INTO instance_programs",
      "(user_id, source_program_id, source_program_version_id, name, description, version_label)",
      "VALUES (?, ?, ?, ?, ?, ?)"
    ].join(" "),
    [
      userId,
      programVersion.programId,
      programVersion.id,
      programVersion.name || programVersion.programName,
      programVersion.description || programVersion.programDescription,
      programVersion.versionLabel
    ]
  );
  const instanceProgramId = instanceProgramInsertResult.insertId;

  const [sourceProgressionRows] = await connection.query(
    [
      "SELECT DISTINCT",
      "  p.id, p.slug, p.name, p.description, p.default_category_id AS defaultCategoryId,",
      "  p.source_key AS sourceKey, p.source_ref AS sourceRef, p.sort_order AS sortOrder",
      "FROM program_entries pe",
      "INNER JOIN progressions p ON p.id = pe.progression_id",
      "WHERE pe.program_version_id = ? AND pe.progression_id IS NOT NULL",
      "ORDER BY p.sort_order ASC, p.id ASC"
    ].join(" "),
    [programVersion.id]
  );

  const instanceProgressionIdsBySourceId = new Map();
  for (const sourceProgression of sourceProgressionRows) {
    const [insertResult] = await connection.query(
      [
        "INSERT INTO instance_progressions",
        "(",
        "  user_id, instance_program_id, source_progression_id, slug, name, description,",
        "  default_category_id, source_key, source_ref, sort_order",
        ")",
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ].join(" "),
      [
        userId,
        instanceProgramId,
        sourceProgression.id,
        sourceProgression.slug,
        sourceProgression.name,
        sourceProgression.description,
        sourceProgression.defaultCategoryId,
        sourceProgression.sourceKey,
        sourceProgression.sourceRef,
        sourceProgression.sortOrder
      ]
    );
    instanceProgressionIdsBySourceId.set(String(sourceProgression.id), insertResult.insertId);
  }

  const progressionIds = sourceProgressionRows.map((row) => row.id);
  const firstInstanceProgressionEntryIdsByProgressionId = new Map();
  if (progressionIds.length > 0) {
    const placeholders = progressionIds.map(() => "?").join(", ");
    const [sourceEntryRows] = await connection.query(
      [
        "SELECT",
        "  id, progression_id AS progressionId, exercise_id AS exerciseId, step_number AS stepNumber,",
        "  step_label AS stepLabel, instruction_text AS instructionText, measurement_unit AS measurementUnit,",
        "  beginner_sets AS beginnerSets, beginner_reps_min AS beginnerRepsMin,",
        "  beginner_reps_max AS beginnerRepsMax, beginner_seconds AS beginnerSeconds,",
        "  intermediate_sets AS intermediateSets, intermediate_reps_min AS intermediateRepsMin,",
        "  intermediate_reps_max AS intermediateRepsMax, intermediate_seconds AS intermediateSeconds,",
        "  progression_sets AS progressionSets, progression_reps_min AS progressionRepsMin,",
        "  progression_reps_max AS progressionRepsMax, progression_seconds AS progressionSeconds,",
        "  source_ref AS sourceRef",
        "FROM progression_entries",
        `WHERE progression_id IN (${placeholders})`,
        "ORDER BY progression_id ASC, step_number ASC, id ASC"
      ].join(" "),
      progressionIds
    );

    for (const sourceEntry of sourceEntryRows) {
      const instanceProgressionId = instanceProgressionIdsBySourceId.get(String(sourceEntry.progressionId));
      const [insertResult] = await connection.query(
        [
          "INSERT INTO instance_progression_entries",
          "(",
          "  user_id, instance_progression_id, source_progression_entry_id, exercise_id,",
          "  step_number, step_label, instruction_text, measurement_unit,",
          "  beginner_sets, beginner_reps_min, beginner_reps_max, beginner_seconds,",
          "  intermediate_sets, intermediate_reps_min, intermediate_reps_max, intermediate_seconds,",
          "  progression_sets, progression_reps_min, progression_reps_max, progression_seconds, source_ref",
          ")",
          "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ].join(" "),
        [
          userId,
          instanceProgressionId,
          sourceEntry.id,
          sourceEntry.exerciseId,
          sourceEntry.stepNumber,
          sourceEntry.stepLabel,
          sourceEntry.instructionText,
          sourceEntry.measurementUnit,
          sourceEntry.beginnerSets,
          sourceEntry.beginnerRepsMin,
          sourceEntry.beginnerRepsMax,
          sourceEntry.beginnerSeconds,
          sourceEntry.intermediateSets,
          sourceEntry.intermediateRepsMin,
          sourceEntry.intermediateRepsMax,
          sourceEntry.intermediateSeconds,
          sourceEntry.progressionSets,
          sourceEntry.progressionRepsMin,
          sourceEntry.progressionRepsMax,
          sourceEntry.progressionSeconds,
          sourceEntry.sourceRef
        ]
      );
      const progressionKey = String(sourceEntry.progressionId);
      if (!firstInstanceProgressionEntryIdsByProgressionId.has(progressionKey)) {
        firstInstanceProgressionEntryIdsByProgressionId.set(progressionKey, insertResult.insertId);
      }
    }
  }

  const [sourceProgramEntryRows] = await connection.query(
    [
      "SELECT",
      "  day_of_week AS dayOfWeek, slot_number AS slotNumber, entry_kind AS entryKind,",
      "  progression_id AS progressionId, exercise_id AS exerciseId,",
      "  work_sets_min AS workSetsMin, work_sets_max AS workSetsMax, measurement_unit AS measurementUnit,",
      "  target_reps_min AS targetRepsMin, target_reps_max AS targetRepsMax,",
      "  target_seconds AS targetSeconds, rest_seconds AS restSeconds, notes",
      "FROM program_entries",
      "WHERE program_version_id = ?",
      "ORDER BY day_of_week ASC, slot_number ASC, id ASC"
    ].join(" "),
    [programVersion.id]
  );

  for (const sourceProgramEntry of sourceProgramEntryRows) {
    await connection.query(
      [
        "INSERT INTO instance_program_entries",
        "(",
        "  user_id, instance_program_id, day_of_week, slot_number, entry_kind,",
        "  instance_progression_id, exercise_id, work_sets_min, work_sets_max, measurement_unit,",
        "  target_reps_min, target_reps_max, target_seconds, rest_seconds, notes",
        ")",
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ].join(" "),
      [
        userId,
        instanceProgramId,
        sourceProgramEntry.dayOfWeek,
        sourceProgramEntry.slotNumber,
        sourceProgramEntry.entryKind,
        sourceProgramEntry.progressionId
          ? instanceProgressionIdsBySourceId.get(String(sourceProgramEntry.progressionId))
          : null,
        sourceProgramEntry.exerciseId,
        sourceProgramEntry.workSetsMin,
        sourceProgramEntry.workSetsMax,
        sourceProgramEntry.measurementUnit,
        sourceProgramEntry.targetRepsMin,
        sourceProgramEntry.targetRepsMax,
        sourceProgramEntry.targetSeconds,
        sourceProgramEntry.restSeconds,
        sourceProgramEntry.notes
      ]
    );
  }

  const [sourceRoutineAssignmentRows] = await connection.query(
    [
      "SELECT",
      "  pr.routine_id AS routineId, pr.timing, pr.day_of_week AS dayOfWeek, pr.slot_number AS slotNumber,",
      "  r.name, r.description",
      "FROM program_routines pr",
      "INNER JOIN routines r ON r.id = pr.routine_id",
      "WHERE pr.program_version_id = ?",
      "ORDER BY pr.day_of_week ASC, pr.timing ASC, pr.slot_number ASC, pr.id ASC"
    ].join(" "),
    [programVersion.id]
  );

  for (const routineAssignment of sourceRoutineAssignmentRows) {
    const [instanceRoutineResult] = await connection.query(
      [
        "INSERT INTO instance_program_routines",
        "(",
        "  user_id, instance_program_id, source_routine_id, timing, day_of_week,",
        "  slot_number, name_snapshot, description_snapshot",
        ")",
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ].join(" "),
      [
        userId,
        instanceProgramId,
        routineAssignment.routineId,
        routineAssignment.timing,
        routineAssignment.dayOfWeek,
        routineAssignment.slotNumber,
        routineAssignment.name,
        routineAssignment.description
      ]
    );

    const [sourceRoutineEntryRows] = await connection.query(
      [
        "SELECT",
        "  re.exercise_id AS exerciseId, re.slot_number AS slotNumber, re.measurement_unit AS measurementUnit,",
        "  re.target_sets AS targetSets, re.target_reps_min AS targetRepsMin,",
        "  re.target_reps_max AS targetRepsMax, re.target_seconds AS targetSeconds,",
        "  re.rest_seconds AS restSeconds, re.notes, e.name AS exerciseName",
        "FROM routine_entries re",
        "INNER JOIN exercises e ON e.id = re.exercise_id",
        "WHERE re.routine_id = ?",
        "ORDER BY re.slot_number ASC, re.id ASC"
      ].join(" "),
      [routineAssignment.routineId]
    );

    for (const routineEntry of sourceRoutineEntryRows) {
      await connection.query(
        [
          "INSERT INTO instance_routine_entries",
          "(",
          "  user_id, instance_program_routine_id, exercise_id, slot_number, exercise_name_snapshot,",
          "  measurement_unit, target_sets, target_reps_min, target_reps_max, target_seconds, rest_seconds, notes",
          ")",
          "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ].join(" "),
        [
          userId,
          instanceRoutineResult.insertId,
          routineEntry.exerciseId,
          routineEntry.slotNumber,
          routineEntry.exerciseName,
          routineEntry.measurementUnit,
          routineEntry.targetSets,
          routineEntry.targetRepsMin,
          routineEntry.targetRepsMax,
          routineEntry.targetSeconds,
          routineEntry.restSeconds,
          routineEntry.notes
        ]
      );
    }
  }

  const [assignmentInsertResult] = await connection.query(
    [
      "INSERT INTO program_assignments (user_id, starts_on, status)",
      "VALUES (?, ?, ?)"
    ].join(" "),
    [userId, startOn, "active"]
  );
  const assignmentId = assignmentInsertResult.insertId;

  const [revisionInsertResult] = await connection.query(
    [
      "INSERT INTO program_assignment_revisions",
      "(program_assignment_id, user_id, instance_program_id, effective_from_date, change_reason, notes)",
      "VALUES (?, ?, ?, ?, ?, ?)"
    ].join(" "),
    [assignmentId, userId, instanceProgramId, startOn, "initial", null]
  );

  for (const sourceProgression of sourceProgressionRows) {
    const instanceProgressionId = instanceProgressionIdsBySourceId.get(String(sourceProgression.id));
    const currentEntryId = firstInstanceProgressionEntryIdsByProgressionId.get(String(sourceProgression.id));
    if (!instanceProgressionId || !currentEntryId) {
      continue;
    }

    await connection.query(
      [
        "INSERT INTO user_progressions",
        "(",
        "  user_id, program_assignment_id, instance_progression_id,",
        "  current_instance_progression_entry_id",
        ")",
        "VALUES (?, ?, ?, ?)"
      ].join(" "),
      [userId, assignmentId, instanceProgressionId, currentEntryId]
    );
  }

  return {
    programTemplate: programVersion,
    programVersion,
    programId: String(instanceProgramId),
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
