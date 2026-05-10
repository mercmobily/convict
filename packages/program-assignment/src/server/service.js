import { NotFoundError, AppError } from "@jskit-ai/kernel/server/runtime/errors";
import { normalizeText } from "@jskit-ai/kernel/shared/support/normalize";
import { dayLabelForIsoDayOfWeek, formatWorkSetLabel, resolveScheduleEntryName } from "@local/main/shared";
import { resolveCurrentUserId } from "@local/main/shared/requestContext";

const PROGRAM_METADATA = Object.freeze({
  "new-blood": Object.freeze({
    summary: "Two short weekly sessions focused on building the habit and covering four core progressions.",
    difficultyLabel: "Foundation"
  }),
  "good-behavior": Object.freeze({
    summary: "Three weekly sessions rotating across all six progressions with steady, sustainable volume.",
    difficultyLabel: "Balanced"
  }),
  veterano: Object.freeze({
    summary: "A six-day cadence that isolates one progression per day for higher practice frequency.",
    difficultyLabel: "High Frequency"
  }),
  supermax: Object.freeze({
    summary: "A six-day high-volume template meant for advanced trainees chasing extreme work capacity.",
    difficultyLabel: "Advanced"
  })
});

const CANONICAL_PROGRAM_ORDER = Object.freeze({
  "new-blood": 1,
  "good-behavior": 2,
  veterano: 3,
  supermax: 4
});

function normalizeStartsOn(value = "") {
  const normalized = normalizeText(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new AppError(400, "startsOn must be a valid YYYY-MM-DD date.");
  }
  return normalized;
}

function normalizeProgramVersionId(value = "") {
  const normalized = String(value || "").trim();
  if (!normalized) {
    throw new AppError(400, "A valid programVersionId is required.");
  }
  return normalized;
}

function normalizeEntryKind(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "direct_exercise" || normalized === "exercise" || normalized === "direct"
    ? "direct_exercise"
    : "progression";
}

function buildRowsById(rows = [], key = "id") {
  const index = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const id = String(row?.[key] || "").trim();
    if (id) {
      index.set(id, row);
    }
  }
  return index;
}

function buildRowsByGroupId(rows = [], key = "id") {
  const index = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const id = String(row?.[key] || "").trim();
    if (!id) {
      continue;
    }
    if (!index.has(id)) {
      index.set(id, []);
    }
    index.get(id).push(row);
  }
  return index;
}

function sortScheduleEntries(entries = []) {
  return [...(Array.isArray(entries) ? entries : [])].sort((left, right) => {
    const dayDelta = Number(left?.dayOfWeek || 0) - Number(right?.dayOfWeek || 0);
    if (dayDelta !== 0) {
      return dayDelta;
    }
    return Number(left?.slotNumber || 0) - Number(right?.slotNumber || 0);
  });
}

function sortProgressionEntries(entries = []) {
  return [...(Array.isArray(entries) ? entries : [])].sort((left, right) => {
    const progressionDelta = Number(left?.progressionId || 0) - Number(right?.progressionId || 0);
    if (progressionDelta !== 0) {
      return progressionDelta;
    }
    return Number(left?.stepNumber || 0) - Number(right?.stepNumber || 0);
  });
}

function sortProgramOptions(options = []) {
  return [...(Array.isArray(options) ? options : [])].sort((left, right) => {
    const leftRank = CANONICAL_PROGRAM_ORDER[String(left?.slug || "").trim().toLowerCase()] || Number.MAX_SAFE_INTEGER;
    const rightRank = CANONICAL_PROGRAM_ORDER[String(right?.slug || "").trim().toLowerCase()] || Number.MAX_SAFE_INTEGER;
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    const orderDelta = Number(left?.sortOrder || 0) - Number(right?.sortOrder || 0);
    if (orderDelta !== 0) {
      return orderDelta;
    }

    return String(left?.name || "").localeCompare(String(right?.name || ""));
  });
}

