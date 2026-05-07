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
import WorkspaceNotFoundCard from "@/components/WorkspaceNotFoundCard.vue";
import { useApplyAdvancementCommand } from "@/composables/useApplyAdvancementCommand";
import { useConvictWorkoutPresentation } from "@/composables/useConvictWorkoutPresentation";
import { useWorkspaceNotFoundState } from "@/composables/useWorkspaceNotFoundState";
import { usePaths } from "@jskit-ai/users-web/client/composables/usePaths";
import { useCommand } from "@jskit-ai/users-web/client/composables/useCommand";
import { useEndpointResource } from "@jskit-ai/users-web/client/composables/useEndpointResource";

const { workspaceUnavailable, workspaceUnavailableMessage } = useWorkspaceNotFoundState();
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
    return "Load the projected workout, then open it when you are ready to train.";
  }

  if (workout.value.status === "in_progress") {
    return "Each exercise card persists its own set logs. Finish the workout once you are done training.";
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
  <WorkspaceNotFoundCard
    v-if="workspaceUnavailable"
    :message="workspaceUnavailableMessage"
    surface-label="App"
  />
  <section v-else class="workout-detail-page d-flex flex-column ga-6">
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
          >
            <div class="workout-detail-callout">
              <p class="text-body-2 mb-0">
                Open this workout occurrence first. Once it is open, the set log fields below become editable.
              </p>
              <v-btn
                color="primary"
                :prepend-icon="mdiPlayCircleOutline"
                :loading="startWorkoutCommand.isRunning"
                class="workout-detail-callout__action"
                @click="openWorkout"
              >
                Open workout
              </v-btn>
            </div>
          </v-alert>

          <v-alert
            v-else-if="workout.status === 'in_progress'"
            type="info"
            variant="tonal"
            border="start"
          >
            <div class="workout-detail-callout">
              <p class="text-body-2 mb-0">
                {{ finishWorkoutHint }}
              </p>
              <v-btn
                color="success"
                :prepend-icon="mdiCheckCircleOutline"
                :loading="submitWorkoutCommand.isRunning"
                :disabled="!canFinishWorkout"
                class="workout-detail-callout__action"
                @click="finishWorkout"
              >
                Finish workout
              </v-btn>
            </div>
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
.workout-detail-callout {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: space-between;
}

.workout-detail-callout__action {
  flex: 0 0 auto;
}

@media (max-width: 640px) {
  .workout-detail-callout {
    align-items: flex-start;
    flex-direction: column;
  }

  .workout-detail-callout__action {
    width: 100%;
  }
}
</style>

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
}

.exercise-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}
</style>
