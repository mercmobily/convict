<route lang="json">
{
  "meta": {
    "jskit": {
      "surface": "app"
    }
  }
}
</route>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import {
  mdiArrowLeft,
  mdiArrowRightCircleOutline,
  mdiCalendarClock,
  mdiCheckCircleOutline,
  mdiContentSaveOutline,
  mdiDumbbell,
  mdiPlayCircleOutline,
  mdiPlus,
  mdiTrashCanOutline
} from "@mdi/js";
import { useRoute, useRouter } from "vue-router";
import WorkspaceNotFoundCard from "@/components/WorkspaceNotFoundCard.vue";
import { useConvictWorkoutPresentation } from "@/composables/useConvictWorkoutPresentation";
import { useWorkspaceNotFoundState } from "@/composables/useWorkspaceNotFoundState";
import { usePaths } from "@jskit-ai/users-web/client/composables/usePaths";
import { useCommand } from "@jskit-ai/users-web/client/composables/useCommand";
import { useEndpointResource } from "@jskit-ai/users-web/client/composables/useEndpointResource";

const { workspaceUnavailable, workspaceUnavailableMessage } = useWorkspaceNotFoundState();
const {
  exerciseCurrentStepNumber,
  exerciseDetailLine,
  formatWorkSetLabel,
  measurementLabel,
  progressionTargetLabel,
  workoutStatusColor,
  workoutStatusLabel
} = useConvictWorkoutPresentation();
const route = useRoute();
const router = useRouter();
const paths = usePaths();

const activeSavingOccurrenceExerciseId = ref("");
const activeAdvancingExerciseId = ref("");
const setDraftsByOccurrenceExerciseId = reactive({});

const scheduledForDate = computed(() => String(route.params.scheduledForDate || "").trim());
const homePagePath = computed(() => paths.page("/"));
const detailApiPath = computed(() =>
  paths.api(`/today/workouts/${scheduledForDate.value}`)
);

const workoutDetailResource = useEndpointResource({
  queryKey: computed(() => ["today-workout-detail", detailApiPath.value]),
  path: detailApiPath,
  fallbackLoadError: "Unable to load this workout.",
  enabled: computed(() => Boolean(scheduledForDate.value))
});

const startWorkoutCommand = useCommand({
  apiSuffix: "/today/start",
  writeMethod: "POST",
  fallbackRunError: "Unable to open this workout.",
  buildRawPayload: () => ({
    scheduledForDate: scheduledForDate.value
  }),
  messages: {
    success: "Workout occurrence opened.",
    error: "Unable to open this workout."
  },
  async onRunSuccess() {
    await workoutDetailResource.reload();
  }
});

const saveWorkoutSetLogsCommand = useCommand({
  apiSuffix: () => `/today/workouts/${scheduledForDate.value}/log-sets`,
  writeMethod: "POST",
  fallbackRunError: "Unable to save these set logs.",
  buildRawPayload: (_model, { context }) => ({
    occurrenceExerciseId: String(context?.occurrenceExerciseId || "").trim(),
    sets: Array.isArray(context?.sets) ? context.sets : []
  }),
  messages: {
    success: "Set logs saved.",
    error: "Unable to save these set logs."
  },
  async onRunSuccess() {
    await workoutDetailResource.reload();
  }
});

const submitWorkoutCommand = useCommand({
  apiSuffix: () => `/today/workouts/${scheduledForDate.value}/submit`,
  writeMethod: "POST",
  fallbackRunError: "Unable to finish this workout.",
  messages: {
    success: "Workout completed.",
    error: "Unable to finish this workout."
  },
  async onRunSuccess() {
    await workoutDetailResource.reload();
  }
});

const applyAdvancementCommand = useCommand({
  apiSuffix: "/today/progress/apply-advancement",
  writeMethod: "POST",
  fallbackRunError: "Unable to apply this advancement.",
  buildRawPayload: (_model, { context }) => ({
    exerciseId: String(context?.exerciseId || "").trim()
  }),
  messages: {
    success: "Advancement applied.",
    error: "Unable to apply this advancement."
  },
  async onRunSuccess() {
    await workoutDetailResource.reload();
  }
});