function buildSchedulePreview(entries = []) {
  const grouped = new Map();
  for (const entry of entries) {
    const dayOfWeek = Number(entry.dayOfWeek || 0);
    if (!grouped.has(dayOfWeek)) {
      grouped.set(dayOfWeek, []);
    }
    grouped.get(dayOfWeek).push({
      slotNumber: Number(entry.slotNumber || 0),
      entryKind: normalizeEntryKind(entry.entryKind),
      progressionId: entry.progressionId || null,
      instanceProgressionId: entry.instanceProgressionId || null,
      exerciseId: entry.exerciseId || null,
      exerciseName: resolveScheduleEntryName(entry),
      workSetsMin: Number(entry.workSetsMin || 0),
      workSetsMax: Number(entry.workSetsMax || 0),
      workSetLabel: formatWorkSetLabel(entry.workSetsMin, entry.workSetsMax)
    });
  }

  const days = [];
  for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek += 1) {
    const items = (grouped.get(dayOfWeek) || []).sort((left, right) => left.slotNumber - right.slotNumber);
    days.push({
      dayOfWeek,
      dayLabel: dayLabelForIsoDayOfWeek(dayOfWeek) || `Day ${dayOfWeek}`,
      isRestDay: items.length < 1,
      items
    });
  }
  return days;
}

function enrichProgramVersionOption(programVersion = {}, sourceProgram = {}, scheduleEntries = []) {
  const slug = String(sourceProgram?.slug || "").trim().toLowerCase();
  const metadata = PROGRAM_METADATA[slug] || {};
  const summary = normalizeText(programVersion.description || sourceProgram?.description) || metadata.summary || "";

  return {
    id: programVersion.id,
    programVersionId: programVersion.id,
    programId: sourceProgram?.id || programVersion.programId || null,
    programCollectionId: sourceProgram?.programCollectionId || sourceProgram?.programCollection?.id || null,
    slug: sourceProgram?.slug || "",
    name: programVersion.name || sourceProgram?.name || "",
    programName: sourceProgram?.name || programVersion.name || "",
    versionLabel: programVersion.versionLabel || "",
    versionNumber: Number(programVersion.versionNumber || 0),
    summary,
    description: programVersion.description || sourceProgram?.description || "",
    difficultyLabel: metadata.difficultyLabel || "",
    sortOrder: Number(sourceProgram?.sortOrder || 0),
    schedulePreview: buildSchedulePreview(scheduleEntries)
  };
}

function latestVersionRowsByProgramId(programVersions = []) {
  const latest = new Map();
  for (const version of programVersions) {
    const programId = String(version?.programId || "").trim();
    if (!programId || latest.has(programId)) {
      continue;
    }
    latest.set(programId, version);
  }
  return latest;
}

function buildProgramCollections(collections = [], programs = [], options = []) {
  const optionsByCollectionId = buildRowsByGroupId(options, "programCollectionId");
  const programsByCollectionId = buildRowsByGroupId(programs, "programCollectionId");

  return (Array.isArray(collections) ? collections : []).map((collection) => {
    const collectionId = String(collection?.id || "").trim();
    return {
      ...collection,
      programs: sortProgramOptions(optionsByCollectionId.get(collectionId) || []),
      sourcePrograms: programsByCollectionId.get(collectionId) || []
    };
  });
}

function sourceProgramIdsFromActiveAssignments(activeAssignments = []) {
  return new Set(
    (Array.isArray(activeAssignments) ? activeAssignments : [])
      .map((assignment) => (
        assignment?.program?.sourceProgramId ||
        assignment?.program?.sourceProgram?.id ||
        null
      ))
      .map((sourceProgramId) => String(sourceProgramId || "").trim())
      .filter(Boolean)
  );
}

function applyProgramAvailability(options = [], activeSourceProgramIds = new Set()) {
  return (Array.isArray(options) ? options : []).map((option) => {
    const sourceProgramId = String(option?.programId || "").trim();
    const alreadyActive = Boolean(sourceProgramId && activeSourceProgramIds.has(sourceProgramId));
    return {
      ...option,
      alreadyActive,
      disabledReason: alreadyActive ? "already_active" : null
    };
  });
}

function latestRevisionRowsByAssignmentId(revisions = []) {
  const latest = new Map();
  for (const revision of Array.isArray(revisions) ? revisions : []) {
    const assignmentId = String(revision?.programAssignmentId || "").trim();
    if (!assignmentId || latest.has(assignmentId)) {
      continue;
    }
    latest.set(assignmentId, revision);
  }
  return latest;
}

