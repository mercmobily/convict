import {
  createWithTransaction,
  normalizeDbRecordId,
  resolveInsertedRecordId,
  resolveRepoClient
} from "@jskit-ai/database-runtime/shared";

const ACTIVE_ASSIGNMENT_STATUS = "active";

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

function normalizeDateOnly(value) {
  if (value == null || value === "") {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatLocalDateOnly(value);
  }

  const source = String(value).trim();
  if (!source) {
    return null;
  }

  const isoDateMatch = source.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoDateMatch) {
    return isoDateMatch[1];
  }

  const parsed = new Date(source);
  if (!Number.isNaN(parsed.getTime())) {
    return formatLocalDateOnly(parsed);
  }

  return source;
}

function mapAssignmentRow(row = {}) {
  return {
    id: normalizeDbRecordId(row.id, { fallback: null }),
    userId: normalizeDbRecordId(row.user_id, { fallback: null }),
    workspaceId: normalizeDbRecordId(row.workspace_id, { fallback: null }),
    startsOn: normalizeDateOnly(row.starts_on) || "",
    endsOn: normalizeDateOnly(row.ends_on),
    status: String(row.status || "").trim().toLowerCase(),
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null
  };
}

function mapRevisionRow(row = {}) {
  return {
    id: normalizeDbRecordId(row.id, { fallback: null }),
    userProgramAssignmentId: normalizeDbRecordId(row.user_program_assignment_id, { fallback: null }),
    programId: normalizeDbRecordId(row.program_id, { fallback: null }),
    effectiveFromDate: normalizeDateOnly(row.effective_from_date) || "",
    changeReason: String(row.change_reason || "").trim().toLowerCase(),
    notes: row.notes == null ? "" : String(row.notes),
    createdAt: row.created_at || null
  };
}

function mapProgramRow(row = {}) {
  return {
    id: normalizeDbRecordId(row.id, { fallback: null }),
    slug: String(row.slug || "").trim(),
    name: String(row.name || "").trim(),
    description: row.description == null ? "" : String(row.description),
    visibility: String(row.visibility || "").trim().toLowerCase() || "private"
  };
}

function mapScheduleEntryRow(row = {}) {
  return {
    programId: normalizeDbRecordId(row.program_id, { fallback: null }),
    dayOfWeek: Number(row.day_of_week || 0),
    slotNumber: Number(row.slot_number || 0),
    exerciseId: normalizeDbRecordId(row.exercise_id, { fallback: null }),
    exerciseName: String(row.exercise_name || "").trim(),
    workSetsMin: Number(row.work_sets_min || 0),
    workSetsMax: Number(row.work_sets_max || 0)
  };
}

function mapOccurrenceRow(row = {}) {
  return {
    id: normalizeDbRecordId(row.id, { fallback: null }),
    userId: normalizeDbRecordId(row.user_id, { fallback: null }),
    userProgramAssignmentId: normalizeDbRecordId(row.user_program_assignment_id, { fallback: null }),
    userProgramAssignmentRevisionId: normalizeDbRecordId(row.user_program_assignment_revision_id, { fallback: null }),
    workspaceId: normalizeDbRecordId(row.workspace_id, { fallback: null }),
    scheduledForDate: normalizeDateOnly(row.scheduled_for_date) || "",
    performedOnDate: normalizeDateOnly(row.performed_on_date),
    status: String(row.status || "").trim().toLowerCase(),
    startedAt: row.started_at || null,
    submittedAt: row.submitted_at || null,
    definitelyMissedAt: row.definitely_missed_at || null,
    notes: row.notes == null ? "" : String(row.notes),
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null
  };
}

