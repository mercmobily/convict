import {
  createJsonRestContext,
  extractJsonRestCollectionRows
} from "@jskit-ai/json-rest-api-core/server/jsonRestApiHost";
import { normalizeRecordId } from "@jskit-ai/kernel/shared/support/normalize";

const ACTIVE_ASSIGNMENT_STATUS = "active";

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

function normalizeDateOnly(value = null) {
  if (value == null || value === "") {
    return null;
  }

  const parsedDate = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return [
    parsedDate.getFullYear(),
    padDatePart(parsedDate.getMonth() + 1),
    padDatePart(parsedDate.getDate())
  ].join("-");
}

function readRelatedId(row = null, relationKey = "", fieldKey = "") {
  const directId = normalizeRecordId(row?.[fieldKey], { fallback: null });
  if (directId) {
    return directId;
  }

  return normalizeRecordId(row?.[relationKey]?.id, { fallback: null });
}

function normalizeTemplateScheduleEntryRow(row = null) {
  if (!row || typeof row !== "object") {
    return null;
  }

  return {
    ...row,
    programTemplateId: readRelatedId(row, "programTemplate", "programTemplateId"),
    exerciseId: readRelatedId(row, "exercise", "exerciseId")
  };
}

function normalizeOwnedProgramRow(row = null) {
  if (!row || typeof row !== "object") {
    return null;
  }

  return {
    ...row,
    programTemplateId: readRelatedId(row, "programTemplate", "programTemplateId")
  };
}

function normalizeAssignmentRevisionRow(row = null) {
  if (!row || typeof row !== "object") {
    return null;
  }

  return {
    ...row,
    userProgramAssignmentId: readRelatedId(row, "userProgramAssignment", "userProgramAssignmentId"),
    programId: readRelatedId(row, "program", "programId"),
    effectiveFromDate: normalizeDateOnly(row.effectiveFromDate)
  };
}

function normalizeProgramScheduleEntryRow(row = null) {
  if (!row || typeof row !== "object") {
    return null;
  }

  return {
    ...row,
    programId: readRelatedId(row, "program", "programId"),
    exerciseId: readRelatedId(row, "exercise", "exerciseId")
  };
}

function normalizeAssignmentRow(row = null) {
  if (!row || typeof row !== "object") {
    return null;
  }

  return {
    ...row,
    startsOn: normalizeDateOnly(row.startsOn),
    endsOn: normalizeDateOnly(row.endsOn)
  };
}

async function queryTemplateScheduleEntriesByTemplateIds(api, programTemplateIds = [], options = {}) {
  const ids = Array.isArray(programTemplateIds) ? programTemplateIds.filter(Boolean) : [];
  if (ids.length < 1) {
    return [];
  }

  return extractJsonRestCollectionRows(
    await api.resources.programTemplateScheduleEntries.query(
          {
        queryParams: {
          filters: {
            programTemplateIds: ids
          },
              include: ["programTemplate", "exercise"],
              sort: ["programTemplateId", "dayOfWeek", "slotNumber"],
              page: {
                size: 256
              }
        },
        transaction: options?.trx || null,
        simplified: true
      },
      createJsonRestContext(options?.context || null)
    )
  ).map((row) => normalizeTemplateScheduleEntryRow(row)).filter(Boolean);
}

