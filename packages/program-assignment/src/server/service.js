import { ConflictError, NotFoundError, AppError } from "@jskit-ai/kernel/server/runtime/errors";
import { normalizeText } from "@jskit-ai/kernel/shared/support/normalize";
import { dayLabelForIsoDayOfWeek, formatWorkSetLabel, resolveScheduleExerciseName } from "@local/main/shared";
import { resolveCurrentUserId } from "@local/main/shared/requestContext";

const TEMPLATE_METADATA = Object.freeze({
  "new-blood": Object.freeze({
    summary: "Two short weekly sessions focused on building the habit and covering four of the Big 6.",
    difficultyLabel: "Foundation"
  }),
  "good-behavior": Object.freeze({
    summary: "Three weekly sessions that rotate across all Big 6 movements with steady, sustainable volume.",
    difficultyLabel: "Balanced"
  }),
  veterano: Object.freeze({
    summary: "A six-day cadence that isolates one movement family per day for higher practice frequency.",
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
  const rows = Array.isArray(programTemplates) ? programTemplates.slice() : [];
  rows.sort((left, right) => {
    const leftRank = CANONICAL_PROGRAM_ORDER[String(left?.slug || "").trim().toLowerCase()] || Number.MAX_SAFE_INTEGER;
    const rightRank = CANONICAL_PROGRAM_ORDER[String(right?.slug || "").trim().toLowerCase()] || Number.MAX_SAFE_INTEGER;
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    const leftCreatedAt = String(left?.createdAt || "");
    const rightCreatedAt = String(right?.createdAt || "");
    if (leftCreatedAt !== rightCreatedAt) {
      return leftCreatedAt.localeCompare(rightCreatedAt);
    }

    return String(left?.id || "").localeCompare(String(right?.id || ""));
  });

  return rows;
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
      exerciseId: entry.exerciseId,
      exerciseName: resolveScheduleExerciseName(entry),
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

function buildTemplateScheduleIndex(rows = []) {
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

async function buildSelectionState(programAssignmentRepository, userId, { context = null } = {}) {
  const repositoryOptions = context ? { context } : {};
  const [programTemplates, activeAssignment] = await Promise.all([
    programAssignmentRepository.listProgramTemplates(repositoryOptions),
    programAssignmentRepository.findActiveAssignmentByUserId(userId, repositoryOptions)
  ]);

  const templateScheduleEntries = await programAssignmentRepository.listTemplateScheduleEntriesForTemplateIds(
    programTemplates.map((programTemplate) => programTemplate.id),
    repositoryOptions
  );

  const templateScheduleEntriesByTemplateId = buildTemplateScheduleIndex(templateScheduleEntries);
  const enrichedProgramTemplates = sortProgramTemplatesForSelection(
    programTemplates.map((programTemplate) =>
      enrichProgramTemplate(
        programTemplate,
        templateScheduleEntriesByTemplateId.get(String(programTemplate.id || "")) || []
      )
    )
  );

  let hydratedActiveAssignment = null;
  if (activeAssignment?.id) {
    const activeRevision = await programAssignmentRepository.findLatestRevisionByAssignmentId(activeAssignment.id, repositoryOptions);
    if (activeRevision?.id) {
      const activeProgram = await programAssignmentRepository.findOwnedProgramById(activeRevision.programId, repositoryOptions);
      const activeProgramScheduleEntries = activeProgram?.id
        ? await programAssignmentRepository.listScheduleEntriesForProgram(activeProgram.id, repositoryOptions)
        : [];
      const sourceTemplate = activeProgram?.programTemplate || null;

      hydratedActiveAssignment = {
        ...activeAssignment,
        revision: activeRevision,
        program: activeProgram
          ? enrichAssignedProgram(activeProgram, activeProgramScheduleEntries, sourceTemplate)
          : null
      };
    }
  }

  return {
    programTemplates: enrichedProgramTemplates,
    activeAssignment: hydratedActiveAssignment,
    rules: {
      canStartProgram: hydratedActiveAssignment == null,
      switchingAvailable: false
    }
  };
}

function buildCopiedProgramScheduleEntries(programId, templateScheduleEntries = []) {
  return templateScheduleEntries.map((entry) => ({
    programId,
    dayOfWeek: Number(entry.dayOfWeek || 0),
    slotNumber: Number(entry.slotNumber || 0),
    exerciseId: entry.exerciseId,
    workSetsMin: Number(entry.workSetsMin || 0),
    workSetsMax: Number(entry.workSetsMax || 0)
  }));
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
        const activeAssignment = await programAssignmentRepository.findActiveAssignmentByUserId(userId, { trx, context });
        if (activeAssignment) {
          throw new ConflictError("You already have an active program. Switching comes later.");
        }

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