const detailState = computed(() => {
  const payload = workoutDetailResource.data.value;
  return payload && typeof payload === "object" ? payload : {};
});
const workout = computed(() => detailState.value.workout || null);
const assignment = computed(() => detailState.value.assignment || null);
const loadError = computed(() => String(workoutDetailResource.loadError.value || "").trim());
const isInitialLoading = computed(() => Boolean(workoutDetailResource.isInitialLoading.value));
const isRefreshing = computed(() => Boolean(workoutDetailResource.isRefetching.value));

watch(
  workout,
  (nextWorkout) => {
    syncDraftsFromWorkout(nextWorkout);
  },
  {
    immediate: true
  }
);

const pageTitle = computed(() => {
  if (!workout.value) {
    return "Workout detail";
  }

  return workout.value.dayLabel
    ? `${workout.value.dayLabel} workout`
    : "Workout detail";
});

const pageSubtitle = computed(() => {
  if (!workout.value) {
    return "Load the projected workout, then open it when you are ready to train.";
  }

  if (workout.value.status === "in_progress") {
    return "Save work set logs exercise by exercise, then finish the workout once every prescribed exercise has enough saved work sets.";
  }

  if (workout.value.status === "completed") {
    return "This workout is closed. Any earned step advancement stays advisory until you apply it yourself.";
  }

  if (workout.value.status === "overdue") {
    return "This workout is overdue. Open it to begin logging sets.";
  }

  if (workout.value.status === "scheduled") {
    return "This is today's scheduled workout. Open it to begin logging sets.";
  }

  return "Review the projected workout and saved set logs.";
});

function exerciseStatusLabel(status = "") {
  switch (String(status || "").trim().toLowerCase()) {
    case "completed":
      return "Completed";
    case "pending":
      return "Pending";
    case "in_progress":
      return "In progress";
    case "logged":
      return "Logged";
    case "definitely_missed":
      return "Definitely missed";
    default:
      return "Pending";
  }
}

function exerciseStatusColor(status = "") {
  switch (String(status || "").trim().toLowerCase()) {
    case "completed":
      return "success";
    case "logged":
      return "success";
    case "in_progress":
      return "info";
    case "definitely_missed":
      return "error";
    default:
      return "surface-variant";
  }
}

function exerciseInstructionText(exercise = {}) {
  return String(exercise.currentProgressStepInstruction || exercise.currentStepInstruction || "").trim();
}

function occurrenceExerciseKey(exercise = {}) {
  return String(exercise.occurrenceExerciseId || "");
}

const hasUnsavedWorkoutDrafts = computed(() => {
  const exercises = Array.isArray(workout.value?.exercises) ? workout.value.exercises : [];
  return exercises.some((exercise) => hasBlockingUnsavedDrafts(exercise));
});

const savedWorkoutSetCount = computed(() => {
  const exercises = Array.isArray(workout.value?.exercises) ? workout.value.exercises : [];
  return exercises.reduce((totalCount, exercise) => {
    const setCount = Array.isArray(exercise.setLogs) ? exercise.setLogs.length : 0;
    return totalCount + setCount;
  }, 0);
});

const incompleteExerciseCount = computed(() => {
  const exercises = Array.isArray(workout.value?.exercises) ? workout.value.exercises : [];
  return exercises.filter((exercise) => {
    const savedSetCount = Array.isArray(exercise.setLogs) ? exercise.setLogs.length : 0;
    return savedSetCount < Number(exercise.plannedWorkSetsMin || 0);
  }).length;
});

const canFinishWorkout = computed(() => {
  if (workout.value?.status !== "in_progress" || hasUnsavedWorkoutDrafts.value) {
    return false;
  }

  return savedWorkoutSetCount.value > 0;
});

