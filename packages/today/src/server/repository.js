import {
  compactIds,
  documentId,
  jsonRestContext,
  simplifiedRows,
  transaction
} from "@local/workflow-support/server/jsonRestWorkflow";
import { normalizeSimplifiedRow } from "@local/main/shared";

const ACTIVE_ASSIGNMENT_STATUS = "active";

async function queryRows(api, resourceName, queryParams = {}, options = {}, normalize = (row) => row) {
  const resource = api?.resources?.[resourceName];
  if (!resource || typeof resource.query !== "function") {
    throw new TypeError(`Missing JSON REST resource ${resourceName}.`);
  }

  return simplifiedRows(
    await resource.query(
      {
        queryParams,
        transaction: transaction(options),
        simplified: true
      },
      jsonRestContext(options)
    ),
    normalize
  );
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
    instanceProgram: normalized.instanceProgram || null
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
    instanceProgression: normalized.instanceProgression || null
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
    instanceProgram: normalized.instanceProgram || null
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

  return normalized;
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

  return normalized;
}

function normalizeWorkoutSetRow(row = null) {
  const normalized = normalizeSimplifiedRow(row, {
    relationIds: {
      workoutExerciseId: "workoutExercise"
    }
  });
  if (!normalized) {
    return null;
  }

  return normalized;
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

  return normalized;
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

  return normalized;
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
    workoutId: record.workoutId,
    slotNumber: Number(record.slotNumber || 0),
    section: record.section || "main",
    sourceKind: record.sourceKind || "instance_program_entry",
    instanceProgramEntryId: record.instanceProgramEntryId || null,
    instanceRoutineEntryId: record.instanceRoutineEntryId || null,
    instanceProgressionId: record.instanceProgressionId || null,
    instanceProgressionEntryId: record.instanceProgressionEntryId || null,
    exerciseId: record.exerciseId,
    exerciseNameSnapshot: record.exerciseNameSnapshot,
    progressionNameSnapshot: record.progressionNameSnapshot || null,
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
  return { ...fields };
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

    async listWorkoutsByAssignmentsBetweenDates(programAssignmentIds = [], startDate, endDate, options = {}) {
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

    async findWorkoutByAssignmentAndDate(programAssignmentId, scheduledForDate, options = {}) {
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

    async listWorkoutExercisesByWorkoutIds(workoutIds = [], options = {}) {
      const ids = compactIds(workoutIds);
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

    async listWorkoutSetsByWorkoutExerciseIds(workoutExerciseIds = [], options = {}) {
      const ids = compactIds(workoutExerciseIds);
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
        normalizeWorkoutSetRow
      );
    },

    async listUserProgressionsByInstanceProgressionIds(userId, instanceProgressionIds = [], options = {}) {
      const ids = compactIds(instanceProgressionIds);
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

    async listFirstProgressionEntriesByInstanceProgressionIds(instanceProgressionIds = [], options = {}) {
      const ids = compactIds(instanceProgressionIds);
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

    async listProgressionEntriesByInstanceProgressionIds(instanceProgressionIds = [], options = {}) {
      const ids = compactIds(instanceProgressionIds);
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

    async createWorkout(record = {}, options = {}) {
      const payload = translateWorkoutCreate(record);
      if (!payload.programAssignmentId || !payload.programAssignmentRevisionId || !payload.scheduledForDate) {
        throw new TypeError("createWorkout requires assignment, revision, and scheduled date.");
      }

      return documentId(await workoutsRepository.createDocument(payload, {
        trx: transaction(options),
        context: options?.context || null
      }));
    },

    async updateWorkout(workoutId, fields = {}, options = {}) {
      if (!workoutId) {
        throw new TypeError("updateWorkout requires workout id.");
      }
      return workoutsRepository.patchDocumentById(workoutId, fields, {
        trx: transaction(options),
        context: options?.context || null
      });
    },

    async createWorkoutExercises(records = [], options = {}) {
      const normalizedRecords = Array.isArray(records) ? records : [];
      for (const record of normalizedRecords) {
        await workoutExercisesRepository.createDocument(translateWorkoutExerciseCreate(record), {
          trx: transaction(options),
          context: options?.context || null
        });
      }
      return normalizedRecords.length;
    },

    async updateWorkoutExercise(workoutExerciseId, fields = {}, options = {}) {
      if (!workoutExerciseId) {
        throw new TypeError("updateWorkoutExercise requires workout exercise id.");
      }
      return workoutExercisesRepository.patchDocumentById(workoutExerciseId, fields, {
        trx: transaction(options),
        context: options?.context || null
      });
    },

    async createUserProgression(record = {}, options = {}) {
      if (!record.programAssignmentId) {
        throw new TypeError("createUserProgression requires programAssignmentId.");
      }

      return documentId(await userProgressionsRepository.createDocument(
        {
          programAssignmentId: record.programAssignmentId,
          instanceProgressionId: record.instanceProgressionId,
          currentInstanceProgressionEntryId: record.currentInstanceProgressionEntryId,
          readyToAdvanceInstanceProgressionEntryId: record.readyToAdvanceInstanceProgressionEntryId || null,
          readyToAdvanceAt: record.readyToAdvanceAt || null,
          lastCompletedWorkoutId: record.lastCompletedWorkoutId || null,
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

    async updateUserProgression(progressId, fields = {}, options = {}) {
      if (!progressId) {
        throw new TypeError("updateUserProgression requires progress id.");
      }
      return userProgressionsRepository.patchDocumentById(progressId, translateProgressPatch(fields), {
        trx: transaction(options),
        context: options?.context || null
      });
    }
  });
}

export { createRepository };
