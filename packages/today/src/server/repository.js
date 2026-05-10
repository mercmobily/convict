import {
  createJsonRestContext,
  extractJsonRestCollectionRows
} from "@jskit-ai/json-rest-api-core/server/jsonRestApiHost";
import { normalizeSimplifiedRow } from "@local/main/shared";

const ACTIVE_ASSIGNMENT_STATUS = "active";

function compactIds(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map((value) => String(value || "").trim()).filter(Boolean))];
}

function jsonRestContext(options = {}) {
  return createJsonRestContext(options?.context || null);
}

function transaction(options = {}) {
  return options?.trx || null;
}

function documentId(document = null) {
  return document?.data?.id ? String(document.data.id) : null;
}

async function queryRows(api, resourceName, queryParams = {}, options = {}, normalize = (row) => row) {
  const resource = api?.resources?.[resourceName];
  if (!resource || typeof resource.query !== "function") {
    throw new TypeError(`Missing JSON REST resource ${resourceName}.`);
  }

  return extractJsonRestCollectionRows(
    await resource.query(
      {
        queryParams,
        transaction: transaction(options),
        simplified: true
      },
      jsonRestContext(options)
    )
  ).map((row) => normalize(row)).filter(Boolean);
}

function normalizeAssignmentRow(row = null) {
  return normalizeSimplifiedRow(row, {
    dateOnlyFields: ["startsOn", "endsOn"]
  });
}

function normalizeAssignmentRevisionRow(row = null) {
  const normalized = normalizeSimplifiedRow(row, {
    relationIds: {
      programAssignmentId: "programAssignment",
      instanceProgramId: "instanceProgram"
    },
    dateOnlyFields: ["effectiveFromDate"]
  });
  if (!normalized) {
    return null;
  }

  return {
    ...normalized,
    programId: normalized.instanceProgramId,
    program: normalized.instanceProgram || null
  };
}

function normalizeProgramRow(row = null) {
  const normalized = normalizeSimplifiedRow(row, {
    relationIds: {
      sourceProgramId: "sourceProgram",
      sourceProgramVersionId: "sourceProgramVersion"
    }
  });
  if (!normalized) {
    return null;
  }

  return {
    ...normalized,
    slug: normalized.slug || normalized.sourceProgram?.slug || "",
    versionLabel: normalized.versionLabel || normalized.sourceProgramVersion?.versionLabel || ""
  };
}

function normalizeScheduleEntryRow(row = null) {
  const normalized = normalizeSimplifiedRow(row, {
    relationIds: {
      instanceProgramId: "instanceProgram",
      instanceProgressionId: "instanceProgression",
      exerciseId: "exercise"
    }
  });
  if (!normalized) {
    return null;
  }

  return {
    ...normalized,
    programId: normalized.instanceProgramId,
    progressionTrackId: normalized.instanceProgressionId,
    progressionTrack: normalized.instanceProgression || null
  };
}

function normalizeProgramRoutineRow(row = null) {
  const normalized = normalizeSimplifiedRow(row, {
    relationIds: {
      instanceProgramId: "instanceProgram",
      sourceRoutineId: "sourceRoutine"
    }
  });
  if (!normalized) {
    return null;
  }

  return {
    ...normalized,
    programId: normalized.instanceProgramId
  };
}

function normalizeProgramRoutineEntryRow(row = null) {
  const normalized = normalizeSimplifiedRow(row, {
    relationIds: {
      instanceProgramRoutineId: "instanceProgramRoutine",
      exerciseId: "exercise"
    }
  });
  if (!normalized) {
    return null;
  }

  return {
    ...normalized,
    programRoutineId: normalized.instanceProgramRoutineId
  };
}

function normalizeWorkoutRow(row = null) {
  const normalized = normalizeSimplifiedRow(row, {
    relationIds: {
      programAssignmentId: "programAssignment",
      programAssignmentRevisionId: "programAssignmentRevision"
    },
    dateOnlyFields: ["scheduledForDate", "performedOnDate"]
  });
  if (!normalized) {
    return null;
  }

  return {
    ...normalized
  };
}

