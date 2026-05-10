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

function normalizeCollectionRow(row = null) {
  return normalizeSimplifiedRow(row);
}

function normalizeSourceProgramRow(row = null) {
  return normalizeSimplifiedRow(row, {
    relationIds: {
      programCollectionId: "programCollection"
    }
  });
}

function normalizeProgramVersionRow(row = null) {
  return normalizeSimplifiedRow(row, {
    relationIds: {
      programId: "program"
    }
  });
}

function normalizeProgramEntryRow(row = null) {
  return normalizeSimplifiedRow(row, {
    relationIds: {
      programVersionId: "programVersion",
      progressionId: "progression",
      exerciseId: "exercise"
    }
  });
}

function normalizeProgramRoutineRow(row = null) {
  return normalizeSimplifiedRow(row, {
    relationIds: {
      programVersionId: "programVersion",
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

function normalizeSourceProgressionRow(row = null) {
  return normalizeSimplifiedRow(row, {
    relationIds: {
      defaultCategoryId: "defaultCategory"
    }
  });
}

function normalizeSourceProgressionEntryRow(row = null) {
  return normalizeSimplifiedRow(row, {
    relationIds: {
      progressionId: "progression",
      exerciseId: "exercise"
    }
  });
}

function normalizeAssignmentRow(row = null) {
  return normalizeSimplifiedRow(row, {
    dateOnlyFields: ["startsOn", "endsOn"]
  });
}

function normalizeAssignmentRevisionRow(row = null) {
  return normalizeSimplifiedRow(row, {
    relationIds: {
      programAssignmentId: "programAssignment",
      instanceProgramId: "instanceProgram"
    },
    dateOnlyFields: ["effectiveFromDate"]
  });
}

function normalizeInstanceProgramRow(row = null) {
  return normalizeSimplifiedRow(row, {
    relationIds: {
      sourceProgramId: "sourceProgram",
      sourceProgramVersionId: "sourceProgramVersion"
    }
  });
}

function normalizeInstanceProgramEntryRow(row = null) {
  return normalizeSimplifiedRow(row, {
    relationIds: {
      instanceProgramId: "instanceProgram",
      instanceProgressionId: "instanceProgression",
      exerciseId: "exercise"
    }
  });
}

function normalizeInstanceProgressionRow(row = null) {
  return normalizeSimplifiedRow(row, {
    relationIds: {
      instanceProgramId: "instanceProgram",
      sourceProgressionId: "sourceProgression",
      defaultCategoryId: "defaultCategory"
    }
  });
}

function normalizeInstanceProgressionEntryRow(row = null) {
  return normalizeSimplifiedRow(row, {
    relationIds: {
      instanceProgressionId: "instanceProgression",
      sourceProgressionEntryId: "sourceProgressionEntry",
      exerciseId: "exercise"
    }
  });
}

function createRepository({
  api,
  instanceProgramsRepository,
  instanceProgramEntriesRepository,
  instanceProgramRoutinesRepository,
  instanceRoutineEntriesRepository,
  instanceProgressionsRepository,
  instanceProgressionEntriesRepository,
  programAssignmentsRepository,
  programAssignmentRevisionsRepository,
  userProgressionsRepository
} = {}) {
  const withTransaction = programAssignmentsRepository.withTransaction;

  return Object.freeze({
    withTransaction,

    async listProgramCollections(options = {}) {
      return queryRows(
        api,
        "programCollections",
        {
          filters: {
            status: "active"
          },
          sort: ["sortOrder", "name"],
          page: {
            size: 128
          }
        },
        options,
        normalizeCollectionRow
      );
    },

    async listSourceProgramsByCollectionIds(programCollectionIds = [], options = {}) {
      const ids = compactIds(programCollectionIds);
      if (ids.length < 1) {
        return [];
      }

      return queryRows(
        api,
        "programs",
        {
          filters: {
            programCollectionIds: ids,
            status: "active"
          },
          include: ["programCollection"],
          sort: ["programCollectionId", "sortOrder", "name"],
          page: {
            size: 256
          }
        },
        options,
        normalizeSourceProgramRow
      );
    },

    async listPublishedProgramVersionsByProgramIds(programIds = [], options = {}) {
      const ids = compactIds(programIds);
      if (ids.length < 1) {
        return [];
      }

      return queryRows(
        api,
        "programVersions",
        {
          filters: {
            programIds: ids,
            status: "published"
          },
          include: ["program"],
          sort: ["programId", "-versionNumber", "-publishedAt", "-createdAt"],
          page: {
            size: 512
          }
        },
        options,
        normalizeProgramVersionRow
      );
    },

    async findPublishedProgramVersionById(programVersionId, options = {}) {
      if (!programVersionId) {
        return null;
      }

      const rows = await queryRows(
        api,
        "programVersions",
        {
          filters: {
            id: programVersionId,
            status: "published"
          },
          include: ["program"],
          page: {
            size: 1
          }
        },
        options,
        normalizeProgramVersionRow
      );

      return rows[0] || null;
    },

    async listProgramEntriesForVersionIds(programVersionIds = [], options = {}) {
      const ids = compactIds(programVersionIds);
      if (ids.length < 1) {
        return [];
      }

      return queryRows(
        api,
        "programEntries",
        {
          filters: {
            programVersionIds: ids
          },
          include: ["programVersion", "progression", "exercise"],
          sort: ["programVersionId", "dayOfWeek", "slotNumber"],
          page: {
            size: 512
          }
        },
        options,
        normalizeProgramEntryRow
      );
    },

    async listSourceProgressionsByIds(progressionIds = [], options = {}) {
      const ids = compactIds(progressionIds);
      if (ids.length < 1) {
        return [];
      }

      return queryRows(
        api,
        "progressions",
        {
          filters: {
            ids
          },
          include: ["defaultCategory"],
          sort: ["sortOrder", "name"],
          page: {
            size: 256
          }
        },
        options,
        normalizeSourceProgressionRow
      );
    },

    async listSourceProgressionEntriesByProgressionIds(progressionIds = [], options = {}) {
      const ids = compactIds(progressionIds);
      if (ids.length < 1) {
        return [];
      }

      return queryRows(
        api,
        "progressionEntries",
        {
          filters: {
            progressionIds: ids
          },
          include: ["progression", "exercise"],
          sort: ["progressionId", "stepNumber"],
          page: {
            size: 1024
          }
        },
        options,
        normalizeSourceProgressionEntryRow
      );
    },

    async listProgramRoutinesForVersionIds(programVersionIds = [], options = {}) {
      const ids = compactIds(programVersionIds);
      if (ids.length < 1) {
        return [];
      }

      return queryRows(
        api,
        "programRoutines",
        {
          filters: {
            programVersionIds: ids
          },
          include: ["programVersion", "routine"],
          sort: ["programVersionId", "timing", "dayOfWeek", "slotNumber"],
          page: {
            size: 512
          }
        },
        options,
        normalizeProgramRoutineRow
      );
    },

    async listRoutineEntriesForRoutineIds(routineIds = [], options = {}) {
      const ids = compactIds(routineIds);
      if (ids.length < 1) {
        return [];
      }

      return queryRows(
        api,
        "routineEntries",
        {
          filters: {
            routineIds: ids
          },
          include: ["routine", "exercise"],
          sort: ["routineId", "slotNumber"],
          page: {
            size: 512
          }
        },
        options,
        normalizeRoutineEntryRow
      );
    },

    async listActiveAssignments(options = {}) {
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

    async listLatestRevisionsByAssignmentIds(programAssignmentIds = [], options = {}) {
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
          sort: ["programAssignmentId", "-effectiveFromDate", "-createdAt"],
          page: {
            size: 256
          }
        },
        options,
        normalizeAssignmentRevisionRow
      );
    },

    async listInstanceProgramsByIds(instanceProgramIds = [], options = {}) {
      const ids = compactIds(instanceProgramIds);
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
          page: {
            size: 256
          }
        },
        options,
        normalizeInstanceProgramRow
      );
    },

    async listInstanceProgramEntriesByProgramIds(instanceProgramIds = [], options = {}) {
      const ids = compactIds(instanceProgramIds);
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
            size: 512
          }
        },
        options,
        normalizeInstanceProgramEntryRow
      );
    },

    async listInstanceProgressionsByProgramIds(instanceProgramIds = [], options = {}) {
      const ids = compactIds(instanceProgramIds);
      if (ids.length < 1) {
        return [];
      }

      return queryRows(
        api,
        "instanceProgressions",
        {
          filters: {
            instanceProgramIds: ids
          },
          include: ["instanceProgram", "sourceProgression"],
          sort: ["instanceProgramId", "sortOrder", "name"],
          page: {
            size: 256
          }
        },
        options,
        normalizeInstanceProgressionRow
      );
    },

    async listInstanceProgressionEntriesByProgressionIds(instanceProgressionIds = [], options = {}) {
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
            size: 1024
          }
        },
        options,
        normalizeInstanceProgressionEntryRow
      );
    },

    async createInstanceProgram(record = {}, options = {}) {
      return documentId(await instanceProgramsRepository.createDocument(record, {
        trx: transaction(options),
        context: options?.context || null
      }));
    },

    async createInstanceProgression(record = {}, options = {}) {
      return documentId(await instanceProgressionsRepository.createDocument(record, {
        trx: transaction(options),
        context: options?.context || null
      }));
    },

    async createInstanceProgressionEntry(record = {}, options = {}) {
      return documentId(await instanceProgressionEntriesRepository.createDocument(record, {
        trx: transaction(options),
        context: options?.context || null
      }));
    },

    async createInstanceProgramEntry(record = {}, options = {}) {
      return documentId(await instanceProgramEntriesRepository.createDocument(record, {
        trx: transaction(options),
        context: options?.context || null
      }));
    },

    async createInstanceProgramRoutine(record = {}, options = {}) {
      return documentId(await instanceProgramRoutinesRepository.createDocument(record, {
        trx: transaction(options),
        context: options?.context || null
      }));
    },

    async createInstanceRoutineEntry(record = {}, options = {}) {
      return documentId(await instanceRoutineEntriesRepository.createDocument(record, {
        trx: transaction(options),
        context: options?.context || null
      }));
    },

    async createAssignment(record = {}, options = {}) {
      return documentId(await programAssignmentsRepository.createDocument(record, {
        trx: transaction(options),
        context: options?.context || null
      }));
    },

    async createAssignmentRevision(record = {}, options = {}) {
      return documentId(await programAssignmentRevisionsRepository.createDocument(record, {
        trx: transaction(options),
        context: options?.context || null
      }));
    },

    async createUserProgression(record = {}, options = {}) {
      return documentId(await userProgressionsRepository.createDocument(record, {
        trx: transaction(options),
        context: options?.context || null
      }));
    }
  });
}

export { createRepository };