function enrichAssignedProgram(instanceProgram = {}, scheduleEntries = []) {
  const slug = String(instanceProgram?.sourceProgram?.slug || "").trim().toLowerCase();
  const metadata = PROGRAM_METADATA[slug] || {};
  const summary = normalizeText(instanceProgram.description) || metadata.summary || "";

  return {
    ...instanceProgram,
    summary,
    difficultyLabel: metadata.difficultyLabel || "",
    schedulePreview: buildSchedulePreview(scheduleEntries)
  };
}

async function hydrateActiveAssignments(programAssignmentRepository, activeAssignments = [], { trx = null, context = null } = {}) {
  if (activeAssignments.length < 1) {
    return [];
  }
  const repositoryOptions = { trx, context };

  const assignmentIds = activeAssignments.map((assignment) => assignment.id).filter(Boolean);
  const revisions = await programAssignmentRepository.listLatestRevisionsByAssignmentIds(assignmentIds, repositoryOptions);
  const latestRevisionByAssignmentId = latestRevisionRowsByAssignmentId(revisions);
  const instanceProgramIds = revisions.map((revision) => revision.instanceProgramId).filter(Boolean);
  const [instancePrograms, instanceProgramEntries] = await Promise.all([
    programAssignmentRepository.listInstanceProgramsByIds(instanceProgramIds, repositoryOptions),
    programAssignmentRepository.listInstanceProgramEntriesByProgramIds(instanceProgramIds, repositoryOptions)
  ]);
  const instanceProgramsById = buildRowsById(instancePrograms);
  const instanceEntriesByProgramId = buildRowsByGroupId(instanceProgramEntries, "instanceProgramId");

  return activeAssignments.map((assignment) => {
    const revision = latestRevisionByAssignmentId.get(String(assignment.id || "")) || null;
    const instanceProgram = revision?.instanceProgramId
      ? instanceProgramsById.get(String(revision.instanceProgramId)) || revision.instanceProgram || null
      : null;
    const scheduleEntries = instanceProgram?.id
      ? instanceEntriesByProgramId.get(String(instanceProgram.id || "")) || []
      : [];

    return {
      ...assignment,
      revision,
      program: instanceProgram ? enrichAssignedProgram(instanceProgram, scheduleEntries) : null
    };
  });
}

async function buildSelectionState(programAssignmentRepository, { context = null } = {}) {
  const repositoryOptions = context ? { context } : {};
  const [collections, activeAssignments] = await Promise.all([
    programAssignmentRepository.listProgramCollections(repositoryOptions),
    programAssignmentRepository.listActiveAssignments(repositoryOptions)
  ]);

  const programs = await programAssignmentRepository.listSourceProgramsByCollectionIds(
    collections.map((collection) => collection.id),
    repositoryOptions
  );
  const programVersions = await programAssignmentRepository.listPublishedProgramVersionsByProgramIds(
    programs.map((program) => program.id),
    repositoryOptions
  );
  const latestByProgramId = latestVersionRowsByProgramId(programVersions);
  const latestVersions = programs.map((program) => latestByProgramId.get(String(program.id || ""))).filter(Boolean);
  const scheduleEntries = await programAssignmentRepository.listProgramEntriesForVersionIds(
    latestVersions.map((version) => version.id),
    repositoryOptions
  );
  const programsById = buildRowsById(programs);
  const scheduleEntriesByVersionId = buildRowsByGroupId(scheduleEntries, "programVersionId");
  const hydratedActiveAssignments = await hydrateActiveAssignments(
    programAssignmentRepository,
    activeAssignments,
    { context }
  );
  const activeSourceProgramIds = sourceProgramIdsFromActiveAssignments(hydratedActiveAssignments);
  const programOptions = applyProgramAvailability(
    sortProgramOptions(
      latestVersions.map((version) =>
        enrichProgramVersionOption(
          version,
          programsById.get(String(version.programId || "")) || version.program || {},
          scheduleEntriesByVersionId.get(String(version.id || "")) || []
        )
      )
    ),
    activeSourceProgramIds
  );

  return {
    programCollections: buildProgramCollections(collections, programs, programOptions),
    programVersions: programOptions,
    activeAssignments: hydratedActiveAssignments,
    activeAssignment: hydratedActiveAssignments[0] || null,
    rules: {
      canStartProgram: true,
      switchingAvailable: false,
      multipleActivePrograms: true
    }
  };
}