function mapOccurrenceExerciseRow(row = {}) {
  return {
    id: normalizeDbRecordId(row.id, { fallback: null }),
    workoutOccurrenceId: normalizeDbRecordId(row.workout_occurrence_id, { fallback: null }),
    slotNumber: Number(row.slot_number || 0),
    exerciseId: normalizeDbRecordId(row.exercise_id, { fallback: null }),
    exerciseNameSnapshot: String(row.exercise_name_snapshot || "").trim(),
    canonicalStepId: normalizeDbRecordId(row.canonical_step_id, { fallback: null }),
    canonicalStepNameSnapshot: String(row.canonical_step_name_snapshot || "").trim(),
    personalStepVariationId: normalizeDbRecordId(row.personal_step_variation_id, { fallback: null }),
    variationNameSnapshot: row.variation_name_snapshot == null ? null : String(row.variation_name_snapshot).trim(),
    measurementUnitSnapshot: String(row.measurement_unit_snapshot || "").trim().toLowerCase(),
    plannedWorkSetsMin: Number(row.planned_work_sets_min || 0),
    plannedWorkSetsMax: Number(row.planned_work_sets_max || 0),
    progressionSetsSnapshot: row.progression_sets_snapshot == null ? null : Number(row.progression_sets_snapshot),
    progressionRepsMinSnapshot: row.progression_reps_min_snapshot == null ? null : Number(row.progression_reps_min_snapshot),
    progressionRepsMaxSnapshot: row.progression_reps_max_snapshot == null ? null : Number(row.progression_reps_max_snapshot),
    progressionSecondsSnapshot: row.progression_seconds_snapshot == null ? null : Number(row.progression_seconds_snapshot),
    status: String(row.status || "").trim().toLowerCase(),
    notes: row.notes == null ? "" : String(row.notes),
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null
  };
}

function mapSetLogRow(row = {}) {
  return {
    id: normalizeDbRecordId(row.id, { fallback: null }),
    workoutOccurrenceExerciseId: normalizeDbRecordId(row.workout_occurrence_exercise_id, { fallback: null }),
    setNumber: Number(row.set_number || 0),
    side: String(row.side || "").trim().toLowerCase() || "both",
    measurementUnitSnapshot: String(row.measurement_unit_snapshot || "").trim().toLowerCase(),
    performedValue: row.performed_value == null ? null : Number(row.performed_value),
    qualifiesForProgression: Boolean(Number(row.qualifies_for_progression || 0)),
    loggedAt: row.logged_at || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null
  };
}

function mapStepRow(row = {}) {
  return {
    id: normalizeDbRecordId(row.id, { fallback: null }),
    exerciseId: normalizeDbRecordId(row.exercise_id, { fallback: null }),
    stepNumber: Number(row.step_number || 0),
    stepName: String(row.step_name || "").trim(),
    instructionText: row.instruction_text == null ? "" : String(row.instruction_text).trim(),
    measurementUnit: String(row.measurement_unit || "").trim().toLowerCase(),
    progressionSets: row.progression_sets == null ? null : Number(row.progression_sets),
    progressionRepsMin: row.progression_reps_min == null ? null : Number(row.progression_reps_min),
    progressionRepsMax: row.progression_reps_max == null ? null : Number(row.progression_reps_max),
    progressionSeconds: row.progression_seconds == null ? null : Number(row.progression_seconds)
  };
}

function mapProgressRow(row = {}) {
  return {
    id: normalizeDbRecordId(row.id, { fallback: null }),
    userId: normalizeDbRecordId(row.user_id, { fallback: null }),
    exerciseId: normalizeDbRecordId(row.exercise_id, { fallback: null }),
    currentStepId: normalizeDbRecordId(row.current_step_id, { fallback: null }),
    readyToAdvanceStepId: normalizeDbRecordId(row.ready_to_advance_step_id, { fallback: null }),
    activeVariationId: normalizeDbRecordId(row.active_variation_id, { fallback: null }),
    readyToAdvanceAt: row.ready_to_advance_at || null,
    currentStep: {
      id: normalizeDbRecordId(row.current_step_id, { fallback: null }),
      exerciseId: normalizeDbRecordId(row.exercise_id, { fallback: null }),
      stepNumber: Number(row.current_step_number || 0),
      stepName: String(row.current_step_name || "").trim(),
      instructionText: row.current_step_instruction_text == null ? "" : String(row.current_step_instruction_text).trim(),
      measurementUnit: String(row.current_step_measurement_unit || "").trim().toLowerCase(),
      progressionSets: row.current_step_progression_sets == null ? null : Number(row.current_step_progression_sets),
      progressionRepsMin: row.current_step_progression_reps_min == null ? null : Number(row.current_step_progression_reps_min),
      progressionRepsMax: row.current_step_progression_reps_max == null ? null : Number(row.current_step_progression_reps_max),
      progressionSeconds: row.current_step_progression_seconds == null ? null : Number(row.current_step_progression_seconds)
    },
    activeVariation: row.active_variation_id
      ? {
          id: normalizeDbRecordId(row.active_variation_id, { fallback: null }),
          name: String(row.active_variation_name || "").trim(),
          measurementUnit: String(row.active_variation_measurement_unit || "").trim().toLowerCase()
        }
      : null
  };
}