function normalizeWorkoutExerciseRow(row = null) {
  const normalized = normalizeSimplifiedRow(row, {
    relationIds: {
      workoutId: "workout",
      instanceProgramEntryId: "instanceProgramEntry",
      instanceRoutineEntryId: "instanceRoutineEntry",
      instanceProgressionId: "instanceProgression",
      instanceProgressionEntryId: "instanceProgressionEntry",
      exerciseId: "exercise"
    }
  });
  if (!normalized) {
    return null;
  }

  return {
    ...normalized,
    workoutOccurrenceId: normalized.workoutId,
    programScheduleEntryId: normalized.instanceProgramEntryId,
    programRoutineEntryId: normalized.instanceRoutineEntryId,
    progressionTrackId: normalized.instanceProgressionId,
    progressionTrack: normalized.instanceProgression || null,
    progressionTrackStepId: normalized.instanceProgressionEntryId,
    progressionTrackStep: normalized.instanceProgressionEntry || null,
    progressionTrackNameSnapshot: normalized.progressionNameSnapshot || null,
    occurrenceExerciseId: normalized.id
  };
}

function normalizeSetLogRow(row = null) {
  const normalized = normalizeSimplifiedRow(row, {
    relationIds: {
      workoutExerciseId: "workoutExercise"
    }
  });
  if (!normalized) {
    return null;
  }

  return {
    ...normalized,
    workoutOccurrenceExerciseId: normalized.workoutExerciseId,
    occurrenceExerciseId: normalized.workoutExerciseId
  };
}

function normalizeProgressionRow(row = null) {
  const normalized = normalizeSimplifiedRow(row, {
    relationIds: {
      programAssignmentId: "programAssignment",
      instanceProgressionId: "instanceProgression",
      currentInstanceProgressionEntryId: "currentInstanceProgressionEntry",
      readyToAdvanceInstanceProgressionEntryId: "readyToAdvanceInstanceProgressionEntry",
      lastCompletedWorkoutId: "lastCompletedWorkout"
    }
  });
  if (!normalized) {
    return null;
  }

  return {
    ...normalized,
    progressionTrackId: normalized.instanceProgressionId,
    progressionTrack: normalized.instanceProgression || null,
    currentProgressionTrackStepId: normalized.currentInstanceProgressionEntryId,
    currentProgressionTrackStep: normalized.currentInstanceProgressionEntry || null,
    readyToAdvanceProgressionTrackStepId: normalized.readyToAdvanceInstanceProgressionEntryId,
    readyToAdvanceProgressionTrackStep: normalized.readyToAdvanceInstanceProgressionEntry || null,
    lastCompletedOccurrenceId: normalized.lastCompletedWorkoutId,
    lastCompletedOccurrence: normalized.lastCompletedWorkout || null
  };
}

function normalizeStepRow(row = null) {
  const normalized = normalizeSimplifiedRow(row, {
    relationIds: {
      instanceProgressionId: "instanceProgression",
      sourceProgressionEntryId: "sourceProgressionEntry",
      exerciseId: "exercise"
    }
  });
  if (!normalized) {
    return null;
  }

  return {
    ...normalized,
    progressionTrackId: normalized.instanceProgressionId,
    progressionTrack: normalized.instanceProgression || null
  };
}

function translateWorkoutCreate(record = {}) {
  return {
    programAssignmentId: record.programAssignmentId,
    programAssignmentRevisionId: record.programAssignmentRevisionId,
    scheduledForDate: record.scheduledForDate,
    performedOnDate: record.performedOnDate || null,
    status: String(record.status || "in_progress").trim().toLowerCase(),
    startedAt: record.startedAt || null,
    submittedAt: record.submittedAt || null,
    definitelyMissedAt: record.definitelyMissedAt || null,
    notes: record.notes == null ? null : String(record.notes)
  };
}