async function assertSourceProgramNotAlreadyActive(
  programAssignmentRepository,
  sourceProgramId,
  { trx = null, context = null } = {}
) {
  const normalizedSourceProgramId = String(sourceProgramId || "").trim();
  if (!normalizedSourceProgramId) {
    return;
  }

  const activeAssignments = await programAssignmentRepository.listActiveAssignments({ trx, context });
  const hydratedActiveAssignments = await hydrateActiveAssignments(
    programAssignmentRepository,
    activeAssignments,
    { trx, context }
  );
  if (sourceProgramIdsFromActiveAssignments(hydratedActiveAssignments).has(normalizedSourceProgramId)) {
    throw new AppError(409, "This program is already active.");
  }
}

function sourceProgressionIdsFromProgramEntries(programEntries = []) {
  return [
    ...new Set(
      sortScheduleEntries(programEntries)
        .filter((entry) => normalizeEntryKind(entry.entryKind) === "progression")
        .map((entry) => entry.progressionId)
        .filter(Boolean)
    )
  ];
}

function buildProgressionEntriesByProgressionId(entries = []) {
  const index = buildRowsByGroupId(sortProgressionEntries(entries), "progressionId");
  for (const values of index.values()) {
    values.sort((left, right) => Number(left.stepNumber || 0) - Number(right.stepNumber || 0));
  }
  return index;
}

async function copyProgramRoutines(
  programAssignmentRepository,
  instanceProgramId,
  sourceProgramVersionId,
  { trx, context } = {}
) {
  const routineAssignments = await programAssignmentRepository.listProgramRoutinesForVersionIds(
    [sourceProgramVersionId],
    { trx, context }
  );
  const routineIds = [...new Set(routineAssignments.map((assignment) => assignment.routineId).filter(Boolean))];
  const routineEntriesByRoutineId = buildRowsByGroupId(
    await programAssignmentRepository.listRoutineEntriesForRoutineIds(routineIds, { trx, context }),
    "routineId"
  );

  for (const routineAssignment of routineAssignments) {
    const routine = routineAssignment.routine || null;
    const instanceProgramRoutineId = await programAssignmentRepository.createInstanceProgramRoutine(
      {
        instanceProgramId,
        sourceRoutineId: routineAssignment.routineId || null,
        timing: String(routineAssignment.timing || "").trim().toLowerCase(),
        dayOfWeek: routineAssignment.dayOfWeek ?? null,
        slotNumber: Number(routineAssignment.slotNumber || 0),
        nameSnapshot: String(routine?.name || "Routine").trim(),
        descriptionSnapshot: routine?.description || null
      },
      { trx, context }
    );

    const routineEntries = routineEntriesByRoutineId.get(String(routineAssignment.routineId || "")) || [];
    for (const entry of routineEntries) {
      await programAssignmentRepository.createInstanceRoutineEntry(
        {
          instanceProgramRoutineId,
          exerciseId: entry.exerciseId,
          slotNumber: Number(entry.slotNumber || 0),
          exerciseNameSnapshot: String(entry.exercise?.name || "").trim(),
          measurementUnit: String(entry.measurementUnit || entry.exercise?.defaultMeasurementUnit || "reps").trim(),
          targetSets: entry.targetSets ?? null,
          targetRepsMin: entry.targetRepsMin ?? null,
          targetRepsMax: entry.targetRepsMax ?? null,
          targetSeconds: entry.targetSeconds ?? null,
          restSeconds: entry.restSeconds ?? null,
          notes: entry.notes ?? null
        },
        { trx, context }
      );
    }
  }
}

