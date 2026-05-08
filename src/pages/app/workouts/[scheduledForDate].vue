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
import { computed, reactive, watch } from "vue";
import {
  mdiArrowLeft,
  mdiCalendarClock,
  mdiCheckCircleOutline,
  mdiPlayCircleOutline
} from "@mdi/js";
import { useRoute, useRouter } from "vue-router";
import WorkoutExerciseSetLogCard from "@/components/WorkoutExerciseSetLogCard.vue";
import { useApplyAdvancementCommand } from "@/composables/useApplyAdvancementCommand";
import { useConvictWorkoutPresentation } from "@/composables/useConvictWorkoutPresentation";
import { parseDateOnly } from "@local/main/shared";
import { usePaths } from "@jskit-ai/users-web/client/composables/usePaths";
import { useCommand } from "@jskit-ai/users-web/client/composables/useCommand";
import { useEndpointResource } from "@jskit-ai/users-web/client/composables/useEndpointResource";

const {
  workoutStatusColor,
  workoutStatusLabel
} = useConvictWorkoutPresentation();
const route = useRoute();
const router = useRouter();
const paths = usePaths();

const dirtyExerciseByKey = reactive({});
const syncingExerciseByKey = reactive({});

const scheduledForDate = computed(() => String(route.params.scheduledForDate || "").trim());
const homePagePath = computed(() => paths.page("/"));
const detailApiPath = computed(() => paths.api(`/today/workouts/${scheduledForDate.value}`));

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

const { applyAdvancement, isApplyingAdvancement } = useApplyAdvancementCommand({
  async onSuccess() {
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
const workoutDateLabel = computed(() => formatDateLabel(workout.value?.scheduledForDate));
const workoutProgramName = computed(() => String(assignment.value?.program?.name || workout.value?.programName || "").trim());

watch(
  workout,
  (nextWorkout) => {
    const activeKeys = new Set(
      (Array.isArray(nextWorkout?.exercises) ? nextWorkout.exercises : []).map((exercise) => exerciseCardKey(exercise))
    );

    for (const key of Object.keys(dirtyExerciseByKey)) {
      if (!activeKeys.has(key)) {
        delete dirtyExerciseByKey[key];
      }
    }

    for (const key of Object.keys(syncingExerciseByKey)) {
      if (!activeKeys.has(key)) {
        delete syncingExerciseByKey[key];
      }
    }
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
    return "Open the scheduled day and save sets as you train.";
  }

  if (workout.value.status === "in_progress") {
    return "Save sets per exercise. Finish when the day is done.";
  }

  if (workout.value.status === "completed") {
    return "Review saved sets and apply any earned advancement manually.";
  }

  if (workout.value.status === "overdue") {
    return "Open this overdue day to log it now.";
  }

  if (workout.value.status === "scheduled") {
    return "Open today’s workout when you start training.";
  }

  return "Review the projected workout and saved sets.";
});

function formatDateLabel(dateString = "", { includeYear = true } = {}) {
  const date = parseDateOnly(dateString);
  if (!date) {
    return String(dateString || "").trim();
  }

  return date.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(includeYear ? { year: "numeric" } : {})
  });
}

function exerciseCardKey(exercise = {}) {
  const occurrenceExerciseId = String(exercise.occurrenceExerciseId || "").trim();
  if (occurrenceExerciseId) {
    return occurrenceExerciseId;
  }

  return `${String(exercise.slotNumber || "")}:${String(exercise.exerciseId || "")}`;
}

const hasUnsavedWorkoutDrafts = computed(() => Object.values(dirtyExerciseByKey).some(Boolean));
const isWorkoutSyncing = computed(() => {
  return Boolean(
    workoutDetailResource.isRefetching.value ||
    Object.values(syncingExerciseByKey).some(Boolean)
  );
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
  if (workout.value?.status !== "in_progress" || hasUnsavedWorkoutDrafts.value || isWorkoutSyncing.value) {
    return false;
  }

  return savedWorkoutSetCount.value > 0;
});

