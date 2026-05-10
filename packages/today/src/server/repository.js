import {
  createJsonRestContext,
  extractJsonRestCollectionRows
} from "@jskit-ai/json-rest-api-core/server/jsonRestApiHost";
import { normalizeSimplifiedRow } from "@local/main/shared";

const ACTIVE_ASSIGNMENT_STATUS = "active";

function jsonRestContext(options = {}) {
  return createJsonRestContext(options?.context || null);
}

function transaction(options = {}) {
  return options?.trx || null;
}

function normalizeAssignmentRow(row = null) {
  return normalizeSimplifiedRow(row, {
    dateOnlyFields: ["startsOn", "endsOn"]
  });
}

function normalizeAssignmentRevisionRow(row = null) {
  return normalizeSimplifiedRow(row, {
    relationIds: {
      userProgramAssignmentId: "userProgramAssignment",
      programId: "program"
    },
    dateOnlyFields: ["effectiveFromDate"]
  });
}

function normalizeProgramScheduleEntryRow(row = null) {
  return normalizeSimplifiedRow(row, {
    relationIds: {
      programId: "program",
      progressionTrackId: "progressionTrack",
      exerciseId: "exercise"
    }
  });
}

function normalizeProgramRoutineRow(row = null) {
  return normalizeSimplifiedRow(row, {
    relationIds: {
      programId: "program",
      sourceRoutineId: "sourceRoutine"
    }
  });
}

function normalizeProgramRoutineEntryRow(row = null) {
  return normalizeSimplifiedRow(row, {
    relationIds: {
      programRoutineId: "programRoutine",
      exerciseId: "exercise"
    }
  });
}

function normalizeOccurrenceRow(row = null) {
  return normalizeSimplifiedRow(row, {
    relationIds: {
      userProgramAssignmentId: "userProgramAssignment",
      userProgramAssignmentRevisionId: "userProgramAssignmentRevision"
    },
    dateOnlyFields: ["scheduledForDate", "performedOnDate"]
  });
}

function normalizeOccurrenceExerciseRow(row = null) {
  return normalizeSimplifiedRow(row, {
    relationIds: {
      workoutOccurrenceId: "workoutOccurrence",
      programScheduleEntryId: "programScheduleEntry",
      programRoutineEntryId: "programRoutineEntry",
      progressionTrackId: "progressionTrack",
      progressionTrackStepId: "progressionTrackStep",
      exerciseId: "exercise"
    }
  });
}

function normalizeSetLogRow(row = null) {
  return normalizeSimplifiedRow(row, {
    relationIds: {
      workoutOccurrenceExerciseId: "workoutOccurrenceExercise"
    }
  });
}

function normalizeProgressionTrackProgressRow(row = null) {
  return normalizeSimplifiedRow(row, {
    relationIds: {
      progressionTrackId: "progressionTrack",
      currentProgressionTrackStepId: "currentProgressionTrackStep",
      readyToAdvanceProgressionTrackStepId: "readyToAdvanceProgressionTrackStep",
      lastCompletedOccurrenceId: "lastCompletedOccurrence"
    }
  });
}

function normalizeProgressionTrackStepRow(row = null) {
  return normalizeSimplifiedRow(row, {
    relationIds: {
      progressionTrackId: "progressionTrack",
      exerciseId: "exercise"
    }
  });
}