function translateWorkoutExerciseCreate(record = {}) {
  return {
    workoutId: record.workoutOccurrenceId || record.workoutId,
    slotNumber: Number(record.slotNumber || 0),
    section: record.section || "main",
    sourceKind: record.sourceKind || "instance_program_entry",
    instanceProgramEntryId: record.programScheduleEntryId || record.instanceProgramEntryId || null,
    instanceRoutineEntryId: record.programRoutineEntryId || record.instanceRoutineEntryId || null,
    instanceProgressionId: record.progressionTrackId || record.instanceProgressionId || null,
    instanceProgressionEntryId: record.progressionTrackStepId || record.instanceProgressionEntryId || null,
    exerciseId: record.exerciseId,
    exerciseNameSnapshot: record.exerciseNameSnapshot,
    progressionNameSnapshot: record.progressionTrackNameSnapshot || record.progressionNameSnapshot || null,
    progressionStepLabelSnapshot: record.progressionStepLabelSnapshot || null,
    measurementUnitSnapshot: record.measurementUnitSnapshot,
    plannedSetsMin: Number(record.plannedSetsMin || 0),
    plannedSetsMax: Number(record.plannedSetsMax || 0),
    targetRepsMinSnapshot: record.targetRepsMinSnapshot ?? null,
    targetRepsMaxSnapshot: record.targetRepsMaxSnapshot ?? null,
    targetSecondsSnapshot: record.targetSecondsSnapshot ?? null,
    progressionSetsSnapshot: record.progressionSetsSnapshot ?? null,
    progressionRepsMinSnapshot: record.progressionRepsMinSnapshot ?? null,
    progressionRepsMaxSnapshot: record.progressionRepsMaxSnapshot ?? null,
    progressionSecondsSnapshot: record.progressionSecondsSnapshot ?? null,
    restSecondsSnapshot: record.restSecondsSnapshot ?? null,
    notesSnapshot: record.notesSnapshot ?? null,
    status: record.status || "pending",
    notes: record.notes ?? null
  };
}

function translateProgressPatch(fields = {}) {
  const translated = { ...fields };
  if ("currentProgressionTrackStepId" in translated) {
    translated.currentInstanceProgressionEntryId = translated.currentProgressionTrackStepId;
    delete translated.currentProgressionTrackStepId;
  }
  if ("readyToAdvanceProgressionTrackStepId" in translated) {
    translated.readyToAdvanceInstanceProgressionEntryId = translated.readyToAdvanceProgressionTrackStepId;
    delete translated.readyToAdvanceProgressionTrackStepId;
  }
  if ("lastCompletedOccurrenceId" in translated) {
    translated.lastCompletedWorkoutId = translated.lastCompletedOccurrenceId;
    delete translated.lastCompletedOccurrenceId;
  }
  return translated;
}

