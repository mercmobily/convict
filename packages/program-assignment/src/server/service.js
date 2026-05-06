import { ConflictError, NotFoundError, AppError } from "@jskit-ai/kernel/server/runtime/errors";
import { normalizeDbRecordId } from "@jskit-ai/database-runtime/shared";
import { normalizeRecordId, normalizeText } from "@jskit-ai/kernel/shared/support/normalize";

const DAY_LABELS = Object.freeze({
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday"
});

const PROGRAM_METADATA = Object.freeze({
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

function normalizeStartsOn(value = "") {
  const normalized = normalizeText(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new AppError(400, "startsOn must be a valid YYYY-MM-DD date.");
  }
  return normalized;
}

function formatWorkSetLabel(min, max) {
  const safeMin = Number(min || 0);
  const safeMax = Number(max || 0);
  if (safeMin > 0 && safeMin === safeMax) {
    return `${safeMin} work sets`;
  }
  return `${safeMin}-${safeMax} work sets`;
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
      exerciseName: String(entry.exerciseName || "").trim(),
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
      dayLabel: DAY_LABELS[dayOfWeek] || `Day ${dayOfWeek}`,
      isRestDay: items.length < 1,
      items
    });
  }
  return days;
}

function enrichProgram(program = {}, scheduleEntries = []) {
  const slug = String(program.slug || "").trim().toLowerCase();
  const metadata = PROGRAM_METADATA[slug] || {};
  const summary = normalizeText(program.description) || metadata.summary || "";

  return {
    ...program,
    summary,
    difficultyLabel: metadata.difficultyLabel || "",
    schedulePreview: buildSchedulePreview(scheduleEntries)
  };
}

function resolveCurrentUserId(context = {}) {
  const visibilityUserId = normalizeRecordId(context?.visibilityContext?.userId, { fallback: null });
  if (visibilityUserId) {
    return visibilityUserId;
  }

  const actorUserId = normalizeRecordId(context?.actor?.id, { fallback: null });
  if (actorUserId) {
    return actorUserId;
  }

  throw new AppError(401, "Authentication is required.");
}

function resolveCurrentWorkspaceId(context = {}) {
  const workspaceId = normalizeDbRecordId(context?.visibilityContext?.scopeOwnerId, { fallback: null });
  if (workspaceId) {
    return workspaceId;
  }

  throw new AppError(400, "Workspace context is unavailable for this request.");
}

async function buildSelectionState(programAssignmentRepository, userId) {
  const [programs, activeAssignment] = await Promise.all([
    programAssignmentRepository.listSelectablePrograms({ userId }),
    programAssignmentRepository.findActiveAssignmentByUserId(userId)
  ]);

  const activeRevision = activeAssignment
    ? await programAssignmentRepository.findLatestRevisionByAssignmentId(activeAssignment.id)
    : null;

  const programIds = [
    ...programs.map((program) => program.id),
    ...(activeRevision?.programId ? [activeRevision.programId] : [])
  ].filter(Boolean);
  const scheduleEntries = await programAssignmentRepository.listScheduleEntriesForProgramIds(programIds);
  const scheduleEntriesByProgramId = new Map();
  for (const entry of scheduleEntries) {
    const programId = String(entry.programId || "");
    if (!scheduleEntriesByProgramId.has(programId)) {
      scheduleEntriesByProgramId.set(programId, []);
    }
    scheduleEntriesByProgramId.get(programId).push(entry);
  }

  const programsForSelection = programs.map((program) =>
    enrichProgram(program, scheduleEntriesByProgramId.get(String(program.id)) || [])
  );

  let hydratedActiveAssignment = null;
  if (activeAssignment && activeRevision) {
    const activeProgram =
      programs.find((entry) => String(entry.id) === String(activeRevision.programId)) ||
      (await programAssignmentRepository.findSelectableProgramById(activeRevision.programId, { userId }));
    const workspace = activeAssignment.workspaceId
      ? await programAssignmentRepository.findWorkspaceById(activeAssignment.workspaceId)
      : null;

    hydratedActiveAssignment = {
      ...activeAssignment,
      revision: activeRevision,
      workspace,
      program: activeProgram
        ? enrichProgram(activeProgram, scheduleEntriesByProgramId.get(String(activeProgram.id)) || [])
        : null
    };
  }

  return {
    programs: programsForSelection,
    activeAssignment: hydratedActiveAssignment,
    rules: {
      canStartProgram: hydratedActiveAssignment == null,
      switchingAvailable: false
    }
  };
}

function createService({ programAssignmentRepository } = {}) {
  if (!programAssignmentRepository) {
    throw new TypeError("createService requires feature.program-assignment.repository.");
  }

  return Object.freeze({
    async readSelectionState(input = {}, options = {}) {
      void input;
      const userId = resolveCurrentUserId(options?.context);
      return buildSelectionState(programAssignmentRepository, userId);
    },
    async startProgram(input = {}, options = {}) {
      const context = options?.context || null;
      const userId = resolveCurrentUserId(context);
      const workspaceId = resolveCurrentWorkspaceId(context);
      const programId = normalizeDbRecordId(input?.programId, { fallback: null });
      const startsOn = normalizeStartsOn(input?.startsOn);

      if (!programId) {
        throw new AppError(400, "A valid programId is required.");
      }

      const selectableProgram = await programAssignmentRepository.findSelectableProgramById(programId, { userId });
      if (!selectableProgram) {
        throw new NotFoundError("Program not found.");
      }

      await programAssignmentRepository.withTransaction(async (trx) => {
        const activeAssignment = await programAssignmentRepository.findActiveAssignmentByUserId(userId, { trx });
        if (activeAssignment) {
          throw new ConflictError("You already have an active program. Switching comes later.");
        }

        const assignmentId = await programAssignmentRepository.createAssignment(
          {
            userId,
            workspaceId,
            startsOn,
            status: "active"
          },
          { trx }
        );

        await programAssignmentRepository.createAssignmentRevision(
          {
            userProgramAssignmentId: assignmentId,
            programId,
            effectiveFromDate: startsOn,
            changeReason: "initial",
            notes: null
          },
          { trx }
        );
      });

      return buildSelectionState(programAssignmentRepository, userId);
    }
  });
}

export { createService };