const finishWorkoutHint = computed(() => {
  if (hasUnsavedWorkoutDrafts.value) {
    return "Save every changed exercise card before you finish this workout.";
  }

  if (workout.value?.status === "in_progress" && savedWorkoutSetCount.value < 1) {
    return "Save at least one set before finishing this workout.";
  }

  if (workout.value?.status === "in_progress" && incompleteExerciseCount.value > 0) {
    return incompleteExerciseCount.value === 1
      ? "You can finish now, but 1 exercise is below the programmed minimum."
      : `You can finish now, but ${incompleteExerciseCount.value} exercises are below the programmed minimum.`;
  }

  return "Finish the workout when you are done. The app will still track whether you met the programmed minimum volume.";
});

function normalizeDraftRows(rows = []) {
  return rows.map((row, index) => ({
    setNumber: index + 1,
    side: String(row?.side || "both").trim().toLowerCase() || "both",
    performedValue: row?.performedValue == null ? "" : String(row.performedValue)
  }));
}

function createBlankDraftRow(setNumber = 1) {
  return {
    setNumber: Number(setNumber || 1),
    side: "both",
    performedValue: ""
  };
}

function syncDraftsFromWorkout(nextWorkout = null) {
  const activeExerciseIds = new Set();
  const exercises = Array.isArray(nextWorkout?.exercises) ? nextWorkout.exercises : [];

  for (const exercise of exercises) {
    const key = occurrenceExerciseKey(exercise);
    if (!key) {
      continue;
    }

    activeExerciseIds.add(key);
    const setLogs = Array.isArray(exercise.setLogs) ? exercise.setLogs : [];
    if (setLogs.length > 0) {
      setDraftsByOccurrenceExerciseId[key] = normalizeDraftRows(
        setLogs.map((entry) => ({
          setNumber: entry.setNumber,
          side: entry.side,
          performedValue: entry.performedValue
        }))
      );
      continue;
    }

    setDraftsByOccurrenceExerciseId[key] = [createBlankDraftRow(1)];
  }

  for (const key of Object.keys(setDraftsByOccurrenceExerciseId)) {
    if (!activeExerciseIds.has(key)) {
      delete setDraftsByOccurrenceExerciseId[key];
    }
  }
}

function draftRowsForExercise(exercise = {}) {
  const key = occurrenceExerciseKey(exercise);
  return Array.isArray(setDraftsByOccurrenceExerciseId[key]) && setDraftsByOccurrenceExerciseId[key].length > 0
    ? setDraftsByOccurrenceExerciseId[key]
    : [createBlankDraftRow(1)];
}

function addDraftSet(exercise = {}) {
  const key = occurrenceExerciseKey(exercise);
  if (!key) {
    return;
  }

  const nextRows = draftRowsForExercise(exercise).slice();
  nextRows.push(createBlankDraftRow(nextRows.length + 1));
  setDraftsByOccurrenceExerciseId[key] = normalizeDraftRows(nextRows);
}

function removeDraftSet(exercise = {}, draftIndex = 0) {
  const key = occurrenceExerciseKey(exercise);
  if (!key) {
    return;
  }

  const nextRows = draftRowsForExercise(exercise).filter((_, index) => index !== draftIndex);
  setDraftsByOccurrenceExerciseId[key] = normalizeDraftRows(nextRows.length > 0 ? nextRows : [createBlankDraftRow(1)]);
}

function setDraftValue(exercise = {}, draftIndex = 0, value = "") {
  const key = occurrenceExerciseKey(exercise);
  if (!key) {
    return;
  }

  const nextRows = draftRowsForExercise(exercise).map((entry) => ({ ...entry }));
  nextRows[draftIndex] = {
    ...nextRows[draftIndex],
    performedValue: value
  };
  setDraftsByOccurrenceExerciseId[key] = nextRows;
}

function buildSetPayload(exercise = {}) {
  return draftRowsForExercise(exercise)
    .map((entry, index) => {
      const normalizedPerformedValue = String(entry.performedValue || "").trim();
      const payload = {
        setNumber: index + 1,
        side: String(entry.side || "both").trim().toLowerCase() || "both"
      };

      if (normalizedPerformedValue) {
        payload.performedValue = Number(normalizedPerformedValue);
      }

      return payload;
    });
}

