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

function normalizeOccurrenceRow(row = null) {
  if (!row || typeof row !== "object") {
    return null;
  }

  return {
    ...row,
    userProgramAssignmentId: readRelatedId(row, "userProgramAssignment", "userProgramAssignmentId"),
    userProgramAssignmentRevisionId: readRelatedId(row, "userProgramAssignmentRevision", "userProgramAssignmentRevisionId"),
    scheduledForDate: normalizeDateOnly(row.scheduledForDate),
    performedOnDate: normalizeDateOnly(row.performedOnDate)
  };
}

function normalizeOccurrenceExerciseRow(row = null) {
  if (!row || typeof row !== "object") {
    return null;
  }

  return {
    ...row,
    workoutOccurrenceId: readRelatedId(row, "workoutOccurrence", "workoutOccurrenceId"),
    exerciseId: readRelatedId(row, "exercise", "exerciseId"),
    canonicalStepId: readRelatedId(row, "canonicalStep", "canonicalStepId"),
    personalStepVariationId: readRelatedId(row, "personalStepVariation", "personalStepVariationId")
  };
}

function normalizeSetLogRow(row = null) {
  if (!row || typeof row !== "object") {
    return null;
  }

  return {
    ...row,
    workoutOccurrenceExerciseId: readRelatedId(row, "workoutOccurrenceExercise", "workoutOccurrenceExerciseId")
  };
}

function normalizeExerciseProgressRow(row = null) {
  if (!row || typeof row !== "object") {
    return null;
  }

  return {
    ...row,
    exerciseId: readRelatedId(row, "exercise", "exerciseId"),
    currentStepId: readRelatedId(row, "currentStep", "currentStepId"),
    readyToAdvanceStepId: readRelatedId(row, "readyToAdvanceStep", "readyToAdvanceStepId"),
    activeVariationId: readRelatedId(row, "activeVariation", "activeVariationId"),
    lastCompletedOccurrenceId: readRelatedId(row, "lastCompletedOccurrence", "lastCompletedOccurrenceId")
  };
}