function createRepository({
  api,
  userProgressionsRepository,
  workoutsRepository,
  workoutExercisesRepository
} = {}) {
  const withTransaction = workoutsRepository.withTransaction;

  return Object.freeze({
    withTransaction,

    async listActiveAssignmentsByUserId(userId, options = {}) {
      if (!userId) {
        return [];
      }

      return queryRows(
        api,
        "programAssignments",
        {
          filters: {
            status: ACTIVE_ASSIGNMENT_STATUS
          },
          sort: ["-createdAt"],
          page: {
            size: 128
          }
        },
        options,
        normalizeAssignmentRow
      );
    },

    async listAssignmentRevisionsByAssignmentIds(programAssignmentIds = [], options = {}) {
      const ids = compactIds(programAssignmentIds);
      if (ids.length < 1) {
        return [];
      }

      return queryRows(
        api,
        "programAssignmentRevisions",
        {
          filters: {
            programAssignmentIds: ids
          },
          include: ["programAssignment", "instanceProgram"],
          sort: ["programAssignmentId", "effectiveFromDate", "createdAt"],
          page: {
            size: 512
          }
        },
        options,
        normalizeAssignmentRevisionRow
      );
    },

    async listProgramsByIds(programIds = [], options = {}) {
      const ids = compactIds(programIds);
      if (ids.length < 1) {
        return [];
      }

      return queryRows(
        api,
        "instancePrograms",
        {
          filters: {
            ids
          },
          include: ["sourceProgram", "sourceProgramVersion"],
          sort: ["createdAt"],
          page: {
            size: 512
          }
        },
        options,
        normalizeProgramRow
      );
    },

    async listExercisesByIds(exerciseIds = [], options = {}) {
      const ids = compactIds(exerciseIds);
      if (ids.length < 1) {
        return [];
      }

      return queryRows(
        api,
        "exercises",
        {
          filters: {
            ids
          },
          sort: ["name"],
          page: {
            size: 2048
          }
        },
        options
      );
    },

    async listScheduleEntriesForProgramIds(programIds = [], options = {}) {
      const ids = compactIds(programIds);
      if (ids.length < 1) {
        return [];
      }

      return queryRows(
        api,
        "instanceProgramEntries",
        {
          filters: {
            instanceProgramIds: ids
          },
          include: ["instanceProgram", "instanceProgression", "exercise"],
          sort: ["instanceProgramId", "dayOfWeek", "slotNumber"],
          page: {
            size: 1024
          }
        },
        options,
        normalizeScheduleEntryRow
      );
    },

    async listProgramRoutinesForProgramIds(programIds = [], options = {}) {
      const ids = compactIds(programIds);
      if (ids.length < 1) {
        return [];
      }

      return queryRows(
        api,
        "instanceProgramRoutines",
        {
          filters: {
            instanceProgramIds: ids
          },
          include: ["instanceProgram", "sourceRoutine"],
          sort: ["instanceProgramId", "timing", "dayOfWeek", "slotNumber"],
          page: {
            size: 512
          }
        },
        options,
        normalizeProgramRoutineRow
      );
    },

    async listProgramRoutineEntriesForRoutineIds(programRoutineIds = [], options = {}) {
      const ids = compactIds(programRoutineIds);
      if (ids.length < 1) {
        return [];
      }

      return queryRows(
        api,
        "instanceRoutineEntries",
        {
          filters: {
            instanceProgramRoutineIds: ids
          },
          include: ["instanceProgramRoutine", "exercise"],
          sort: ["instanceProgramRoutineId", "slotNumber"],
          page: {
            size: 1024
          }
        },
        options,
        normalizeProgramRoutineEntryRow
      );
    },

    async listOccurrencesByAssignmentsBetweenDates(programAssignmentIds = [], startDate, endDate, options = {}) {
      const ids = compactIds(programAssignmentIds);
      if (ids.length < 1 || !startDate || !endDate || startDate > endDate) {
        return [];
      }

      return queryRows(
        api,
        "workouts",
        {
          filters: {
            programAssignmentIds: ids,
            scheduledForDateRange: [startDate, endDate]
          },
          include: ["programAssignment", "programAssignmentRevision"],
          sort: ["scheduledForDate"],
          page: {
            size: 4096
          }
        },
        options,
        normalizeWorkoutRow
      );
    },

    async findOccurrenceByAssignmentAndDate(programAssignmentId, scheduledForDate, options = {}) {
      if (!programAssignmentId || !scheduledForDate) {
        return null;
      }

      const rows = await queryRows(
        api,
        "workouts",
        {
          filters: {
            programAssignmentId,
            scheduledForDateRange: [scheduledForDate, scheduledForDate]
          },
          include: ["programAssignment", "programAssignmentRevision"],
          sort: ["scheduledForDate", "createdAt"],
          page: {
            size: 1
          }
        },
        options,
        normalizeWorkoutRow
      );

      return rows[0] || null;
    },

    async listOccurrenceExercisesByOccurrenceIds(occurrenceIds = [], options = {}) {
      const ids = compactIds(occurrenceIds);
      if (ids.length < 1) {
        return [];
      }

      return queryRows(
        api,
        "workoutExercises",
        {
          filters: {
            workoutIds: ids
          },
          include: [
            "workout",
            "exercise",
            "instanceProgramEntry",
            "instanceRoutineEntry",
            "instanceProgression",
            "instanceProgressionEntry"
          ],
          sort: ["workoutId", "slotNumber"],
          page: {
            size: 4096
          }
        },
        options,
        normalizeWorkoutExerciseRow
      );
    },

    async listSetLogsByOccurrenceExerciseIds(occurrenceExerciseIds = [], options = {}) {
      const ids = compactIds(occurrenceExerciseIds);
      if (ids.length < 1) {
        return [];
      }

      return queryRows(
        api,
        "workoutSets",
        {
          filters: {
            workoutExerciseIds: ids
          },
          include: ["workoutExercise"],
          sort: ["workoutExerciseId", "loggedAt", "id"],
          page: {
            size: 4096
          }
        },
        options,
        normalizeSetLogRow
      );
    },

    async listProgressionTrackProgressByUserAndTrackIds(userId, progressionTrackIds = [], options = {}) {
      const ids = compactIds(progressionTrackIds);
      if (!userId || ids.length < 1) {
        return [];
      }

      return queryRows(
        api,
        "userProgressions",
        {
          filters: {
            instanceProgressionIds: ids
          },
          include: [
            "instanceProgression",
            "currentInstanceProgressionEntry",
            "readyToAdvanceInstanceProgressionEntry",
            "lastCompletedWorkout"
          ],
          page: {
            size: 512
          }
        },
        options,
        normalizeProgressionRow
      );
    },

    async listFirstStepsByTrackIds(progressionTrackIds = [], options = {}) {
      const ids = compactIds(progressionTrackIds);
      if (ids.length < 1) {
        return [];
      }

      return queryRows(
        api,
        "instanceProgressionEntries",
        {
          filters: {
            instanceProgressionIds: ids,
            stepNumber: 1
          },
          include: ["instanceProgression", "exercise"],
          sort: ["instanceProgressionId", "stepNumber"],
          page: {
            size: 512
          }
        },
        options,
        normalizeStepRow
      );
    },

    async listStepsByIds(stepIds = [], options = {}) {
      const ids = compactIds(stepIds);
      if (ids.length < 1) {
        return [];
      }

      return queryRows(
        api,
        "instanceProgressionEntries",
        {
          filters: {
            ids
          },
          include: ["instanceProgression", "exercise"],
          sort: ["instanceProgressionId", "stepNumber"],
          page: {
            size: 2048
          }
        },
        options,
        normalizeStepRow
      );
    },

    async listStepsByTrackIds(progressionTrackIds = [], options = {}) {
      const ids = compactIds(progressionTrackIds);
      if (ids.length < 1) {
        return [];
      }

      return queryRows(
        api,
        "instanceProgressionEntries",
        {
          filters: {
            instanceProgressionIds: ids
          },
          include: ["instanceProgression", "exercise"],
          sort: ["instanceProgressionId", "stepNumber"],
          page: {
            size: 2048
          }
        },
        options,
        normalizeStepRow
      );
    },

    async createOccurrence(record = {}, options = {}) {
      const payload = translateWorkoutCreate(record);
      if (!payload.programAssignmentId || !payload.programAssignmentRevisionId || !payload.scheduledForDate) {
        throw new TypeError("createOccurrence requires assignment, revision, and scheduled date.");
      }

      return documentId(await workoutsRepository.createDocument(payload, {
        trx: transaction(options),
        context: options?.context || null
      }));
    },

    async updateOccurrence(occurrenceId, fields = {}, options = {}) {
      if (!occurrenceId) {
        throw new TypeError("updateOccurrence requires occurrence id.");
      }
      return workoutsRepository.patchDocumentById(occurrenceId, fields, {
        trx: transaction(options),
        context: options?.context || null
      });
    },

    async createOccurrenceExercises(records = [], options = {}) {
      const normalizedRecords = Array.isArray(records) ? records : [];
      for (const record of normalizedRecords) {
        await workoutExercisesRepository.createDocument(translateWorkoutExerciseCreate(record), {
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
      return workoutExercisesRepository.patchDocumentById(occurrenceExerciseId, fields, {
        trx: transaction(options),
        context: options?.context || null
      });
    },

    async createProgressionTrackProgress(record = {}, options = {}) {
      if (!record.programAssignmentId) {
        throw new TypeError("createProgressionTrackProgress requires programAssignmentId.");
      }

      return documentId(await userProgressionsRepository.createDocument(
        {
          programAssignmentId: record.programAssignmentId,
          instanceProgressionId: record.progressionTrackId,
          currentInstanceProgressionEntryId: record.currentProgressionTrackStepId,
          readyToAdvanceInstanceProgressionEntryId: record.readyToAdvanceProgressionTrackStepId || null,
          readyToAdvanceAt: record.readyToAdvanceAt || null,
          lastCompletedWorkoutId: record.lastCompletedOccurrenceId || null,
          lastCompletedAt: record.lastCompletedAt || null,
          stallCount: record.stallCount ?? 0,
          startedAt: record.startedAt || null
        },
        {
          trx: transaction(options),
          context: options?.context || null
        }
      ));
    },

    async updateProgressionTrackProgress(progressId, fields = {}, options = {}) {
      if (!progressId) {
        throw new TypeError("updateProgressionTrackProgress requires progress id.");
      }
      return userProgressionsRepository.patchDocumentById(progressId, translateProgressPatch(fields), {
        trx: transaction(options),
        context: options?.context || null
      });
    }
  });
}

export { createRepository };
