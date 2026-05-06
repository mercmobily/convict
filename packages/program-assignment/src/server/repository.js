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

function mapProgramRow(row = {}) {
  return {
    id: normalizeDbRecordId(row.id, { fallback: null }),
    slug: String(row.slug || "").trim(),
    name: String(row.name || "").trim(),
    description: row.description == null ? "" : String(row.description),
    visibility: String(row.visibility || "").trim().toLowerCase() || "private",
    createdByUserId: normalizeDbRecordId(row.created_by_user_id, { fallback: null }),
    forkedFromProgramId: normalizeDbRecordId(row.forked_from_program_id, { fallback: null })
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

function createRepository({ knex } = {}) {
  if (!knex) {
    throw new TypeError("createRepository requires knex.");
  }

  const withTransaction = createWithTransaction(knex);

  return Object.freeze({
    withTransaction,
    async listSelectablePrograms({ userId = null } = {}, options = {}) {
      const db = resolveRepoClient(knex, options);
      const rows = await db("programs")
        .select("id", "slug", "name", "description", "visibility", "created_by_user_id", "forked_from_program_id")
        .where((builder) => {
          builder.where("visibility", "system");
          if (userId) {
            builder.orWhere("created_by_user_id", userId);
          }
        })
        .orderByRaw(
          "FIELD(slug, 'new-blood', 'good-behavior', 'veterano', 'supermax') ASC, created_at ASC, id ASC"
        );

      return rows.map(mapProgramRow);
    },
    async findSelectableProgramById(programId, { userId = null } = {}, options = {}) {
      const normalizedProgramId = normalizeDbRecordId(programId, { fallback: null });
      if (!normalizedProgramId) {
        return null;
      }

      const db = resolveRepoClient(knex, options);
      const row = await db("programs")
        .select("id", "slug", "name", "description", "visibility", "created_by_user_id", "forked_from_program_id")
        .where("id", normalizedProgramId)
        .where((builder) => {
          builder.where("visibility", "system");
          if (userId) {
            builder.orWhere("created_by_user_id", userId);
          }
        })
        .first();

      return row ? mapProgramRow(row) : null;
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
    async findLatestRevisionByAssignmentId(userProgramAssignmentId, options = {}) {
      const normalizedAssignmentId = normalizeDbRecordId(userProgramAssignmentId, { fallback: null });
      if (!normalizedAssignmentId) {
        return null;
      }

      const db = resolveRepoClient(knex, options);
      const row = await db("user_program_assignment_revisions")
        .select("id", "user_program_assignment_id", "program_id", "effective_from_date", "change_reason", "notes", "created_at")
        .where("user_program_assignment_id", normalizedAssignmentId)
        .orderBy("effective_from_date", "desc")
        .orderBy("created_at", "desc")
        .first();

      return row ? mapRevisionRow(row) : null;
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
    async createAssignment({ userId, workspaceId = null, startsOn, status = ACTIVE_ASSIGNMENT_STATUS } = {}, options = {}) {
      const normalizedUserId = normalizeDbRecordId(userId, { fallback: null });
      if (!normalizedUserId || !startsOn) {
        throw new TypeError("createAssignment requires userId and startsOn.");
      }

      const db = resolveRepoClient(knex, options);
      const insertResult = await db("user_program_assignments").insert({
        user_id: normalizedUserId,
        workspace_id: normalizeDbRecordId(workspaceId, { fallback: null }),
        starts_on: startsOn,
        status: String(status || ACTIVE_ASSIGNMENT_STATUS).trim().toLowerCase()
      });

      return resolveInsertedRecordId(insertResult, { fallback: null });
    },
    async createAssignmentRevision(
      {
        userProgramAssignmentId,
        programId,
        effectiveFromDate,
        changeReason = "initial",
        notes = null
      } = {},
      options = {}
    ) {
      const normalizedAssignmentId = normalizeDbRecordId(userProgramAssignmentId, { fallback: null });
      const normalizedProgramId = normalizeDbRecordId(programId, { fallback: null });
      if (!normalizedAssignmentId || !normalizedProgramId || !effectiveFromDate) {
        throw new TypeError("createAssignmentRevision requires assignment id, program id, and effectiveFromDate.");
      }

      const db = resolveRepoClient(knex, options);
      const insertResult = await db("user_program_assignment_revisions").insert({
        user_program_assignment_id: normalizedAssignmentId,
        program_id: normalizedProgramId,
        effective_from_date: effectiveFromDate,
        change_reason: String(changeReason || "initial").trim().toLowerCase(),
        notes: notes == null ? null : String(notes)
      });

      return resolveInsertedRecordId(insertResult, { fallback: null });
    }
  });
}

export { createRepository };
