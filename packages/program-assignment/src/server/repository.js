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

function normalizeOwnedProgramRow(row = null) {
  return normalizeSimplifiedRow(row, {
    relationIds: {
      programTemplateId: "programTemplate"
    }
  });
}

function normalizeTemplateScheduleEntryRow(row = null) {
  return normalizeSimplifiedRow(row, {
    relationIds: {
      programTemplateId: "programTemplate",
      progressionTrackId: "progressionTrack",
      exerciseId: "exercise"
    }
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

function normalizeTemplateRoutineAssignmentRow(row = null) {
  return normalizeSimplifiedRow(row, {
    relationIds: {
      programTemplateId: "programTemplate",
      routineId: "routine"
    }
  });
}

function normalizeRoutineEntryRow(row = null) {
  return normalizeSimplifiedRow(row, {
    relationIds: {
      routineId: "routine",
      exerciseId: "exercise"
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
          include: ["programTemplate", "progressionTrack", "exercise"],
          sort: ["programTemplateId", "dayOfWeek", "slotNumber"],
          page: {
            size: 512
          }
        },
        transaction: transaction(options),
        simplified: true
      },
      jsonRestContext(options)
    )
  ).map((row) => normalizeTemplateScheduleEntryRow(row)).filter(Boolean);
}

function createRepository({
  api,
  programsRepository,
  programScheduleEntriesRepository,
  programRoutinesRepository,
  programRoutineEntriesRepository,
  userProgramAssignmentsRepository,
  userProgramAssignmentRevisionsRepository,
  userProgressionTrackProgressRepository
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
            transaction: transaction(options),
            simplified: true
          },
          jsonRestContext(options)
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
            transaction: transaction(options),
            simplified: true
          },
          jsonRestContext(options)
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

    async listTemplateRoutineAssignmentsForTemplateIds(programTemplateIds = [], options = {}) {
      const ids = Array.isArray(programTemplateIds) ? programTemplateIds.filter(Boolean) : [];
      if (ids.length < 1) {
        return [];
      }

      return extractJsonRestCollectionRows(
        await api.resources.programTemplateRoutineAssignments.query(
          {
            queryParams: {
              filters: {
                programTemplateIds: ids
              },
              include: ["programTemplate", "routine"],
              sort: ["programTemplateId", "timing", "dayOfWeek", "slotNumber"],
              page: {
                size: 256
              }
            },
            transaction: transaction(options),
            simplified: true
          },
          jsonRestContext(options)
        )
      ).map((row) => normalizeTemplateRoutineAssignmentRow(row)).filter(Boolean);
    },

    async listRoutineEntriesForRoutineIds(routineIds = [], options = {}) {
      const ids = Array.isArray(routineIds) ? routineIds.filter(Boolean) : [];
      if (ids.length < 1) {
        return [];
      }

      return extractJsonRestCollectionRows(
        await api.resources.routineEntries.query(
          {
            queryParams: {
              filters: {
                routineIds: ids
              },
              include: ["routine", "exercise"],
              sort: ["routineId", "slotNumber"],
              page: {
                size: 512
              }
            },
            transaction: transaction(options),
            simplified: true
          },
          jsonRestContext(options)
        )
      ).map((row) => normalizeRoutineEntryRow(row)).filter(Boolean);
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
            transaction: transaction(options),
            simplified: true
          },
          jsonRestContext(options)
        )
      ).map((row) => normalizeOwnedProgramRow(row)).filter(Boolean);

      return rows[0] || null;
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
                programId
              },
              include: ["program", "progressionTrack", "exercise"],
              sort: ["dayOfWeek", "slotNumber"],
              page: {
                size: 128
              }
            },
            transaction: transaction(options),
            simplified: true
          },
          jsonRestContext(options)
        )
      ).map((row) => normalizeProgramScheduleEntryRow(row)).filter(Boolean);
    },

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
            transaction: transaction(options),
            simplified: true
          },
          jsonRestContext(options)
        )
      ).map((row) => normalizeAssignmentRevisionRow(row)).filter(Boolean);

      return rows[0] || null;
    },

    async listProgressionTrackProgressByTrackIds(userId, progressionTrackIds = [], options = {}) {
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
              include: ["progressionTrack", "currentProgressionTrackStep", "readyToAdvanceProgressionTrackStep"],
              page: {
                size: 256
              }
            },
            transaction: transaction(options),
            simplified: true
          },
          jsonRestContext(options)
        )
      ).map((row) => normalizeProgressionTrackProgressRow(row)).filter(Boolean);
    },

    async listFirstTrackStepsByTrackIds(progressionTrackIds = [], options = {}) {
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
                size: 256
              }
            },
            transaction: transaction(options),
            simplified: true
          },
          jsonRestContext(options)
        )
      ).map((row) => normalizeProgressionTrackStepRow(row)).filter(Boolean);
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
          trx: transaction(options),
          context: options?.context || null
        }
      );

      return document?.data?.id || null;
    },

    async createProgramScheduleEntries(records = [], options = {}) {
      const normalizedRecords = Array.isArray(records) ? records : [];
      for (const record of normalizedRecords) {
        await programScheduleEntriesRepository.createDocument(record, {
          trx: transaction(options),
          context: options?.context || null
        });
      }
      return normalizedRecords.length;
    },

    async createProgramRoutine(record = {}, options = {}) {
      const document = await programRoutinesRepository.createDocument(record, {
        trx: transaction(options),
        context: options?.context || null
      });
      return document?.data?.id || null;
    },

    async createProgramRoutineEntries(records = [], options = {}) {
      const normalizedRecords = Array.isArray(records) ? records : [];
      for (const record of normalizedRecords) {
        await programRoutineEntriesRepository.createDocument(record, {
          trx: transaction(options),
          context: options?.context || null
        });
      }
      return normalizedRecords.length;
    },

    async createAssignment({ startsOn, status = ACTIVE_ASSIGNMENT_STATUS } = {}, options = {}) {
      if (!startsOn) {
        throw new TypeError("createAssignment requires startsOn.");
      }

      const document = await userProgramAssignmentsRepository.createDocument(
        {
          startsOn,
          status: String(status || ACTIVE_ASSIGNMENT_STATUS).trim().toLowerCase()
        },
        {
          trx: transaction(options),
          context: options?.context || null
        }
      );

      return document?.data?.id || null;
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
      if (!userProgramAssignmentId || !programId || !effectiveFromDate) {
        throw new TypeError("createAssignmentRevision requires assignment id, program id, and effectiveFromDate.");
      }

      const document = await userProgramAssignmentRevisionsRepository.createDocument(
        {
          userProgramAssignmentId,
          programId,
          effectiveFromDate,
          changeReason: String(changeReason || "initial").trim().toLowerCase(),
          notes: notes == null ? null : String(notes)
        },
        {
          trx: transaction(options),
          context: options?.context || null
        }
      );

      return document?.data?.id || null;
    },

    async createProgressionTrackProgress(record = {}, options = {}) {
      const document = await userProgressionTrackProgressRepository.createDocument(record, {
        trx: transaction(options),
        context: options?.context || null
      });
      return document?.data?.id || null;
    }
  });
}

export { createRepository };