async function copyProgramVersionToInstance(
  programAssignmentRepository,
  {
    selectedVersion,
    selectedProgram,
    programEntries,
    startsOn
  } = {},
  { trx, context } = {}
) {
  const sourceProgramId = selectedProgram?.id || selectedVersion.programId || null;
  const instanceProgramId = await programAssignmentRepository.createInstanceProgram(
    {
      sourceProgramId,
      sourceProgramVersionId: selectedVersion.id,
      name: selectedVersion.name || selectedProgram?.name || "Program",
      description: selectedVersion.description || selectedProgram?.description || null,
      versionLabel: selectedVersion.versionLabel || null
    },
    { trx, context }
  );

  if (!instanceProgramId) {
    throw new AppError(500, "Unable to create copied program.");
  }

  const sourceProgressionIds = sourceProgressionIdsFromProgramEntries(programEntries);
  const [sourceProgressions, sourceProgressionEntries] = await Promise.all([
    programAssignmentRepository.listSourceProgressionsByIds(sourceProgressionIds, { trx, context }),
    programAssignmentRepository.listSourceProgressionEntriesByProgressionIds(sourceProgressionIds, { trx, context })
  ]);
  const sourceProgressionsById = buildRowsById(sourceProgressions);
  const sourceProgressionEntriesByProgressionId = buildProgressionEntriesByProgressionId(sourceProgressionEntries);
  const instanceProgressionIdBySourceProgressionId = new Map();
  const instanceProgressionEntryIdBySourceEntryId = new Map();
  const firstInstanceProgressionEntryIdByInstanceProgressionId = new Map();

  for (const sourceProgressionId of sourceProgressionIds) {
    const sourceProgression = sourceProgressionsById.get(String(sourceProgressionId)) || null;
    if (!sourceProgression?.id) {
      throw new AppError(500, `Missing source progression ${sourceProgressionId}.`);
    }

    const instanceProgressionId = await programAssignmentRepository.createInstanceProgression(
      {
        instanceProgramId,
        sourceProgressionId: sourceProgression.id,
        slug: sourceProgression.slug,
        name: sourceProgression.name,
        description: sourceProgression.description || null,
        defaultCategoryId: sourceProgression.defaultCategoryId || null,
        sourceKey: sourceProgression.sourceKey || null,
        sourceRef: sourceProgression.sourceRef || null,
        sortOrder: Number(sourceProgression.sortOrder || 0)
      },
      { trx, context }
    );
    if (!instanceProgressionId) {
      throw new AppError(500, `Unable to copy progression ${sourceProgressionId}.`);
    }

    instanceProgressionIdBySourceProgressionId.set(String(sourceProgression.id), instanceProgressionId);
    const sourceEntries = sourceProgressionEntriesByProgressionId.get(String(sourceProgression.id)) || [];
    if (sourceEntries.length < 1) {
      throw new AppError(500, `Missing progression entries for ${sourceProgression.name}.`);
    }

    for (const sourceEntry of sourceEntries) {
      const instanceProgressionEntryId = await programAssignmentRepository.createInstanceProgressionEntry(
        {
          instanceProgressionId,
          sourceProgressionEntryId: sourceEntry.id || null,
          exerciseId: sourceEntry.exerciseId,
          stepNumber: Number(sourceEntry.stepNumber || 0),
          stepLabel: sourceEntry.stepLabel,
          instructionText: sourceEntry.instructionText || null,
          measurementUnit: sourceEntry.measurementUnit || "reps",
          beginnerSets: sourceEntry.beginnerSets ?? null,
          beginnerRepsMin: sourceEntry.beginnerRepsMin ?? null,
          beginnerRepsMax: sourceEntry.beginnerRepsMax ?? null,
          beginnerSeconds: sourceEntry.beginnerSeconds ?? null,
          intermediateSets: sourceEntry.intermediateSets ?? null,
          intermediateRepsMin: sourceEntry.intermediateRepsMin ?? null,
          intermediateRepsMax: sourceEntry.intermediateRepsMax ?? null,
          intermediateSeconds: sourceEntry.intermediateSeconds ?? null,
          progressionSets: sourceEntry.progressionSets ?? null,
          progressionRepsMin: sourceEntry.progressionRepsMin ?? null,
          progressionRepsMax: sourceEntry.progressionRepsMax ?? null,
          progressionSeconds: sourceEntry.progressionSeconds ?? null,
          sourceRef: sourceEntry.sourceRef || null
        },
        { trx, context }
      );
      if (!instanceProgressionEntryId) {
        throw new AppError(500, `Unable to copy progression entry ${sourceEntry.id}.`);
      }

      instanceProgressionEntryIdBySourceEntryId.set(String(sourceEntry.id), instanceProgressionEntryId);
      if (!firstInstanceProgressionEntryIdByInstanceProgressionId.has(String(instanceProgressionId))) {
        firstInstanceProgressionEntryIdByInstanceProgressionId.set(String(instanceProgressionId), instanceProgressionEntryId);
      }
    }
  }

  for (const entry of sortScheduleEntries(programEntries)) {
    const entryKind = normalizeEntryKind(entry.entryKind);
    const instanceProgressionId = entryKind === "progression"
      ? instanceProgressionIdBySourceProgressionId.get(String(entry.progressionId || ""))
      : null;

    await programAssignmentRepository.createInstanceProgramEntry(
      {
        instanceProgramId,
        dayOfWeek: Number(entry.dayOfWeek || 0),
        slotNumber: Number(entry.slotNumber || 0),
        entryKind,
        instanceProgressionId: instanceProgressionId || null,
        exerciseId: entry.exerciseId || null,
        workSetsMin: Number(entry.workSetsMin || 0),
        workSetsMax: Number(entry.workSetsMax || 0),
        measurementUnit: entry.measurementUnit || null,
        targetRepsMin: entry.targetRepsMin ?? null,
        targetRepsMax: entry.targetRepsMax ?? null,
        targetSeconds: entry.targetSeconds ?? null,
        restSeconds: entry.restSeconds ?? null,
        notes: entry.notes ?? null
      },
      { trx, context }
    );
  }

  await copyProgramRoutines(programAssignmentRepository, instanceProgramId, selectedVersion.id, { trx, context });

  const assignmentId = await programAssignmentRepository.createAssignment(
    {
      startsOn,
      status: "active"
    },
    { trx, context }
  );
  if (!assignmentId) {
    throw new AppError(500, "Unable to create program assignment.");
  }

  await programAssignmentRepository.createAssignmentRevision(
    {
      programAssignmentId: assignmentId,
      instanceProgramId,
      effectiveFromDate: startsOn,
      changeReason: "initial",
      notes: null
    },
    { trx, context }
  );

  for (const instanceProgressionId of instanceProgressionIdBySourceProgressionId.values()) {
    const currentEntryId = firstInstanceProgressionEntryIdByInstanceProgressionId.get(String(instanceProgressionId));
    if (!currentEntryId) {
      throw new AppError(500, `Unable to seed progress for copied progression ${instanceProgressionId}.`);
    }

    await programAssignmentRepository.createUserProgression(
      {
        programAssignmentId: assignmentId,
        instanceProgressionId,
        currentInstanceProgressionEntryId: currentEntryId,
        readyToAdvanceInstanceProgressionEntryId: null,
        readyToAdvanceAt: null,
        lastCompletedWorkoutId: null,
        lastCompletedAt: null,
        stallCount: 0,
        startedAt: null
      },
      { trx, context }
    );
  }

  return assignmentId;
}

