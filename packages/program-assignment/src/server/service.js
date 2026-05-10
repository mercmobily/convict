import { NotFoundError, AppError } from "@jskit-ai/kernel/server/runtime/errors";
import { normalizeText } from "@jskit-ai/kernel/shared/support/normalize";
import { dayLabelForIsoDayOfWeek, formatWorkSetLabel, resolveScheduleEntryName } from "@local/main/shared";
import { resolveCurrentUserId } from "@local/main/shared/requestContext";

const TEMPLATE_METADATA = Object.freeze({
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

function sortProgramTemplatesForSelection(programTemplates = []) {
  return [...(Array.isArray(programTemplates) ? programTemplates : [])].sort((left, right) => {
    const leftRank = CANONICAL_PROGRAM_ORDER[String(left?.slug || "").trim().toLowerCase()] || Number.MAX_SAFE_INTEGER;
    const rightRank = CANONICAL_PROGRAM_ORDER[String(right?.slug || "").trim().toLowerCase()] || Number.MAX_SAFE_INTEGER;
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    const createdAtDelta = String(left?.createdAt || "").localeCompare(String(right?.createdAt || ""));
    return createdAtDelta || String(left?.id || "").localeCompare(String(right?.id || ""));
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
      entryKind: String(entry.entryKind || "").trim(),
      progressionTrackId: entry.progressionTrackId || null,
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

function enrichProgramTemplate(programTemplate = {}, scheduleEntries = []) {
  const slug = String(programTemplate.slug || "").trim().toLowerCase();
  const metadata = TEMPLATE_METADATA[slug] || {};
  const summary = normalizeText(programTemplate.description) || metadata.summary || "";

  return {
    ...programTemplate,
    summary,
    difficultyLabel: metadata.difficultyLabel || "",
    schedulePreview: buildSchedulePreview(scheduleEntries)
  };
}

function enrichAssignedProgram(program = {}, scheduleEntries = [], sourceTemplate = null) {
  const sourceSlug = String(sourceTemplate?.slug || "").trim().toLowerCase();
  const metadata = TEMPLATE_METADATA[sourceSlug] || {};
  const summary = normalizeText(program.description) || metadata.summary || "";

  return {
    ...program,
    summary,
    difficultyLabel: metadata.difficultyLabel || "",
    sourceTemplate: sourceTemplate || null,
    schedulePreview: buildSchedulePreview(scheduleEntries)
  };
}

function buildRowsById(rows = [], key = "id") {
  const index = new Map();
  for (const row of rows) {
    index.set(String(row?.[key] || ""), row);
  }
  return index;
}

function buildRowsByTemplateId(rows = []) {
  const index = new Map();
  for (const row of rows) {
    const templateId = String(row.programTemplateId || "");
    if (!index.has(templateId)) {
      index.set(templateId, []);
    }
    index.get(templateId).push(row);
  }
  return index;
}

function buildCopiedProgramScheduleEntries(programId, templateScheduleEntries = []) {
  return templateScheduleEntries.map((entry) => ({
    programId,
    dayOfWeek: Number(entry.dayOfWeek || 0),
    slotNumber: Number(entry.slotNumber || 0),
    entryKind: String(entry.entryKind || "progression_track").trim(),
    progressionTrackId: entry.progressionTrackId || null,
    exerciseId: entry.exerciseId || null,
    workSetsMin: Number(entry.workSetsMin || 0),
    workSetsMax: Number(entry.workSetsMax || 0),
    measurementUnit: entry.measurementUnit || null,
    targetRepsMin: entry.targetRepsMin ?? null,
    targetRepsMax: entry.targetRepsMax ?? null,
    targetSeconds: entry.targetSeconds ?? null,
    restSeconds: entry.restSeconds ?? null,
    notes: entry.notes ?? null
  }));
}

function buildRoutineEntriesByRoutineId(rows = []) {
  const index = new Map();
  for (const row of rows) {
    const routineId = String(row.routineId || "");
    if (!index.has(routineId)) {
      index.set(routineId, []);
    }
    index.get(routineId).push(row);
  }
  for (const entries of index.values()) {
    entries.sort((left, right) => Number(left.slotNumber || 0) - Number(right.slotNumber || 0));
  }
  return index;
}

function firstTrackStepByTrackId(rows = []) {
  const index = new Map();
  for (const row of rows) {
    index.set(String(row.progressionTrackId || ""), row);
  }
  return index;
}

async function hydrateActiveAssignments(programAssignmentRepository, activeAssignments = [], { context = null } = {}) {
  const hydrated = [];
  for (const assignment of activeAssignments) {
    const activeRevision = await programAssignmentRepository.findLatestRevisionByAssignmentId(assignment.id, { context });
    if (!activeRevision?.id) {
      hydrated.push({
        ...assignment,
        revision: null,
        program: null
      });
      continue;
    }

    const activeProgram = await programAssignmentRepository.findOwnedProgramById(activeRevision.programId, { context });
    const activeProgramScheduleEntries = activeProgram?.id
      ? await programAssignmentRepository.listScheduleEntriesForProgram(activeProgram.id, { context })
      : [];
    hydrated.push({
      ...assignment,
      revision: activeRevision,
      program: activeProgram
        ? enrichAssignedProgram(activeProgram, activeProgramScheduleEntries, activeProgram.programTemplate || null)
        : null
    });
  }
  return hydrated;
}

async function buildSelectionState(programAssignmentRepository, userId, { context = null } = {}) {
  const repositoryOptions = context ? { context } : {};
  const [programTemplates, activeAssignments] = await Promise.all([
    programAssignmentRepository.listProgramTemplates(repositoryOptions),
    programAssignmentRepository.listActiveAssignmentsByUserId(userId, repositoryOptions)
  ]);

  const templateScheduleEntries = await programAssignmentRepository.listTemplateScheduleEntriesForTemplateIds(
    programTemplates.map((programTemplate) => programTemplate.id),
    repositoryOptions
  );
  const templateScheduleEntriesByTemplateId = buildRowsByTemplateId(templateScheduleEntries);
  const enrichedProgramTemplates = sortProgramTemplatesForSelection(
    programTemplates.map((programTemplate) =>
      enrichProgramTemplate(
        programTemplate,
        templateScheduleEntriesByTemplateId.get(String(programTemplate.id || "")) || []
      )
    )
  );
  const hydratedActiveAssignments = await hydrateActiveAssignments(
    programAssignmentRepository,
    activeAssignments,
    { context }
  );

  return {
    programTemplates: enrichedProgramTemplates,
    activeAssignments: hydratedActiveAssignments,
    activeAssignment: hydratedActiveAssignments[0] || null,
    rules: {
      canStartProgram: true,
      switchingAvailable: false,
      multipleActivePrograms: true
    }
  };
}

async function copyTemplateRoutines(programAssignmentRepository, programId, programTemplateId, { trx, context } = {}) {
  const routineAssignments = await programAssignmentRepository.listTemplateRoutineAssignmentsForTemplateIds(
    [programTemplateId],
    { trx, context }
  );
  const routineIds = [...new Set(routineAssignments.map((assignment) => assignment.routineId).filter(Boolean))];
  const routineEntriesByRoutineId = buildRoutineEntriesByRoutineId(
    await programAssignmentRepository.listRoutineEntriesForRoutineIds(routineIds, { trx, context })
  );

  for (const routineAssignment of routineAssignments) {
    const routine = routineAssignment.routine || null;
    const programRoutineId = await programAssignmentRepository.createProgramRoutine(
      {
        programId,
        sourceRoutineId: routineAssignment.routineId,
        timing: String(routineAssignment.timing || "").trim().toLowerCase(),
        dayOfWeek: routineAssignment.dayOfWeek ?? null,
        slotNumber: Number(routineAssignment.slotNumber || 0),
        nameSnapshot: String(routine?.name || "Routine").trim(),
        descriptionSnapshot: routine?.description || null
      },
      { trx, context }
    );

    const routineEntries = routineEntriesByRoutineId.get(String(routineAssignment.routineId || "")) || [];
    await programAssignmentRepository.createProgramRoutineEntries(
      routineEntries.map((entry) => ({
        programRoutineId,
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
      })),
      { trx, context }
    );
  }
}

async function ensureProgressionTrackProgress(programAssignmentRepository, userId, scheduleEntries = [], { trx, context } = {}) {
  const progressionTrackIds = [
    ...new Set(
      scheduleEntries
        .filter((entry) => String(entry.entryKind || "").trim() === "progression_track")
        .map((entry) => entry.progressionTrackId)
        .filter(Boolean)
    )
  ];
  if (progressionTrackIds.length < 1) {
    return;
  }

  const [existingProgressRows, firstTrackSteps] = await Promise.all([
    programAssignmentRepository.listProgressionTrackProgressByTrackIds(userId, progressionTrackIds, { trx, context }),
    programAssignmentRepository.listFirstTrackStepsByTrackIds(progressionTrackIds, { trx, context })
  ]);
  const existingByTrackId = buildRowsById(existingProgressRows, "progressionTrackId");
  const firstStepByTrackId = firstTrackStepByTrackId(firstTrackSteps);

  for (const progressionTrackId of progressionTrackIds) {
    if (existingByTrackId.has(String(progressionTrackId))) {
      continue;
    }

    const firstStep = firstStepByTrackId.get(String(progressionTrackId)) || null;
    if (!firstStep?.id) {
      throw new AppError(500, `Missing first progression step for track ${progressionTrackId}.`);
    }

    await programAssignmentRepository.createProgressionTrackProgress(
      {
        progressionTrackId,
        currentProgressionTrackStepId: firstStep.id,
        readyToAdvanceProgressionTrackStepId: null,
        readyToAdvanceAt: null,
        lastCompletedOccurrenceId: null,
        lastCompletedAt: null,
        stallCount: 0,
        startedAt: null
      },
      { trx, context }
    );
  }
}

function createService({ programAssignmentRepository } = {}) {
  if (!programAssignmentRepository) {
    throw new TypeError("createService requires feature.program-assignment.repository.");
  }

  return Object.freeze({
    async readSelectionState(input = {}, options = {}) {
      void input;
      const context = options?.context || null;
      const userId = resolveCurrentUserId(context);
      return buildSelectionState(programAssignmentRepository, userId, {
        context
      });
    },

    async startProgram(input = {}, options = {}) {
      const context = options?.context || null;
      const userId = resolveCurrentUserId(context);
      const programTemplateId = input?.programTemplateId || null;
      const startsOn = normalizeStartsOn(input?.startsOn);

      if (!programTemplateId) {
        throw new AppError(400, "A valid programTemplateId is required.");
      }

      const [selectedTemplate, templateScheduleEntries] = await Promise.all([
        programAssignmentRepository.findProgramTemplateById(programTemplateId, { context }),
        programAssignmentRepository.listTemplateScheduleEntriesForTemplate(programTemplateId, { context })
      ]);
      if (!selectedTemplate) {
        throw new NotFoundError("Program template not found.");
      }

      await programAssignmentRepository.withTransaction(async (trx) => {
        const programId = await programAssignmentRepository.createProgramCopy(
          {
            programTemplateId: selectedTemplate.id,
            name: selectedTemplate.name,
            description: selectedTemplate.description
          },
          { trx, context }
        );

        await programAssignmentRepository.createProgramScheduleEntries(
          buildCopiedProgramScheduleEntries(programId, templateScheduleEntries),
          { trx, context }
        );

        await copyTemplateRoutines(programAssignmentRepository, programId, selectedTemplate.id, { trx, context });
        await ensureProgressionTrackProgress(programAssignmentRepository, userId, templateScheduleEntries, { trx, context });

        const assignmentId = await programAssignmentRepository.createAssignment(
          {
            startsOn,
            status: "active"
          },
          { trx, context }
        );

        await programAssignmentRepository.createAssignmentRevision(
          {
            userProgramAssignmentId: assignmentId,
            programId,
            effectiveFromDate: startsOn,
            changeReason: "initial",
            notes: null
          },
          { trx, context }
        );
      });

      return buildSelectionState(programAssignmentRepository, userId, {
        context
      });
    }
  });
}

export { createService };
