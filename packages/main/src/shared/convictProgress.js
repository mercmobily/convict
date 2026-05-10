const CANONICAL_EXERCISE_SLUG_ORDER = Object.freeze([
  "push-ups",
  "squats",
  "pull-ups",
  "leg-raises",
  "bridges",
  "handstand-push-ups"
]);

const CANONICAL_PROGRESSION_SLUG_ORDER = Object.freeze([
  "convict-push-ups",
  "convict-squats",
  "convict-pull-ups",
  "convict-leg-raises",
  "convict-bridges",
  "convict-handstand-push-ups"
]);

function canonicalExerciseRank(exercise = {}) {
  const slug = String(exercise?.slug || exercise?.exerciseSlug || "").trim();
  const index = CANONICAL_EXERCISE_SLUG_ORDER.indexOf(slug);
  return index >= 0 ? index : CANONICAL_EXERCISE_SLUG_ORDER.length;
}

function canonicalProgressionRank(progression = {}) {
  const slug = String(progression?.slug || progression?.progressionSlug || "").trim();
  const index = CANONICAL_PROGRESSION_SLUG_ORDER.indexOf(slug);
  return index >= 0 ? index : CANONICAL_PROGRESSION_SLUG_ORDER.length;
}

function sortCanonicalExercises(exercises = []) {
  return [...(Array.isArray(exercises) ? exercises : [])].sort((left, right) => {
    const rankDelta = canonicalExerciseRank(left) - canonicalExerciseRank(right);
    if (rankDelta !== 0) {
      return rankDelta;
    }

    return String(left?.name || left?.exerciseName || "").localeCompare(
      String(right?.name || right?.exerciseName || "")
    );
  });
}

function sortCanonicalProgressions(progressions = []) {
  return [...(Array.isArray(progressions) ? progressions : [])].sort((left, right) => {
    const rankDelta = canonicalProgressionRank(left) - canonicalProgressionRank(right);
    if (rankDelta !== 0) {
      return rankDelta;
    }

    return String(left?.name || left?.progressionName || "").localeCompare(
      String(right?.name || right?.progressionName || "")
    );
  });
}

function buildProgressDisplayState(
  {
    progressRow = null,
    currentStep = null,
    fallbackStep = null,
    readyStep = null,
    base = {}
  } = {},
  {
    emptyReadyStepName = "",
    emptyCurrentStepName = "",
    emptyCurrentStepInstruction = ""
  } = {}
) {
  const resolvedCurrentStep = currentStep || fallbackStep || null;
  const currentProgressStepId =
    progressRow?.currentInstanceProgressionEntryId ||
    progressRow?.currentStepId ||
    resolvedCurrentStep?.id ||
    base?.currentProgressStepId ||
    base?.currentStepId ||
    null;

  return {
    currentProgressStepId,
    currentProgressStepNumber:
      resolvedCurrentStep?.stepNumber ??
      base?.currentProgressStepNumber ??
      base?.currentStepNumber ??
      null,
    currentProgressStepName:
      resolvedCurrentStep?.stepLabel ||
      resolvedCurrentStep?.stepName ||
      base?.currentProgressStepName ||
      base?.currentStepName ||
      emptyCurrentStepName,
    currentProgressStepInstruction:
      resolvedCurrentStep?.instructionText ||
      base?.currentProgressStepInstruction ||
      base?.currentStepInstruction ||
      emptyCurrentStepInstruction,
    readyToAdvanceStepId:
      progressRow?.readyToAdvanceInstanceProgressionEntryId ||
      progressRow?.readyToAdvanceStepId ||
      base?.readyToAdvanceStepId ||
      null,
    readyToAdvanceStepNumber: readyStep?.stepNumber ?? base?.readyToAdvanceStepNumber ?? null,
    readyToAdvanceStepName:
      readyStep?.stepLabel ||
      readyStep?.stepName ||
      base?.readyToAdvanceStepName ||
      emptyReadyStepName,
    readyToAdvanceAt: progressRow?.readyToAdvanceAt || base?.readyToAdvanceAt || null
  };
}

export {
  buildProgressDisplayState,
  CANONICAL_EXERCISE_SLUG_ORDER,
  CANONICAL_PROGRESSION_SLUG_ORDER,
  sortCanonicalExercises,
  sortCanonicalProgressions
};