function normalizeExerciseStepRow(row = null) {
  if (!row || typeof row !== "object") {
    return null;
  }

  return {
    ...row,
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

function createRepository({
  api,
  userExerciseProgressRepository,
  workoutOccurrencesRepository,
  workoutOccurrenceExercisesRepository,
  workoutSetLogsRepository
} = {}) {
  const withTransaction = workoutOccurrencesRepository.withTransaction;

  const repository = {
    withTransaction,
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
    async listAssignmentRevisions(userProgramAssignmentId, options = {}) {
      if (!userProgramAssignmentId) {
        return [];
      }

      return extractJsonRestCollectionRows(
        await api.resources.userProgramAssignmentRevisions.query(
          {
            queryParams: {
              filters: {
                userProgramAssignment: userProgramAssignmentId
              },
              include: ["userProgramAssignment", "program"],
              sort: ["effectiveFromDate", "createdAt"],
              page: {
                size: 256
              }
            },
            transaction: options?.trx || null,
            simplified: true
          },
          createJsonRestContext(options?.context || null)
        )
      ).map((row) => normalizeAssignmentRevisionRow(row)).filter(Boolean);
    },
    async listProgramsByIds(programIds = [], options = {}) {
      const ids = Array.isArray(programIds) ? programIds.filter(Boolean) : [];
      if (ids.length < 1) {
        return [];
      }

      return extractJsonRestCollectionRows(
        await api.resources.programs.query(
          {
            queryParams: {
              filters: {
                ids
              },
              sort: ["createdAt"],
              page: {
                size: 256
              }
            },
            transaction: options?.trx || null,
            simplified: true
          },
          createJsonRestContext(options?.context || null)
        )
      );
    },
    async listScheduleEntriesForProgramIds(programIds = [], options = {}) {
      const ids = Array.isArray(programIds) ? programIds.filter(Boolean) : [];
      if (ids.length < 1) {
        return [];
      }

      return extractJsonRestCollectionRows(
        await api.resources.programScheduleEntries.query(
          {
            queryParams: {
              filters: {
                programIds: ids
              },
              include: ["program", "exercise"],
              sort: ["programId", "dayOfWeek", "slotNumber"],
              page: {
                size: 512
              }
            },
            transaction: options?.trx || null,
            simplified: true
          },
          createJsonRestContext(options?.context || null)
        )
      ).map((row) => normalizeProgramScheduleEntryRow(row)).filter(Boolean);
    },
    async listOccurrencesByAssignmentBetweenDates(userProgramAssignmentId, startDate, endDate, options = {}) {
      if (!userProgramAssignmentId || !startDate || !endDate || startDate > endDate) {
        return [];
      }

      return extractJsonRestCollectionRows(
        await api.resources.workoutOccurrences.query(
          {
            queryParams: {
              filters: {
                userProgramAssignment: userProgramAssignmentId,
                scheduledForDateRange: [startDate, endDate]
              },
              include: ["userProgramAssignment", "userProgramAssignmentRevision"],
              sort: ["scheduledForDate"],
              page: {
                size: 4096
              }
            },
            transaction: options?.trx || null,
            simplified: true
          },
          createJsonRestContext(options?.context || null)
        )
      ).map((row) => normalizeOccurrenceRow(row)).filter(Boolean);
    },
    async findOccurrenceByAssignmentAndDate(userProgramAssignmentId, scheduledForDate, options = {}) {
      if (!userProgramAssignmentId || !scheduledForDate) {
        return null;
      }

      const rows = extractJsonRestCollectionRows(
        await api.resources.workoutOccurrences.query(
          {
            queryParams: {
              filters: {
                userProgramAssignment: userProgramAssignmentId,
                scheduledForDateRange: [scheduledForDate, scheduledForDate]
              },
              include: ["userProgramAssignment", "userProgramAssignmentRevision"],
              sort: ["scheduledForDate", "createdAt"],
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

      return normalizeOccurrenceRow(rows[0] || null);
    },
    async listOccurrenceExercisesByOccurrenceIds(occurrenceIds = [], options = {}) {
      const ids = Array.isArray(occurrenceIds) ? occurrenceIds.filter(Boolean) : [];
      if (ids.length < 1) {
        return [];
      }

      return extractJsonRestCollectionRows(
        await api.resources.workoutOccurrenceExercises.query(
          {
            queryParams: {
              filters: {
                workoutOccurrenceIds: ids
              },
              include: ["workoutOccurrence", "exercise", "canonicalStep", "personalStepVariation"],
              sort: ["workoutOccurrenceId", "slotNumber"],
              page: {
                size: 2048
              }
            },
            transaction: options?.trx || null,
            simplified: true
          },
          createJsonRestContext(options?.context || null)
        )
      ).map((row) => normalizeOccurrenceExerciseRow(row)).filter(Boolean);
    },
    async listSetLogsByOccurrenceExerciseIds(occurrenceExerciseIds = [], options = {}) {
      const ids = Array.isArray(occurrenceExerciseIds) ? occurrenceExerciseIds.filter(Boolean) : [];
      if (ids.length < 1) {
        return [];
      }

      return extractJsonRestCollectionRows(
        await api.resources.workoutSetLogs.query(
          {
            queryParams: {
              filters: {
                workoutOccurrenceExerciseIds: ids
              },
              include: ["workoutOccurrenceExercise"],
              sort: ["workoutOccurrenceExerciseId", "setNumber", "side", "id"],
              page: {
                size: 4096
              }
            },
            transaction: options?.trx || null,
            simplified: true
          },
          createJsonRestContext(options?.context || null)
        )
      ).map((row) => normalizeSetLogRow(row)).filter(Boolean);
    },
    async listExerciseProgressByUserAndExerciseIds(userId, exerciseIds = [], options = {}) {
      const ids = Array.isArray(exerciseIds) ? exerciseIds.filter(Boolean) : [];
      if (!userId || ids.length < 1) {
        return [];
      }

      return extractJsonRestCollectionRows(
        await api.resources.userExerciseProgress.query(
          {
            queryParams: {
              filters: {
                userId,
                exerciseIds: ids
              },
              include: ["exercise", "currentStep", "readyToAdvanceStep", "activeVariation", "lastCompletedOccurrence"],
              page: {
                size: 256
              }
            },
            transaction: options?.trx || null,
            simplified: true
          },
          createJsonRestContext(options?.context || null)
        )
      ).map((row) => normalizeExerciseProgressRow(row)).filter(Boolean);
    },
    async listFirstStepsByExerciseIds(exerciseIds = [], options = {}) {
      const ids = Array.isArray(exerciseIds) ? exerciseIds.filter(Boolean) : [];
      if (ids.length < 1) {
        return [];
      }

      return extractJsonRestCollectionRows(
        await api.resources.exerciseSteps.query(
          {
            queryParams: {
              filters: {
                exerciseIds: ids,
                stepNumber: 1
              },
              include: ["exercise"],
              sort: ["exerciseId"],
              page: {
                size: 256
              }
            },
            transaction: options?.trx || null,
            simplified: true
          },
          createJsonRestContext(options?.context || null)
        )
      ).map((row) => normalizeExerciseStepRow(row)).filter(Boolean);
    },
    async listStepsByIds(stepIds = [], options = {}) {
      const ids = Array.isArray(stepIds) ? stepIds.filter(Boolean) : [];
      if (ids.length < 1) {
        return [];
      }

      return extractJsonRestCollectionRows(
        await api.resources.exerciseSteps.query(
          {
            queryParams: {
              filters: {
                ids
              },
              include: ["exercise"],
              sort: ["exerciseId", "stepNumber"],
              page: {
                size: 2048
              }
            },
            transaction: options?.trx || null,
            simplified: true
          },
          createJsonRestContext(options?.context || null)
        )
      ).map((row) => normalizeExerciseStepRow(row)).filter(Boolean);
    },
    async listStepsByExerciseIds(exerciseIds = [], options = {}) {
      const ids = Array.isArray(exerciseIds) ? exerciseIds.filter(Boolean) : [];
      if (ids.length < 1) {
        return [];
      }

      return extractJsonRestCollectionRows(
        await api.resources.exerciseSteps.query(
          {
            queryParams: {
              filters: {
                exerciseIds: ids
              },
              include: ["exercise"],
              sort: ["exerciseId", "stepNumber"],
              page: {
                size: 2048
              }
            },
            transaction: options?.trx || null,
            simplified: true
          },
          createJsonRestContext(options?.context || null)
        )
      ).map((row) => normalizeExerciseStepRow(row)).filter(Boolean);
    },
    async createOccurrence(
      {
        userId,
        workspaceId = null,
        userProgramAssignmentId,
        userProgramAssignmentRevisionId,
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
      if (!userId || !userProgramAssignmentId || !userProgramAssignmentRevisionId || !scheduledForDate) {
        throw new TypeError("createOccurrence requires user, assignment, revision, and scheduled date.");
      }

      const document = await workoutOccurrencesRepository.createDocument(
        {
          workspaceId,
          userProgramAssignmentId,
          userProgramAssignmentRevisionId,
          scheduledForDate,
          performedOnDate: performedOnDate || null,
          status: String(status || "in_progress").trim().toLowerCase(),
          startedAt: startedAt || null,
          submittedAt: submittedAt || null,
          definitelyMissedAt: definitelyMissedAt || null,
          notes: notes == null ? null : String(notes)
        },
        {
          trx: options?.trx || null,
          context: options?.context || null
        }
      );

      return document?.data?.id || null;
    },
    async updateOccurrence(occurrenceId, fields = {}, options = {}) {
      if (!occurrenceId) {
        throw new TypeError("updateOccurrence requires occurrence id.");
      }
      return workoutOccurrencesRepository.patchDocumentById(occurrenceId, fields, {
        trx: options?.trx || null,
        context: options?.context || null
      });
    },
    async createOccurrenceExercises(records = [], options = {}) {
      const normalizedRecords = Array.isArray(records) ? records : [];
      if (normalizedRecords.length < 1) {
        return 0;
      }

      for (const record of normalizedRecords) {
        await workoutOccurrenceExercisesRepository.createDocument(
          record,
          {
            trx: options?.trx || null,
            context: options?.context || null
          }
        );
      }

      return normalizedRecords.length;
    },
    async updateOccurrenceExercise(occurrenceExerciseId, fields = {}, options = {}) {
      if (!occurrenceExerciseId) {
        throw new TypeError("updateOccurrenceExercise requires occurrence exercise id.");
      }
      return workoutOccurrenceExercisesRepository.patchDocumentById(occurrenceExerciseId, fields, {
        trx: options?.trx || null,
        context: options?.context || null
      });
    },
    async replaceSetLogsForOccurrenceExercise(occurrenceExerciseId, records = [], options = {}) {
      if (!occurrenceExerciseId) {
        throw new TypeError("replaceSetLogsForOccurrenceExercise requires occurrence exercise id.");
      }

      const normalizedRecords = Array.isArray(records) ? records : [];
      const existingRows = await repository.listSetLogsByOccurrenceExerciseIds([occurrenceExerciseId], options);
      for (const existingRow of existingRows) {
        await workoutSetLogsRepository.deleteDocumentById(existingRow.id, {
          trx: options?.trx || null,
          context: options?.context || null
        });
      }

      if (normalizedRecords.length < 1) {
        return 0;
      }

      for (const record of normalizedRecords) {
        await workoutSetLogsRepository.createDocument(
          {
            workoutOccurrenceExerciseId: occurrenceExerciseId,
            ...record
          },
          {
            trx: options?.trx || null,
            context: options?.context || null
          }
        );
      }

      return normalizedRecords.length;
    },
    async createExerciseProgress(
      {
        userId,
        workspaceId = null,
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
      if (!userId || !exerciseId || !currentStepId) {
        throw new TypeError("createExerciseProgress requires user, exercise, and current step ids.");
      }

      const document = await userExerciseProgressRepository.createDocument(
        {
          workspaceId,
          exerciseId,
          currentStepId,
          readyToAdvanceStepId,
          activeVariationId,
          readyToAdvanceAt: readyToAdvanceAt || null,
          lastCompletedOccurrenceId,
          lastCompletedAt: lastCompletedAt || null,
          stallCount
        },
        {
          trx: options?.trx || null,
          context: options?.context || null
        }
      );

      return document?.data?.id || null;
    },
    async updateExerciseProgress(progressId, fields = {}, options = {}) {
      if (!progressId) {
        throw new TypeError("updateExerciseProgress requires progress id.");
      }
      return userExerciseProgressRepository.patchDocumentById(progressId, fields, {
        trx: options?.trx || null,
        context: options?.context || null
      });
    }
  };

  return Object.freeze(repository);
}

export { createRepository };