const finishWorkoutHint = computed(() => {
  if (isWorkoutSyncing.value) {
    return "Wait for the latest saved set changes to finish syncing before you finish this workout.";
  }

  if (hasUnsavedWorkoutDrafts.value) {
    return "Wait for every changed exercise card to finish saving before you finish this workout.";
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

async function openWorkout() {
  await startWorkoutCommand.run();
}

async function finishWorkout() {
  await submitWorkoutCommand.run();
}

function handleExerciseDirtyState(exercise = {}, isDirty = false) {
  dirtyExerciseByKey[exerciseCardKey(exercise)] = Boolean(isDirty);
}

async function handleExerciseLogsChanged(exercise = {}) {
  const key = exerciseCardKey(exercise);
  syncingExerciseByKey[key] = true;
  try {
    await workoutDetailResource.reload();
  } finally {
    syncingExerciseByKey[key] = false;
  }
}

async function handleExerciseAdvanceRequested(exercise = {}) {
  await applyAdvancement(exercise);
}

async function goBackToToday() {
  await router.push(homePagePath.value);
}
</script>

<template>
  <section class="workout-detail-page d-flex flex-column ga-6">
    <v-chip
      v-if="isRefreshing"
      color="info"
      size="small"
      variant="tonal"
      label
      class="workout-detail-page__refresh-chip"
    >
      Refreshing
    </v-chip>

    <div class="d-flex justify-space-between align-start flex-wrap ga-3">
      <div class="d-flex flex-column ga-1">
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

      <v-sheet
        v-if="workout"
        rounded="xl"
        border
        class="workout-detail-card"
      >
        <header class="workout-detail-card__header">
          <div class="workout-detail-card__identity">
            <v-avatar :color="workoutStatusColor(workout.status)" variant="tonal" rounded="lg">
              <v-icon :icon="mdiCalendarClock" />
            </v-avatar>
            <div class="workout-detail-card__title-block">
              <h3 class="workout-detail-card__title">{{ workoutDateLabel || pageTitle }}</h3>
              <p v-if="workoutProgramName" class="workout-detail-card__meta mb-0">
                {{ workoutProgramName }}
              </p>
            </div>
          </div>
          <div class="workout-detail-card__status">
            <v-chip :color="workoutStatusColor(workout.status)" variant="tonal" label>
              {{ workoutStatusLabel(workout.status) }}
            </v-chip>
            <span v-if="workout.status === 'completed' && workout.performedOnDate">
              Completed {{ formatDateLabel(workout.performedOnDate) }}
            </span>
          </div>
        </header>

        <section class="workout-detail-card__action-panel">
          <template v-if="workout.canStart">
            <div>
              <div class="workout-detail-card__action-title">Ready to open</div>
              <p class="workout-detail-card__action-copy mb-0">
                Open this workout to start saving sets.
              </p>
            </div>
            <v-btn
              color="primary"
              :prepend-icon="mdiPlayCircleOutline"
              :loading="startWorkoutCommand.isRunning"
              class="workout-detail-card__action-button"
              @click="openWorkout"
            >
              Open workout
            </v-btn>
          </template>

          <template v-else-if="workout.status === 'in_progress'">
            <div>
              <div class="workout-detail-card__action-title">Logging sets</div>
              <p class="workout-detail-card__action-copy mb-0">
                {{ finishWorkoutHint }}
              </p>
            </div>
            <v-btn
              color="success"
              :prepend-icon="mdiCheckCircleOutline"
              :loading="submitWorkoutCommand.isRunning"
              :disabled="!canFinishWorkout"
              class="workout-detail-card__action-button"
              @click="finishWorkout"
            >
              Finish workout
            </v-btn>
          </template>

          <template v-else-if="workout.status === 'completed'">
            <div>
              <div class="workout-detail-card__action-title">This workout is completed.</div>
              <p class="workout-detail-card__action-copy mb-0">
                Earned advancement stays manual; repeat the current step until you choose to move on.
              </p>
            </div>
          </template>

          <template v-else-if="workout.status === 'definitely_missed'">
            <div>
              <div class="workout-detail-card__action-title">Marked missed</div>
              <p class="workout-detail-card__action-copy mb-0">
                This workout is no longer loggable.
              </p>
            </div>
          </template>
        </section>
      </v-sheet>

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
        <WorkoutExerciseSetLogCard
          v-for="exercise in workout.exercises"
          :key="`detail-${exerciseCardKey(exercise)}`"
          :exercise="exercise"
          :workout-status="workout.status"
          :is-applying-advancement="isApplyingAdvancement(exercise)"
          @logs-changed="handleExerciseLogsChanged"
          @dirty-state-changed="handleExerciseDirtyState(exercise, $event)"
          @advance-requested="handleExerciseAdvanceRequested(exercise)"
        />
      </div>
    </template>
  </section>
</template>

<style scoped>
.workout-detail-page__title {
  letter-spacing: -0.03em;
}

.workout-detail-page__refresh-chip {
  position: fixed;
  top: calc(var(--v-layout-top, 0px) + 1rem);
  right: 1rem;
  z-index: 20;
  pointer-events: none;
}

.workout-detail-page__subtitle {
  max-width: 48rem;
}

.workout-detail-page__skeleton,
.workout-detail-card {
  border-radius: 1.5rem;
}

.workout-detail-card {
  background:
    linear-gradient(180deg, rgba(var(--v-theme-primary), 0.06), transparent),
    rgb(var(--v-theme-surface));
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.workout-detail-card__header {
  align-items: flex-start;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

.workout-detail-card__identity {
  align-items: center;
  display: flex;
  gap: 0.9rem;
  min-width: 0;
}

.workout-detail-card__title-block {
  min-width: 0;
}

.workout-detail-card__title {
  color: rgba(var(--v-theme-on-surface), 0.94);
  font-size: clamp(1.25rem, 3vw, 1.85rem);
  font-weight: 780;
  letter-spacing: -0.035em;
  line-height: 1.08;
  margin: 0;
  overflow-wrap: anywhere;
}

.workout-detail-card__meta,
.workout-detail-card__status,
.workout-detail-card__action-copy {
  color: rgba(var(--v-theme-on-surface), 0.64);
}

.workout-detail-card__meta {
  font-size: 0.95rem;
  margin-top: 0.2rem;
}

.workout-detail-card__status {
  align-items: center;
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  font-size: 0.9rem;
  gap: 0.5rem;
  justify-content: flex-end;
}

.workout-detail-card__action-panel {
  align-items: center;
  background: rgba(var(--v-theme-surface), 0.66);
  border: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.72));
  border-radius: 1.2rem;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  padding: 1rem;
}

.workout-detail-card__action-title {
  color: rgba(var(--v-theme-on-surface), 0.92);
  font-size: 1rem;
  font-weight: 740;
  line-height: 1.25;
}

.workout-detail-card__action-copy {
  font-size: 0.94rem;
  line-height: 1.45;
  margin-top: 0.2rem;
}

.workout-detail-card__action-button {
  flex: 0 0 auto;
}

.exercise-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

@media (max-width: 640px) {
  .workout-detail-card {
    gap: 0.85rem;
    padding: 0.85rem;
  }

  .workout-detail-card__header,
  .workout-detail-card__action-panel {
    align-items: stretch;
    flex-direction: column;
  }

  .workout-detail-card__status {
    justify-content: flex-start;
  }

  .workout-detail-card__action-button {
    min-height: 48px;
    width: 100%;
  }

  .exercise-grid {
    grid-template-columns: 1fr;
  }
}
</style>