function createRepository({
  api,
  programsRepository,
  programScheduleEntriesRepository,
  userProgramAssignmentsRepository,
  userProgramAssignmentRevisionsRepository
} = {}) {
  const withTransaction = userProgramAssignmentsRepository.withTransaction;

  return Object.freeze({
    withTransaction,
    async listProgramTemplates(options = {}) {
      return extractJsonRestCollectionRows(
        await api.resources.programTemplates.query(
          {
            queryParams: {
              sort: ["createdAt"],
              page: {
                size: 128
              }
            },
            transaction: options?.trx || null,
            simplified: true
          },
          createJsonRestContext(options?.context || null)
        )
      );
    },
    async findProgramTemplateById(programTemplateId, options = {}) {
      if (!programTemplateId) {
        return null;
      }

      const rows = extractJsonRestCollectionRows(
        await api.resources.programTemplates.query(
          {
            queryParams: {
              filters: {
                id: programTemplateId
              },
              page: {
                size: 1
              }
            },
            transaction: options?.trx || null,
            simplified: true
          },
          createJsonRestContext(options?.context || null)
        )
      );

      return rows[0] || null;
    },
    async listTemplateScheduleEntriesForTemplateIds(programTemplateIds = [], options = {}) {
      return queryTemplateScheduleEntriesByTemplateIds(api, programTemplateIds, options);
    },
    async listTemplateScheduleEntriesForTemplate(programTemplateId, options = {}) {
      return queryTemplateScheduleEntriesByTemplateIds(api, [programTemplateId], options);
    },
    async findOwnedProgramById(programId, options = {}) {
      if (!programId) {
        return null;
      }

      const rows = extractJsonRestCollectionRows(
        await api.resources.programs.query(
          {
            queryParams: {
              filters: {
                id: programId
              },
              include: ["programTemplate"],
              page: {
                size: 1
              }
            },
            transaction: options?.trx || null,
            simplified: true
          },
          createJsonRestContext(options?.context || null)
        )
      );

      return normalizeOwnedProgramRow(rows[0] || null);
    },
    async listScheduleEntriesForProgram(programId, options = {}) {
      if (!programId) {
        return [];
      }

      return extractJsonRestCollectionRows(
        await api.resources.programScheduleEntries.query(
          {
            queryParams: {
              filters: {
                program: programId
              },
              include: ["program", "exercise"],
              sort: ["dayOfWeek", "slotNumber"],
              page: {
                size: 64
              }
            },
            transaction: options?.trx || null,
            simplified: true
          },
          createJsonRestContext(options?.context || null)
        )
      ).map((row) => normalizeProgramScheduleEntryRow(row)).filter(Boolean);
    },
    async findActiveAssignmentByUserId(userId, options = {}) {
      if (!userId) {
        return null;
      }

      const rows = extractJsonRestCollectionRows(
        await api.resources.userProgramAssignments.query(
          {
            queryParams: {
              filters: {
                userId,
                status: ACTIVE_ASSIGNMENT_STATUS
              },
              sort: ["-createdAt"],
              page: {
                size: 1
              }
            },
            transaction: options?.trx || null,
            simplified: true
          },
          createJsonRestContext(options?.context || null)
        )
      );

      return normalizeAssignmentRow(rows[0] || null);
    },
    async findLatestRevisionByAssignmentId(userProgramAssignmentId, options = {}) {
      if (!userProgramAssignmentId) {
        return null;
      }

      const rows = extractJsonRestCollectionRows(
        await api.resources.userProgramAssignmentRevisions.query(
          {
            queryParams: {
              filters: {
                userProgramAssignment: userProgramAssignmentId
              },
              include: ["userProgramAssignment", "program"],
              sort: ["-effectiveFromDate", "-createdAt"],
              page: {
                size: 1
              }
            },
            transaction: options?.trx || null,
            simplified: true
          },
          createJsonRestContext(options?.context || null)
        )
      );

      return normalizeAssignmentRevisionRow(rows[0] || null);
    },
    async createProgramCopy({ programTemplateId = null, name, description = null } = {}, options = {}) {
      if (!name) {
        throw new TypeError("createProgramCopy requires a name.");
      }

      const document = await programsRepository.createDocument(
        {
          programTemplateId,
          name,
          description
        },
        {
          trx: options?.trx || null,
          context: options?.context || null
        }
      );

      return document?.data?.id || null;
    },
    async createProgramScheduleEntries(records = [], options = {}) {
      const normalizedRecords = Array.isArray(records) ? records : [];
      if (normalizedRecords.length < 1) {
        return 0;
      }

      for (const record of normalizedRecords) {
        await programScheduleEntriesRepository.createDocument(
          record,
          {
            trx: options?.trx || null,
            context: options?.context || null
          }
        );
      }

      return normalizedRecords.length;
    },
    async createAssignment({ workspaceId = null, startsOn, status = ACTIVE_ASSIGNMENT_STATUS } = {}, options = {}) {
      if (!startsOn) {
        throw new TypeError("createAssignment requires startsOn.");
      }

      const document = await userProgramAssignmentsRepository.createDocument(
        {
          workspaceId,
          startsOn,
          status: String(status || ACTIVE_ASSIGNMENT_STATUS).trim().toLowerCase()
        },
        {
          trx: options?.trx || null,
          context: options?.context || null
        }
      );

      return document?.data?.id || null;
    },
    async createAssignmentRevision(
      {
        userProgramAssignmentId,
        workspaceId = null,
        programId,
        effectiveFromDate,
        changeReason = "initial",
        notes = null
      } = {},
      options = {}
    ) {
      if (!userProgramAssignmentId || !programId || !effectiveFromDate) {
        throw new TypeError("createAssignmentRevision requires assignment id, program id, and effectiveFromDate.");
      }

      const document = await userProgramAssignmentRevisionsRepository.createDocument(
        {
          userProgramAssignmentId,
          workspaceId,
          programId,
          effectiveFromDate,
          changeReason: String(changeReason || "initial").trim().toLowerCase(),
          notes: notes == null ? null : String(notes)
        },
        {
          trx: options?.trx || null,
          context: options?.context || null
        }
      );

      return document?.data?.id || null;
    }
  });
}

export { createRepository };