function createRepository({
  api,
  userProgressionTrackProgressRepository,
  workoutOccurrencesRepository,
  workoutOccurrenceExercisesRepository
} = {}) {
  const withTransaction = workoutOccurrencesRepository.withTransaction;

  return Object.freeze({
    withTransaction,

    async listActiveAssignmentsByUserId(userId, options = {}) {
      if (!userId) {
        return [];
      }

      return extractJsonRestCollectionRows(
        await api.resources.userProgramAssignments.query(
          {
            queryParams: {
              filters: {
                userId,
                status: ACTIVE_ASSIGNMENT_STATUS
              },
              sort: ["-createdAt"],
              page: {
                size: 128
              }
            },
            transaction: transaction(options),
            simplified: true
          },
          jsonRestContext(options)
        )
      ).map((row) => normalizeAssignmentRow(row)).filter(Boolean);
    },

    async listAssignmentRevisionsByAssignmentIds(userProgramAssignmentIds = [], options = {}) {
      const ids = Array.isArray(userProgramAssignmentIds) ? userProgramAssignmentIds.filter(Boolean) : [];
      if (ids.length < 1) {
        return [];
      }

      return extractJsonRestCollectionRows(
        await api.resources.userProgramAssignmentRevisions.query(
          {
            queryParams: {
              filters: {
                userProgramAssignmentIds: ids
              },
              include: ["userProgramAssignment", "program"],
              sort: ["userProgramAssignmentId", "effectiveFromDate", "createdAt"],
              page: {
                size: 512
              }
            },
            transaction: transaction(options),
            simplified: true
          },
          jsonRestContext(options)
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
                size: 512
              }
            },
            transaction: transaction(options),
            simplified: true
          },
          jsonRestContext(options)
        )
      );
    },

    async listExercisesByIds(exerciseIds = [], options = {}) {
      const ids = Array.isArray(exerciseIds) ? exerciseIds.filter(Boolean) : [];
      if (ids.length < 1) {
        return [];
      }

      return extractJsonRestCollectionRows(
        await api.resources.exercises.query(
          {
            queryParams: {
              filters: {
                ids
              },
              sort: ["name"],
              page: {
                size: 2048
              }
            },
            transaction: transaction(options),
            simplified: true
          },
          jsonRestContext(options)
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
              include: ["program", "progressionTrack", "exercise"],
              sort: ["programId", "dayOfWeek", "slotNumber"],
              page: {
                size: 1024
              }
            },
            transaction: transaction(options),
            simplified: true
          },
          jsonRestContext(options)
        )
      ).map((row) => normalizeProgramScheduleEntryRow(row)).filter(Boolean);
    },

    async listProgramRoutinesForProgramIds(programIds = [], options = {}) {
      const ids = Array.isArray(programIds) ? programIds.filter(Boolean) : [];
      if (ids.length < 1) {
        return [];
      }

      return extractJsonRestCollectionRows(
        await api.resources.programRoutines.query(
          {
            queryParams: {
              filters: {
                programIds: ids
              },
              include: ["program", "sourceRoutine"],
              sort: ["programId", "timing", "dayOfWeek", "slotNumber"],
              page: {
                size: 512
              }
            },
            transaction: transaction(options),
            simplified: true
          },
          jsonRestContext(options)
        )
      ).map((row) => normalizeProgramRoutineRow(row)).filter(Boolean);
    },

    async listProgramRoutineEntriesForRoutineIds(programRoutineIds = [], options = {}) {
      const ids = Array.isArray(programRoutineIds) ? programRoutineIds.filter(Boolean) : [];
      if (ids.length < 1) {
        return [];
      }

      return extractJsonRestCollectionRows(
        await api.resources.programRoutineEntries.query(
          {
            queryParams: {
              filters: {
                programRoutineIds: ids
              },
              include: ["programRoutine", "exercise"],
              sort: ["programRoutineId", "slotNumber"],
              page: {
                size: 1024
              }
            },
            transaction: transaction(options),
            simplified: true
          },
          jsonRestContext(options)
        )
      ).map((row) => normalizeProgramRoutineEntryRow(row)).filter(Boolean);
    },

    async listOccurrencesByAssignmentsBetweenDates(userProgramAssignmentIds = [], startDate, endDate, options = {}) {
      const ids = Array.isArray(userProgramAssignmentIds) ? userProgramAssignmentIds.filter(Boolean) : [];
      if (ids.length < 1 || !startDate || !endDate || startDate > endDate) {
        return [];
      }

      return extractJsonRestCollectionRows(
        await api.resources.workoutOccurrences.query(
          {
            queryParams: {
              filters: {
                userProgramAssignmentIds: ids,
                scheduledForDateRange: [startDate, endDate]
              },
              include: ["userProgramAssignment", "userProgramAssignmentRevision"],
              sort: ["scheduledForDate"],
              page: {
                size: 4096
              }
            },
            transaction: transaction(options),
            simplified: true
          },
          jsonRestContext(options)
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
                userProgramAssignmentId,
                scheduledForDateRange: [scheduledForDate, scheduledForDate]
              },
              include: ["userProgramAssignment", "userProgramAssignmentRevision"],
              sort: ["scheduledForDate", "createdAt"],
              page: {
                size: 1
              }
            },
            transaction: transaction(options),
            simplified: true
          },
          jsonRestContext(options)
        )
      ).map((row) => normalizeOccurrenceRow(row)).filter(Boolean);

      return rows[0] || null;
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
              include: [
                "workoutOccurrence",
                "exercise",
                "programScheduleEntry",
                "programRoutineEntry",
                "progressionTrack",
                "progressionTrackStep"
              ],
              sort: ["workoutOccurrenceId", "slotNumber"],
              page: {
                size: 4096
              }
            },
            transaction: transaction(options),
            simplified: true
          },
          jsonRestContext(options)
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
              sort: ["workoutOccurrenceExerciseId", "loggedAt", "id"],
              page: {
                size: 4096
              }
            },
            transaction: transaction(options),
            simplified: true
          },
          jsonRestContext(options)
        )
      ).map((row) => normalizeSetLogRow(row)).filter(Boolean);
    },

    async listProgressionTrackProgressByUserAndTrackIds(userId, progressionTrackIds = [], options = {}) {
      const ids = Array.isArray(progressionTrackIds) ? progressionTrackIds.filter(Boolean) : [];
      if (!userId || ids.length < 1) {
        return [];
      }

      return extractJsonRestCollectionRows(
        await api.resources.userProgressionTrackProgress.query(
          {
            queryParams: {
              filters: {
                userId,
                progressionTrackIds: ids
              },
              include: [
                "progressionTrack",
                "currentProgressionTrackStep",
                "readyToAdvanceProgressionTrackStep",
                "lastCompletedOccurrence"
              ],
              page: {
                size: 512
              }
            },
            transaction: transaction(options),
            simplified: true
          },
          jsonRestContext(options)
        )
      ).map((row) => normalizeProgressionTrackProgressRow(row)).filter(Boolean);
    },

    async listFirstStepsByTrackIds(progressionTrackIds = [], options = {}) {
      const ids = Array.isArray(progressionTrackIds) ? progressionTrackIds.filter(Boolean) : [];
      if (ids.length < 1) {
        return [];
      }

      return extractJsonRestCollectionRows(
        await api.resources.progressionTrackSteps.query(
          {
            queryParams: {
              filters: {
                progressionTrackIds: ids,
                stepNumber: 1
              },
              include: ["progressionTrack", "exercise"],
              sort: ["progressionTrackId", "stepNumber"],
              page: {
                size: 512
              }
            },
            transaction: transaction(options),
            simplified: true
          },
          jsonRestContext(options)
        )
      ).map((row) => normalizeProgressionTrackStepRow(row)).filter(Boolean);
    },

    async listStepsByIds(stepIds = [], options = {}) {
      const ids = Array.isArray(stepIds) ? stepIds.filter(Boolean) : [];
      if (ids.length < 1) {
        return [];
      }

      return extractJsonRestCollectionRows(
        await api.resources.progressionTrackSteps.query(
          {
            queryParams: {
              filters: {
                ids
              },
              include: ["progressionTrack", "exercise"],
              sort: ["progressionTrackId", "stepNumber"],
              page: {
                size: 2048
              }
            },
            transaction: transaction(options),
            simplified: true
          },
          jsonRestContext(options)
        )
      ).map((row) => normalizeProgressionTrackStepRow(row)).filter(Boolean);
    },

    async listStepsByTrackIds(progressionTrackIds = [], options = {}) {
      const ids = Array.isArray(progressionTrackIds) ? progressionTrackIds.filter(Boolean) : [];
      if (ids.length < 1) {
        return [];
      }

      return extractJsonRestCollectionRows(
        await api.resources.progressionTrackSteps.query(
          {
            queryParams: {
              filters: {
                progressionTrackIds: ids
              },
              include: ["progressionTrack", "exercise"],
              sort: ["progressionTrackId", "stepNumber"],
              page: {
                size: 2048
              }
            },
            transaction: transaction(options),
            simplified: true
          },
          jsonRestContext(options)
        )
      ).map((row) => normalizeProgressionTrackStepRow(row)).filter(Boolean);
    },

    async createOccurrence(
      {
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
      if (!userProgramAssignmentId || !userProgramAssignmentRevisionId || !scheduledForDate) {
        throw new TypeError("createOccurrence requires assignment, revision, and scheduled date.");
      }

      const document = await workoutOccurrencesRepository.createDocument(
        {
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
          trx: transaction(options),
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
        trx: transaction(options),
        context: options?.context || null
      });
    },

    async createOccurrenceExercises(records = [], options = {}) {
      const normalizedRecords = Array.isArray(records) ? records : [];
      for (const record of normalizedRecords) {
        await workoutOccurrenceExercisesRepository.createDocument(record, {
          trx: transaction(options),
          context: options?.context || null
        });
      }
      return normalizedRecords.length;
    },

    async updateOccurrenceExercise(occurrenceExerciseId, fields = {}, options = {}) {
      if (!occurrenceExerciseId) {
        throw new TypeError("updateOccurrenceExercise requires occurrence exercise id.");
      }
      return workoutOccurrenceExercisesRepository.patchDocumentById(occurrenceExerciseId, fields, {
        trx: transaction(options),
        context: options?.context || null
      });
    },

    async createProgressionTrackProgress(record = {}, options = {}) {
      const document = await userProgressionTrackProgressRepository.createDocument(record, {
        trx: transaction(options),
        context: options?.context || null
      });
      return document?.data?.id || null;
    },

    async updateProgressionTrackProgress(progressId, fields = {}, options = {}) {
      if (!progressId) {
        throw new TypeError("updateProgressionTrackProgress requires progress id.");
      }
      return userProgressionTrackProgressRepository.patchDocumentById(progressId, fields, {
        trx: transaction(options),
        context: options?.context || null
      });
    }
  });
}

export { createRepository };