function createService({ programAssignmentRepository } = {}) {
  if (!programAssignmentRepository) {
    throw new TypeError("createService requires feature.program-assignment.repository.");
  }

  return Object.freeze({
    async readSelectionState(input = {}, options = {}) {
      void input;
      const context = options?.context || null;
      resolveCurrentUserId(context);
      return buildSelectionState(programAssignmentRepository, {
        context
      });
    },

    async startProgram(input = {}, options = {}) {
      const context = options?.context || null;
      resolveCurrentUserId(context);
      const programVersionId = normalizeProgramVersionId(input?.programVersionId);
      const startsOn = normalizeStartsOn(input?.startsOn);

      const selectedVersion = await programAssignmentRepository.findPublishedProgramVersionById(programVersionId, {
        context
      });
      if (!selectedVersion) {
        throw new NotFoundError("Program version not found.");
      }

      const [sourcePrograms, programEntries] = await Promise.all([
        programAssignmentRepository.listSourceProgramsByCollectionIds(
          [selectedVersion.program?.programCollectionId || selectedVersion.program?.programCollection?.id].filter(Boolean),
          { context }
        ),
        programAssignmentRepository.listProgramEntriesForVersionIds([selectedVersion.id], { context })
      ]);
      const selectedProgram =
        sourcePrograms.find((program) => String(program.id || "") === String(selectedVersion.programId || "")) ||
        selectedVersion.program ||
        null;

      if (!selectedProgram?.id) {
        throw new AppError(500, "Program version is missing its source program.");
      }

      await programAssignmentRepository.withTransaction(async (trx) => {
        await assertSourceProgramNotAlreadyActive(programAssignmentRepository, selectedProgram.id, {
          trx,
          context
        });
        await copyProgramVersionToInstance(
          programAssignmentRepository,
          {
            selectedVersion,
            selectedProgram,
            programEntries,
            startsOn
          },
          { trx, context }
        );
      });

      return buildSelectionState(programAssignmentRepository, {
        context
      });
    }
  });
}

export { createService };