function normalizeComparableSetRows(rows = [], { fromSaved = false } = {}) {
  return (Array.isArray(rows) ? rows : [])
    .map((entry, index) => ({
      setNumber: fromSaved ? Number(entry.setNumber || index + 1) : index + 1,
      side: String(entry.side || "both").trim().toLowerCase() || "both",
      performedValue: fromSaved
        ? String(entry.performedValue == null ? "" : entry.performedValue).trim()
        : String(entry.performedValue || "").trim()
    }))
    .filter((entry) => entry.performedValue !== "");
}

function hasBlockingUnsavedDrafts(exercise = {}) {
  if (workout.value?.status !== "in_progress") {
    return false;
  }

  const draftRows = normalizeComparableSetRows(draftRowsForExercise(exercise));
  const savedRows = normalizeComparableSetRows(exercise.setLogs, {
    fromSaved: true
  });

  if (draftRows.length !== savedRows.length) {
    return true;
  }

  return draftRows.some((draftRow, index) => {
    const savedRow = savedRows[index] || null;
    return (
      draftRow.setNumber !== savedRow?.setNumber ||
      draftRow.side !== savedRow?.side ||
      draftRow.performedValue !== savedRow?.performedValue
    );
  });
}

function shouldShowUnsavedBadge(exercise = {}) {
  if (workout.value?.status !== "in_progress") {
    return false;
  }

  const savedRows = normalizeComparableSetRows(exercise.setLogs, {
    fromSaved: true
  });
  return savedRows.length < 1 || hasBlockingUnsavedDrafts(exercise);
}

function isSavingExercise(exercise = {}) {
  return Boolean(
    saveWorkoutSetLogsCommand.isRunning &&
    activeSavingOccurrenceExerciseId.value === occurrenceExerciseKey(exercise)
  );
}

function progressionChipForSet(exercise = {}, setLog = {}) {
  if (!setLog?.qualifiesForProgression) {
    return "";
  }

  const unit = measurementLabel(exercise.measurementUnit);
  return `Meets progression ${unit}`;
}

function canAdvanceExercise(exercise = {}) {
  return Boolean(exercise?.canApplyAdvancement);
}

function hasAdvancedPastWorkoutSnapshot(exercise = {}) {
  return Boolean(exercise?.hasProgressStepChanged);
}

function isApplyingAdvancement(exercise = {}) {
  return Boolean(
    applyAdvancementCommand.isRunning &&
    activeAdvancingExerciseId.value === String(exercise.exerciseId || "")
  );
}

async function openWorkout() {
  await startWorkoutCommand.run();
}

async function saveExerciseLogs(exercise = {}) {
  const occurrenceExerciseId = occurrenceExerciseKey(exercise);
  if (!occurrenceExerciseId) {
    return;
  }

  activeSavingOccurrenceExerciseId.value = occurrenceExerciseId;
  try {
    await saveWorkoutSetLogsCommand.run({
      occurrenceExerciseId,
      sets: buildSetPayload(exercise)
    });
  } finally {
    activeSavingOccurrenceExerciseId.value = "";
  }
}

async function finishWorkout() {
  await submitWorkoutCommand.run();
}

async function applyAdvancement(exercise = {}) {
  const exerciseId = String(exercise.exerciseId || "").trim();
  if (!exerciseId) {
    return;
  }

  activeAdvancingExerciseId.value = exerciseId;
  try {
    await applyAdvancementCommand.run({
      exerciseId
    });
  } finally {
    activeAdvancingExerciseId.value = "";
  }
}

async function goBackToToday() {
  await router.push(homePagePath.value);
}
</script>