function buildOccurrenceUpdateFields(fields = {}) {
  const updateFields = {};

  if (Object.hasOwn(fields, "workspaceId")) {
    updateFields.workspace_id = normalizeDbRecordId(fields.workspaceId, { fallback: null });
  }
  if (Object.hasOwn(fields, "performedOnDate")) {
    updateFields.performed_on_date = fields.performedOnDate || null;
  }
  if (Object.hasOwn(fields, "status")) {
    updateFields.status = String(fields.status || "").trim().toLowerCase();
  }
  if (Object.hasOwn(fields, "startedAt")) {
    updateFields.started_at = fields.startedAt || null;
  }
  if (Object.hasOwn(fields, "submittedAt")) {
    updateFields.submitted_at = fields.submittedAt || null;
  }
  if (Object.hasOwn(fields, "definitelyMissedAt")) {
    updateFields.definitely_missed_at = fields.definitelyMissedAt || null;
  }
  if (Object.hasOwn(fields, "notes")) {
    updateFields.notes = fields.notes == null ? null : String(fields.notes);
  }

  return updateFields;
}

function buildOccurrenceExerciseUpdateFields(fields = {}) {
  const updateFields = {};

  if (Object.hasOwn(fields, "status")) {
    updateFields.status = String(fields.status || "").trim().toLowerCase();
  }
  if (Object.hasOwn(fields, "notes")) {
    updateFields.notes = fields.notes == null ? null : String(fields.notes);
  }

  return updateFields;
}

function buildExerciseProgressUpdateFields(fields = {}) {
  const updateFields = {};

  if (Object.hasOwn(fields, "currentStepId")) {
    updateFields.current_step_id = normalizeDbRecordId(fields.currentStepId, { fallback: null });
  }
  if (Object.hasOwn(fields, "readyToAdvanceStepId")) {
    updateFields.ready_to_advance_step_id = normalizeDbRecordId(fields.readyToAdvanceStepId, { fallback: null });
  }
  if (Object.hasOwn(fields, "activeVariationId")) {
    updateFields.active_variation_id = normalizeDbRecordId(fields.activeVariationId, { fallback: null });
  }
  if (Object.hasOwn(fields, "readyToAdvanceAt")) {
    updateFields.ready_to_advance_at = fields.readyToAdvanceAt || null;
  }
  if (Object.hasOwn(fields, "lastCompletedOccurrenceId")) {
    updateFields.last_completed_occurrence_id = normalizeDbRecordId(fields.lastCompletedOccurrenceId, { fallback: null });
  }
  if (Object.hasOwn(fields, "lastCompletedAt")) {
    updateFields.last_completed_at = fields.lastCompletedAt || null;
  }
  if (Object.hasOwn(fields, "stallCount")) {
    updateFields.stall_count = Number(fields.stallCount || 0);
  }

  return updateFields;
}

function createRepository({ knex } = {}) {
  if (!knex) {
    throw new TypeError("createRepository requires knex.");
  }

  const withTransaction = createWithTransaction(knex);

  return Object.freeze({
    withTransaction,
    async findActiveAssignmentByUserId(userId, options = {}) {
      const normalizedUserId = normalizeDbRecordId(userId, { fallback: null });
      if (!normalizedUserId) {
        return null;
      }

      const db = resolveRepoClient(knex, options);
      const row = await db("user_program_assignments")
        .select("id", "user_id", "workspace_id", "starts_on", "ends_on", "status", "created_at", "updated_at")
        .where({
          user_id: normalizedUserId,
          status: ACTIVE_ASSIGNMENT_STATUS
        })
        .orderBy("created_at", "desc")
        .first();

      return row ? mapAssignmentRow(row) : null;
    },
    async listAssignmentRevisions(userProgramAssignmentId, options = {}) {
      const normalizedAssignmentId = normalizeDbRecordId(userProgramAssignmentId, { fallback: null });
      if (!normalizedAssignmentId) {
        return [];
      }

      const db = resolveRepoClient(knex, options);
      const rows = await db("user_program_assignment_revisions")
        .select("id", "user_program_assignment_id", "program_id", "effective_from_date", "change_reason", "notes", "created_at")
        .where("user_program_assignment_id", normalizedAssignmentId)
        .orderBy("effective_from_date", "asc")
        .orderBy("created_at", "asc");

      return rows.map(mapRevisionRow);
    },
    async listProgramsByIds(programIds = [], options = {}) {
      const normalizedIds = programIds
        .map((entry) => normalizeDbRecordId(entry, { fallback: null }))
        .filter(Boolean);
      if (normalizedIds.length < 1) {
        return [];
      }

      const db = resolveRepoClient(knex, options);
      const rows = await db("programs")
        .select("id", "slug", "name", "description", "visibility")
        .whereIn("id", normalizedIds);

      return rows.map(mapProgramRow);
    },
    async listScheduleEntriesForProgramIds(programIds = [], options = {}) {
      const normalizedIds = programIds
        .map((entry) => normalizeDbRecordId(entry, { fallback: null }))
        .filter(Boolean);
      if (normalizedIds.length < 1) {
        return [];
      }

      const db = resolveRepoClient(knex, options);
      const rows = await db("program_schedule_entries as pse")
        .select(
          "pse.program_id",
          "pse.day_of_week",
          "pse.slot_number",
          "pse.exercise_id",
          "pse.work_sets_min",
          "pse.work_sets_max",
          "e.name as exercise_name"
        )
        .join("exercises as e", "e.id", "pse.exercise_id")
        .whereIn("pse.program_id", normalizedIds)
        .orderBy("pse.program_id", "asc")
        .orderBy("pse.day_of_week", "asc")
        .orderBy("pse.slot_number", "asc");

      return rows.map(mapScheduleEntryRow);
    },
    async listOccurrencesByAssignmentBetweenDates(userProgramAssignmentId, startDate, endDate, options = {}) {
      const normalizedAssignmentId = normalizeDbRecordId(userProgramAssignmentId, { fallback: null });
      if (!normalizedAssignmentId || !startDate || !endDate || startDate > endDate) {
        return [];
      }

      const db = resolveRepoClient(knex, options);
      const rows = await db("workout_occurrences")
        .select(
          "id",
          "user_id",
          "user_program_assignment_id",
          "user_program_assignment_revision_id",
          "workspace_id",
          "scheduled_for_date",
          "performed_on_date",
          "status",
          "started_at",
          "submitted_at",
          "definitely_missed_at",
          "notes",
          "created_at",
          "updated_at"
        )
        .where("user_program_assignment_id", normalizedAssignmentId)
        .whereBetween("scheduled_for_date", [startDate, endDate])
        .orderBy("scheduled_for_date", "asc");

      return rows.map(mapOccurrenceRow);
    },
    async findOccurrenceByAssignmentAndDate(userProgramAssignmentId, scheduledForDate, options = {}) {
      const normalizedAssignmentId = normalizeDbRecordId(userProgramAssignmentId, { fallback: null });
      if (!normalizedAssignmentId || !scheduledForDate) {
        return null;
      }

      const db = resolveRepoClient(knex, options);
      const row = await db("workout_occurrences")
        .select(
          "id",
          "user_id",
          "user_program_assignment_id",
          "user_program_assignment_revision_id",
          "workspace_id",
          "scheduled_for_date",
          "performed_on_date",
          "status",
          "started_at",
          "submitted_at",
          "definitely_missed_at",
          "notes",
          "created_at",
          "updated_at"
        )
        .where({
          user_program_assignment_id: normalizedAssignmentId,
          scheduled_for_date: scheduledForDate
        })
        .first();

      return row ? mapOccurrenceRow(row) : null;
    },
    async listOccurrenceExercisesByOccurrenceIds(occurrenceIds = [], options = {}) {
      const normalizedIds = occurrenceIds
        .map((entry) => normalizeDbRecordId(entry, { fallback: null }))
        .filter(Boolean);
      if (normalizedIds.length < 1) {
        return [];
      }

      const db = resolveRepoClient(knex, options);
      const rows = await db("workout_occurrence_exercises")
        .select(
          "id",
          "workout_occurrence_id",
          "slot_number",
          "exercise_id",
          "exercise_name_snapshot",
          "canonical_step_id",
          "canonical_step_name_snapshot",
          "personal_step_variation_id",
          "variation_name_snapshot",
          "measurement_unit_snapshot",
          "planned_work_sets_min",
          "planned_work_sets_max",
          "progression_sets_snapshot",
          "progression_reps_min_snapshot",
          "progression_reps_max_snapshot",
          "progression_seconds_snapshot",
          "status",
          "notes",
          "created_at",
          "updated_at"
        )
        .whereIn("workout_occurrence_id", normalizedIds)
        .orderBy("workout_occurrence_id", "asc")
        .orderBy("slot_number", "asc");

      return rows.map(mapOccurrenceExerciseRow);
    },
    async listSetLogsByOccurrenceExerciseIds(occurrenceExerciseIds = [], options = {}) {
      const normalizedIds = occurrenceExerciseIds
        .map((entry) => normalizeDbRecordId(entry, { fallback: null }))
        .filter(Boolean);
      if (normalizedIds.length < 1) {
        return [];
      }

      const db = resolveRepoClient(knex, options);
      const rows = await db("workout_set_logs")
        .select(
          "id",
          "workout_occurrence_exercise_id",
          "set_number",
          "side",
          "measurement_unit_snapshot",
          "performed_value",
          "qualifies_for_progression",
          "logged_at",
          "created_at",
          "updated_at"
        )
        .whereIn("workout_occurrence_exercise_id", normalizedIds)
        .orderBy("workout_occurrence_exercise_id", "asc")
        .orderBy("set_number", "asc")
        .orderBy("side", "asc")
        .orderBy("id", "asc");

      return rows.map(mapSetLogRow);
    },
    async listExerciseProgressByUserAndExerciseIds(userId, exerciseIds = [], options = {}) {
      const normalizedUserId = normalizeDbRecordId(userId, { fallback: null });
      const normalizedExerciseIds = exerciseIds
        .map((entry) => normalizeDbRecordId(entry, { fallback: null }))
        .filter(Boolean);
      if (!normalizedUserId || normalizedExerciseIds.length < 1) {
        return [];
      }

      const db = resolveRepoClient(knex, options);
      const rows = await db("user_exercise_progress as uep")
        .select(
          "uep.id",
          "uep.user_id",
          "uep.exercise_id",
          "uep.current_step_id",
          "uep.ready_to_advance_step_id",
          "uep.active_variation_id",
          "uep.ready_to_advance_at",
          "cs.step_number as current_step_number",
          "cs.step_name as current_step_name",
          "cs.instruction_text as current_step_instruction_text",
          "cs.measurement_unit as current_step_measurement_unit",
          "cs.progression_sets as current_step_progression_sets",
          "cs.progression_reps_min as current_step_progression_reps_min",
          "cs.progression_reps_max as current_step_progression_reps_max",
          "cs.progression_seconds as current_step_progression_seconds",
          "psv.name as active_variation_name",
          "psv.measurement_unit as active_variation_measurement_unit"
        )
        .join("exercise_steps as cs", "cs.id", "uep.current_step_id")
        .leftJoin("personal_step_variations as psv", "psv.id", "uep.active_variation_id")
        .where("uep.user_id", normalizedUserId)
        .whereIn("uep.exercise_id", normalizedExerciseIds);

      return rows.map(mapProgressRow);
    },
    async listFirstStepsByExerciseIds(exerciseIds = [], options = {}) {
      const normalizedExerciseIds = exerciseIds
        .map((entry) => normalizeDbRecordId(entry, { fallback: null }))
        .filter(Boolean);
      if (normalizedExerciseIds.length < 1) {
        return [];
      }

      const db = resolveRepoClient(knex, options);
      const rows = await db("exercise_steps")
        .select(
          "id",
          "exercise_id",
          "step_number",
          "step_name",
          "instruction_text",
          "measurement_unit",
          "progression_sets",
          "progression_reps_min",
          "progression_reps_max",
          "progression_seconds"
        )
        .whereIn("exercise_id", normalizedExerciseIds)
        .where("step_number", 1)
        .orderBy("exercise_id", "asc");

      return rows.map(mapStepRow);
    },
    async listStepsByIds(stepIds = [], options = {}) {
      const normalizedStepIds = stepIds
        .map((entry) => normalizeDbRecordId(entry, { fallback: null }))
        .filter(Boolean);
      if (normalizedStepIds.length < 1) {
        return [];
      }

      const db = resolveRepoClient(knex, options);
      const rows = await db("exercise_steps")
        .select(
          "id",
          "exercise_id",
          "step_number",
          "step_name",
          "instruction_text",
          "measurement_unit",
          "progression_sets",
          "progression_reps_min",
          "progression_reps_max",
          "progression_seconds"
        )
        .whereIn("id", normalizedStepIds)
        .orderBy("exercise_id", "asc")
        .orderBy("step_number", "asc");

      return rows.map(mapStepRow);
    },
    async listStepsByExerciseIds(exerciseIds = [], options = {}) {
      const normalizedExerciseIds = exerciseIds
        .map((entry) => normalizeDbRecordId(entry, { fallback: null }))
        .filter(Boolean);
      if (normalizedExerciseIds.length < 1) {
        return [];
      }

      const db = resolveRepoClient(knex, options);
      const rows = await db("exercise_steps")
        .select(
          "id",
          "exercise_id",
          "step_number",
          "step_name",
          "instruction_text",
          "measurement_unit",
          "progression_sets",
          "progression_reps_min",
          "progression_reps_max",
          "progression_seconds"
        )
        .whereIn("exercise_id", normalizedExerciseIds)
        .orderBy("exercise_id", "asc")
        .orderBy("step_number", "asc");

      return rows.map(mapStepRow);
    },
    async findWorkspaceById(workspaceId, options = {}) {
      const normalizedWorkspaceId = normalizeDbRecordId(workspaceId, { fallback: null });
      if (!normalizedWorkspaceId) {
        return null;
      }

      const db = resolveRepoClient(knex, options);
      const row = await db("workspaces")
        .select("id", "slug", "name")
        .where("id", normalizedWorkspaceId)
        .first();

      if (!row) {
        return null;
      }

      return {
        id: normalizeDbRecordId(row.id, { fallback: null }),
        slug: String(row.slug || "").trim(),
        name: String(row.name || "").trim()
      };
    },
    async createOccurrence(
      {
        userId,
        userProgramAssignmentId,
        userProgramAssignmentRevisionId,
        workspaceId = null,
        scheduledForDate,
        performedOnDate = null,
        status = "in_progress",
        startedAt = null,
        submittedAt = null,
        definitelyMissedAt = null,
        notes = null
      } = {},
      options = {}
    ) {
      const normalizedUserId = normalizeDbRecordId(userId, { fallback: null });
      const normalizedAssignmentId = normalizeDbRecordId(userProgramAssignmentId, { fallback: null });
      const normalizedRevisionId = normalizeDbRecordId(userProgramAssignmentRevisionId, { fallback: null });
      if (!normalizedUserId || !normalizedAssignmentId || !normalizedRevisionId || !scheduledForDate) {
        throw new TypeError("createOccurrence requires user, assignment, revision, and scheduled date.");
      }

      const db = resolveRepoClient(knex, options);
      const insertResult = await db("workout_occurrences").insert({
        user_id: normalizedUserId,
        user_program_assignment_id: normalizedAssignmentId,
        user_program_assignment_revision_id: normalizedRevisionId,
        workspace_id: normalizeDbRecordId(workspaceId, { fallback: null }),
        scheduled_for_date: scheduledForDate,
        performed_on_date: performedOnDate || null,
        status: String(status || "in_progress").trim().toLowerCase(),
        started_at: startedAt || null,
        submitted_at: submittedAt || null,
        definitely_missed_at: definitelyMissedAt || null,
        notes: notes == null ? null : String(notes)
      });

      return resolveInsertedRecordId(insertResult, { fallback: null });
    },
    async updateOccurrence(occurrenceId, fields = {}, options = {}) {
      const normalizedOccurrenceId = normalizeDbRecordId(occurrenceId, { fallback: null });
      if (!normalizedOccurrenceId) {
        throw new TypeError("updateOccurrence requires occurrence id.");
      }

      const updateFields = buildOccurrenceUpdateFields(fields);
      if (Object.keys(updateFields).length < 1) {
        return 0;
      }

      const db = resolveRepoClient(knex, options);
      return db("workout_occurrences")
        .where("id", normalizedOccurrenceId)
        .update(updateFields);
    },
    async createOccurrenceExercises(records = [], options = {}) {
      const normalizedRecords = Array.isArray(records) ? records : [];
      if (normalizedRecords.length < 1) {
        return 0;
      }

      const db = resolveRepoClient(knex, options);
      return db("workout_occurrence_exercises").insert(
        normalizedRecords.map((record) => ({
          workout_occurrence_id: normalizeDbRecordId(record.workoutOccurrenceId, { fallback: null }),
          slot_number: Number(record.slotNumber || 0),
          exercise_id: normalizeDbRecordId(record.exerciseId, { fallback: null }),
          exercise_name_snapshot: String(record.exerciseNameSnapshot || "").trim(),
          canonical_step_id: normalizeDbRecordId(record.canonicalStepId, { fallback: null }),
          canonical_step_name_snapshot: String(record.canonicalStepNameSnapshot || "").trim(),
          personal_step_variation_id: normalizeDbRecordId(record.personalStepVariationId, { fallback: null }),
          variation_name_snapshot: record.variationNameSnapshot == null ? null : String(record.variationNameSnapshot).trim(),
          measurement_unit_snapshot: String(record.measurementUnitSnapshot || "").trim().toLowerCase(),
          planned_work_sets_min: Number(record.plannedWorkSetsMin || 0),
          planned_work_sets_max: Number(record.plannedWorkSetsMax || 0),
          progression_sets_snapshot: record.progressionSetsSnapshot == null ? null : Number(record.progressionSetsSnapshot),
          progression_reps_min_snapshot: record.progressionRepsMinSnapshot == null ? null : Number(record.progressionRepsMinSnapshot),
          progression_reps_max_snapshot: record.progressionRepsMaxSnapshot == null ? null : Number(record.progressionRepsMaxSnapshot),
          progression_seconds_snapshot: record.progressionSecondsSnapshot == null ? null : Number(record.progressionSecondsSnapshot),
          status: String(record.status || "pending").trim().toLowerCase(),
          notes: record.notes == null ? null : String(record.notes)
        }))
      );
    },
    async updateOccurrenceExercise(occurrenceExerciseId, fields = {}, options = {}) {
      const normalizedOccurrenceExerciseId = normalizeDbRecordId(occurrenceExerciseId, { fallback: null });
      if (!normalizedOccurrenceExerciseId) {
        throw new TypeError("updateOccurrenceExercise requires occurrence exercise id.");
      }

      const updateFields = buildOccurrenceExerciseUpdateFields(fields);
      if (Object.keys(updateFields).length < 1) {
        return 0;
      }

      const db = resolveRepoClient(knex, options);
      return db("workout_occurrence_exercises")
        .where("id", normalizedOccurrenceExerciseId)
        .update(updateFields);
    },
    async replaceSetLogsForOccurrenceExercise(occurrenceExerciseId, records = [], options = {}) {
      const normalizedOccurrenceExerciseId = normalizeDbRecordId(occurrenceExerciseId, { fallback: null });
      if (!normalizedOccurrenceExerciseId) {
        throw new TypeError("replaceSetLogsForOccurrenceExercise requires occurrence exercise id.");
      }

      const normalizedRecords = Array.isArray(records) ? records : [];
      const db = resolveRepoClient(knex, options);

      await db("workout_set_logs")
        .where("workout_occurrence_exercise_id", normalizedOccurrenceExerciseId)
        .del();

      if (normalizedRecords.length < 1) {
        return 0;
      }

      return db("workout_set_logs").insert(
        normalizedRecords.map((record) => ({
          workout_occurrence_exercise_id: normalizedOccurrenceExerciseId,
          set_number: Number(record.setNumber || 0),
          side: String(record.side || "both").trim().toLowerCase(),
          measurement_unit_snapshot: String(record.measurementUnitSnapshot || "").trim().toLowerCase(),
          performed_value: record.performedValue == null ? null : Number(record.performedValue),
          qualifies_for_progression: record.qualifiesForProgression ? 1 : 0,
          logged_at: record.loggedAt || null
        }))
      );
    },
    async createExerciseProgress(
      {
        userId,
        exerciseId,
        currentStepId,
        readyToAdvanceStepId = null,
        activeVariationId = null,
        readyToAdvanceAt = null,
        lastCompletedOccurrenceId = null,
        lastCompletedAt = null,
        stallCount = 0
      } = {},
      options = {}
    ) {
      const normalizedUserId = normalizeDbRecordId(userId, { fallback: null });
      const normalizedExerciseId = normalizeDbRecordId(exerciseId, { fallback: null });
      const normalizedCurrentStepId = normalizeDbRecordId(currentStepId, { fallback: null });
      if (!normalizedUserId || !normalizedExerciseId || !normalizedCurrentStepId) {
        throw new TypeError("createExerciseProgress requires user, exercise, and current step ids.");
      }

      const db = resolveRepoClient(knex, options);
      const insertResult = await db("user_exercise_progress").insert({
        user_id: normalizedUserId,
        exercise_id: normalizedExerciseId,
        current_step_id: normalizedCurrentStepId,
        ready_to_advance_step_id: normalizeDbRecordId(readyToAdvanceStepId, { fallback: null }),
        active_variation_id: normalizeDbRecordId(activeVariationId, { fallback: null }),
        ready_to_advance_at: readyToAdvanceAt || null,
        last_completed_occurrence_id: normalizeDbRecordId(lastCompletedOccurrenceId, { fallback: null }),
        last_completed_at: lastCompletedAt || null,
        stall_count: Number(stallCount || 0)
      });

      return resolveInsertedRecordId(insertResult, { fallback: null });
    },
    async updateExerciseProgress(progressId, fields = {}, options = {}) {
      const normalizedProgressId = normalizeDbRecordId(progressId, { fallback: null });
      if (!normalizedProgressId) {
        throw new TypeError("updateExerciseProgress requires progress id.");
      }

      const updateFields = buildExerciseProgressUpdateFields(fields);
      if (Object.keys(updateFields).length < 1) {
        return 0;
      }

      const db = resolveRepoClient(knex, options);
      return db("user_exercise_progress")
        .where("id", normalizedProgressId)
        .update(updateFields);
    }
  });
}

export { createRepository };