<template>
  <WorkspaceNotFoundCard
    v-if="workspaceUnavailable"
    :message="workspaceUnavailableMessage"
    surface-label="App"
  />
  <section v-else class="workout-detail-page d-flex flex-column ga-6">
    <div class="d-flex justify-space-between align-start flex-wrap ga-3">
      <div class="d-flex flex-column ga-2">
        <v-chip v-if="isRefreshing" color="info" size="small" variant="tonal" label class="align-self-start">
          Refreshing
        </v-chip>
        <div class="d-flex flex-column ga-1">
          <h2 class="text-h4 workout-detail-page__title mb-0">{{ pageTitle }}</h2>
          <p class="text-body-1 text-medium-emphasis mb-0 workout-detail-page__subtitle">
            {{ pageSubtitle }}
          </p>
        </div>
      </div>

      <v-btn
        variant="text"
        color="primary"
        :prepend-icon="mdiArrowLeft"
        @click="goBackToToday"
      >
        Back to today
      </v-btn>
    </div>

    <v-alert
      v-if="loadError"
      type="error"
      variant="tonal"
      border="start"
      title="Unable to load this workout"
      :text="loadError"
    >
      <template #append>
        <v-btn variant="text" :loading="workoutDetailResource.isFetching.value" @click="workoutDetailResource.reload()">
          Retry
        </v-btn>
      </template>
    </v-alert>

    <v-skeleton-loader
      v-else-if="isInitialLoading"
      type="article, card, card"
      class="workout-detail-page__skeleton"
    />

    <template v-else>
      <v-alert
        v-if="startWorkoutCommand.message"
        :type="startWorkoutCommand.messageType === 'error' ? 'error' : 'success'"
        variant="tonal"
        border="start"
        :text="startWorkoutCommand.message"
      />

      <v-card
        v-if="workout"
        rounded="xl"
        elevation="1"
        border
        class="workout-detail-card"
      >
        <v-card-item>
          <template #prepend>
            <v-avatar :color="workoutStatusColor(workout.status)" variant="tonal" rounded="lg">
              <v-icon :icon="mdiCalendarClock" />
            </v-avatar>
          </template>
          <div class="d-flex flex-column ga-1">
            <h3 class="text-h5 mb-0">{{ workout.dayLabel }} • {{ workout.scheduledForDate }}</h3>
            <p class="text-body-2 text-medium-emphasis mb-0">
              {{ assignment?.program?.name || workout.programName }}
            </p>
          </div>
        </v-card-item>
        <v-divider />
        <v-card-text class="d-flex flex-column ga-4">
          <div class="d-flex flex-wrap ga-2 align-center">
            <v-chip :color="workoutStatusColor(workout.status)" variant="tonal" label>
              {{ workoutStatusLabel(workout.status) }}
            </v-chip>
            <v-chip v-if="workout.performedOnDate" color="info" variant="tonal" label>
              Performed {{ workout.performedOnDate }}
            </v-chip>
            <v-chip v-if="assignment?.workspace?.name" color="secondary" variant="tonal" label>
              Cell {{ assignment.workspace.name }}
            </v-chip>
          </div>

          <v-alert
            v-if="workout.canStart"
            type="info"
            variant="tonal"
            border="start"
            text="Open this workout occurrence first. Once it is open, the set log fields below become editable."
          >
            <template #append>
              <v-btn
                color="primary"
                :prepend-icon="mdiPlayCircleOutline"
                :loading="startWorkoutCommand.isRunning"
                @click="openWorkout"
              >
                Open workout
              </v-btn>
            </template>
          </v-alert>

          <v-alert
            v-else-if="workout.status === 'in_progress'"
            type="info"
            variant="tonal"
            border="start"
            :text="finishWorkoutHint"
          >
            <template #append>
              <v-btn
                color="success"
                :prepend-icon="mdiCheckCircleOutline"
                :loading="submitWorkoutCommand.isRunning"
                :disabled="!canFinishWorkout"
                @click="finishWorkout"
              >
                Finish workout
              </v-btn>
            </template>
          </v-alert>

          <v-alert
            v-else-if="workout.status === 'completed'"
            type="success"
            variant="tonal"
            border="start"
            text="This workout is completed. Any earned advancement stays manual, so you can keep repeating the current step until you decide to move on."
          />

          <v-alert
            v-else-if="workout.status === 'definitely_missed'"
            type="warning"
            variant="tonal"
            border="start"
            text="This workout was marked definitely missed and is no longer loggable."
          />
        </v-card-text>
      </v-card>

      <v-alert
        v-else
        type="warning"
        variant="tonal"
        border="start"
        text="No workout detail is available for this scheduled date."
      />

      <div
        v-if="workout && Array.isArray(workout.exercises) && workout.exercises.length > 0"
        class="exercise-grid"
      >
        <v-card
          v-for="exercise in workout.exercises"
          :key="`detail-${exercise.slotNumber}-${exercise.exerciseName}`"
          rounded="xl"
          elevation="1"
          border
          class="exercise-card"
        >
          <v-card-item>
            <template #prepend>
              <v-avatar color="primary" variant="tonal" rounded="lg">
                <v-icon :icon="mdiDumbbell" />
              </v-avatar>
            </template>
            <div class="d-flex flex-column ga-1">
              <h4 class="text-h6 mb-0">{{ exercise.exerciseName }}</h4>
              <p class="text-body-2 text-medium-emphasis mb-0">
                {{ exerciseDetailLine(exercise) }}
              </p>
            </div>
          </v-card-item>
          <v-divider />
          <v-card-text class="d-flex flex-column ga-4">
            <div class="d-flex flex-wrap ga-2 align-center">
              <v-chip color="primary" variant="tonal" size="small" label>
                {{ formatWorkSetLabel(exercise.plannedWorkSetsMin, exercise.plannedWorkSetsMax) }}
              </v-chip>
              <v-chip
                v-if="exerciseCurrentStepNumber(exercise)"
                color="info"
                variant="tonal"
                size="small"
                label
              >
                Step {{ exerciseCurrentStepNumber(exercise) }}
              </v-chip>
              <v-chip color="secondary" variant="tonal" size="small" label>
                {{ measurementLabel(exercise.measurementUnit) }}
              </v-chip>
              <v-chip
                v-if="progressionTargetLabel(exercise)"
                color="success"
                variant="tonal"
                size="small"
                label
              >
                Progression {{ progressionTargetLabel(exercise) }}
              </v-chip>
              <v-chip :color="exerciseStatusColor(exercise.exerciseStatus)" variant="tonal" size="small" label>
                {{ exerciseStatusLabel(exercise.exerciseStatus) }}
              </v-chip>
            </div>

            <div class="exercise-card__save-state-lane">
              <div
                class="exercise-card__save-state-badge"
                :class="{ 'exercise-card__save-state-badge--visible': shouldShowUnsavedBadge(exercise) }"
                :aria-hidden="String(!shouldShowUnsavedBadge(exercise))"
              >
                LOG NOT SAVED
              </div>
            </div>

            <p
              v-if="exerciseInstructionText(exercise)"
              class="text-body-2 text-medium-emphasis mb-0 exercise-card__instruction"
            >
              {{ exerciseInstructionText(exercise) }}
            </p>

            <v-alert
              v-if="canAdvanceExercise(exercise)"
              type="success"
              variant="tonal"
              border="start"
              :title="`Ready to advance to ${exercise.readyToAdvanceStepName}`"
              :text="`You have earned the next canonical step. Stay on ${exercise.currentProgressStepName || exercise.currentStepName} as long as you like, or advance now.`"
            >
              <template #append>
                <v-btn
                  color="success"
                  :prepend-icon="mdiArrowRightCircleOutline"
                  :loading="isApplyingAdvancement(exercise)"
                  @click="applyAdvancement(exercise)"
                >
                  Advance now
                </v-btn>
              </template>
            </v-alert>

            <v-alert
              v-else-if="hasAdvancedPastWorkoutSnapshot(exercise)"
              type="info"
              variant="tonal"
              border="start"
              :title="`Current training step: ${exercise.currentProgressStepName}`"
              :text="`This workout was logged against ${exercise.currentStepName}. Your live progress has already moved on.`"
            />

            <div class="d-flex flex-column ga-3">
              <div
                v-for="(draftRow, draftIndex) in draftRowsForExercise(exercise)"
                :key="`draft-${exercise.occurrenceExerciseId || exercise.slotNumber}-${draftIndex}`"
                class="set-row"
              >
                <div class="set-row__label">
                  <div class="text-body-2 font-weight-medium">Set {{ draftIndex + 1 }}</div>
                </div>
                <v-text-field
                  :model-value="draftRow.performedValue"
                  :label="measurementLabel(exercise.measurementUnit) === 'seconds' ? 'Seconds' : 'Reps'"
                  type="number"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  min="0"
                  :step="measurementLabel(exercise.measurementUnit) === 'seconds' ? '1' : '1'"
                  @update:model-value="setDraftValue(exercise, draftIndex, $event)"
                />
                <v-btn
                  icon
                  variant="text"
                  color="error"
                  :aria-label="`Remove set ${draftIndex + 1}`"
                  @click="removeDraftSet(exercise, draftIndex)"
                >
                  <v-icon :icon="mdiTrashCanOutline" />
                </v-btn>
              </div>
            </div>

            <div
              v-if="Array.isArray(exercise.setLogs) && exercise.setLogs.length > 0"
              class="d-flex flex-wrap ga-2"
            >
              <v-chip
                v-for="setLog in exercise.setLogs"
                :key="`saved-${exercise.occurrenceExerciseId}-${setLog.id}`"
                :color="setLog.qualifiesForProgression ? 'success' : 'surface-variant'"
                variant="tonal"
                size="small"
                label
              >
                Set {{ setLog.setNumber }}: {{ setLog.performedValue }} {{ measurementLabel(exercise.measurementUnit) }}
              </v-chip>
              <v-chip
                v-for="setLog in exercise.setLogs.filter((entry) => entry.qualifiesForProgression)"
                :key="`progression-${exercise.occurrenceExerciseId}-${setLog.id}`"
                color="success"
                size="small"
                variant="outlined"
                label
              >
                {{ progressionChipForSet(exercise, setLog) }}
              </v-chip>
            </div>

            <div class="d-flex flex-wrap ga-3 align-center">
              <v-btn
                variant="text"
                color="primary"
                :prepend-icon="mdiPlus"
                :disabled="workout.status !== 'in_progress'"
                @click="addDraftSet(exercise)"
              >
                Add set
              </v-btn>
              <v-btn
                color="primary"
                :prepend-icon="mdiContentSaveOutline"
                :loading="isSavingExercise(exercise)"
                :disabled="workout.status !== 'in_progress'"
                @click="saveExerciseLogs(exercise)"
              >
                Save logs
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </template>
  </section>
</template>

<style scoped>
.workout-detail-page__title {
  letter-spacing: -0.03em;
}

.workout-detail-page__subtitle {
  max-width: 48rem;
}

.workout-detail-page__skeleton,
.workout-detail-card,
.exercise-card {
  border-radius: 1.5rem;
}

.workout-detail-card {
  background:
    linear-gradient(180deg, rgba(var(--v-theme-primary), 0.06), transparent),
    rgb(var(--v-theme-surface));
}

.exercise-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.exercise-card {
  background: rgba(var(--v-theme-surface-variant), 0.12);
}

.exercise-card__instruction {
  line-height: 1.5;
}

.exercise-card__save-state-lane {
  min-height: 2.25rem;
  display: flex;
  align-items: center;
}

.exercise-card__save-state-badge {
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: 1px solid rgba(var(--v-theme-error), 0.4);
  background: rgba(var(--v-theme-error), 0.1);
  color: rgb(var(--v-theme-error));
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  line-height: 1;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.14s ease;
}

.exercise-card__save-state-badge--visible {
  opacity: 1;
  visibility: visible;
}

.set-row {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: minmax(5rem, 6rem) minmax(0, 1fr) auto;
  align-items: center;
}

.set-row__label {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

@media (max-width: 640px) {
  .set-row {
    grid-template-columns: 1fr;
  }
}
</style>
