<script setup>
import { computed, reactive, ref, watch } from "vue";
import {
  mdiBookOpenPageVariantOutline,
  mdiCalendarClock,
  mdiCalendarStart,
  mdiCheckBold,
  mdiCheckCircleOutline,
  mdiChevronDown,
  mdiChevronUp,
  mdiDumbbell,
  mdiFlagCheckered,
  mdiPlayCircleOutline,
  mdiSleep,
  mdiTimerSand
} from "@mdi/js";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import WorkoutExercisePreviewList from "@/components/WorkoutExercisePreviewList.vue";
import { useConvictWorkoutPresentation } from "@/composables/useConvictWorkoutPresentation";
import { localTodayDateString, normalizeDateOnly, parseDateOnly } from "@local/main/shared";
import { usePaths } from "@jskit-ai/users-web/client/composables/usePaths";
import { useCommand } from "@jskit-ai/users-web/client/composables/useCommand";
import { useEndpointResource } from "@jskit-ai/users-web/client/composables/useEndpointResource";

const {
  workoutStatusColor,
  workoutStatusLabel
} = useConvictWorkoutPresentation();
const paths = usePaths();
const router = useRouter();
const { smAndDown } = useDisplay();

const selectionModel = reactive({
  programVersionId: "",
  startsOn: localTodayDateString()
});
const selectedProgramCollectionId = ref("");
const selectedProgramVersionId = ref("");
const activeProgramExpanded = ref(false);
const activeStartScheduledForDate = ref("");
const activeMissedScheduledForDate = ref("");

const selectionApiPath = computed(() => paths.api("/program-assignment"));
const selectionResource = useEndpointResource({
  queryKey: computed(() => ["program-assignment", selectionApiPath.value]),
  path: selectionApiPath,
  refreshOnPull: true,
  fallbackLoadError: "Unable to load program choices."
});

const startProgramCommand = useCommand({
  apiSuffix: "/program-assignment",
  writeMethod: "POST",
  fallbackRunError: "Unable to start this program.",
  buildRawPayload: () => ({
    programVersionId: selectionModel.programVersionId,
    startsOn: selectionModel.startsOn
  }),
  messages: {
    success: "Program started.",
    error: "Unable to start this program."
  },
  async onRunSuccess() {
    await selectionResource.reload();
  }
});

const selectionState = computed(() => {
  const payload = selectionResource.data.value;
  return payload && typeof payload === "object" ? payload : {};
});
const programCollections = computed(() => (
  Array.isArray(selectionState.value.programCollections) ? selectionState.value.programCollections : []
));
const selectedProgramCollection = computed(() => {
  const currentId = String(selectedProgramCollectionId.value || "").trim() || String(programCollections.value[0]?.id || "");
  return programCollections.value.find((collection) => String(collection.id) === currentId) || null;
});
const programVersions = computed(() => (
  Array.isArray(selectedProgramCollection.value?.programs) ? selectedProgramCollection.value.programs : []
));
watch(
  programCollections,
  (collections) => {
    if (!String(selectedProgramCollectionId.value || "").trim() && collections[0]?.id) {
      selectedProgramCollectionId.value = String(collections[0].id);
    }
  },
  { immediate: true }
);
watch(
  programVersions,
  (versions) => {
    const currentProgramVersionId = String(selectionModel.programVersionId || "").trim();
    if (
      currentProgramVersionId &&
      !versions.some((programVersion) => String(programVersion.id || "") === currentProgramVersionId)
    ) {
      selectedProgramVersionId.value = "";
      selectionModel.programVersionId = "";
    }
  },
  { immediate: true }
);
const activeAssignments = computed(() => (Array.isArray(selectionState.value.activeAssignments) ? selectionState.value.activeAssignments : []));
const activeAssignment = computed(() => selectionState.value.activeAssignment || null);
const hasActiveAssignment = computed(() => activeAssignments.value.length > 0);
const canStartProgram = computed(() => selectionState.value?.rules?.canStartProgram === true);
const selectedProgramVersion = computed(() => {
  const currentId = String(selectedProgramVersionId.value || "").trim();
  return programVersions.value.find((programVersion) => String(programVersion.id) === currentId) || null;
});
const selectedProgramVersionSummary = computed(() => cleanProgramSummary(selectedProgramVersion.value));
const selectedProgramVersionSchedule = computed(() => (
  Array.isArray(selectedProgramVersion.value?.schedulePreview)
    ? selectedProgramVersion.value.schedulePreview
    : []
));
const startProgramDisabled = computed(() => {
  return (
    !canStartProgram.value ||
    !String(selectionModel.programVersionId || "").trim() ||
    !String(selectionModel.startsOn || "").trim() ||
    startProgramCommand.isRunning
  );
});
const isSelectionLoading = computed(() => Boolean(selectionResource.isInitialLoading.value));
const selectionLoadError = computed(() => String(selectionResource.loadError.value || "").trim());

const todayApiPath = computed(() => paths.api("/today"));
const todayResource = useEndpointResource({
  queryKey: computed(() => ["today", todayApiPath.value, activeAssignment.value?.id || "none"]),
  path: todayApiPath,
  enabled: computed(() => hasActiveAssignment.value),
  refreshOnPull: true,
  fallbackLoadError: "Unable to load today's training."
});

const startWorkoutCommand = useCommand({
  apiSuffix: "/today/start",
  writeMethod: "POST",
  fallbackRunError: "Unable to open this workout.",
  buildRawPayload: (_model, { context }) => ({
    scheduledForDate: String(context?.scheduledForDate || "").trim(),
    programAssignmentId: String(context?.programAssignmentId || "").trim()
  }),
  messages: {
    success: "Workout occurrence opened.",
    error: "Unable to open this workout."
  },
  async onRunSuccess(_response, { rawPayload }) {
    const scheduledForDate = String(rawPayload?.scheduledForDate || "").trim();
    if (!scheduledForDate) {
      await todayResource.reload();
      return;
    }
    await router.push(workoutDetailPagePath({
      scheduledForDate,
      programAssignmentId: rawPayload?.programAssignmentId || ""
    }));
  }
});

const markWorkoutDefinitelyMissedCommand = useCommand({
  apiSuffix: "/today/mark-definitely-missed",
  writeMethod: "POST",
  fallbackRunError: "Unable to mark this workout definitely missed.",
  buildRawPayload: (_model, { context }) => ({
    scheduledForDate: String(context?.scheduledForDate || "").trim(),
    programAssignmentId: String(context?.programAssignmentId || "").trim()
  }),
  messages: {
    success: "Workout marked definitely missed.",
    error: "Unable to mark this workout definitely missed."
  },
  async onRunSuccess() {
    await todayResource.reload();
  }
});

const todayState = computed(() => {
  const payload = todayResource.data.value;
  return payload && typeof payload === "object" ? payload : {};
});
const todayProjection = computed(() => todayState.value.today || null);
const todayWorkouts = computed(() => {
  const rows = Array.isArray(todayState.value.todayWorkouts) ? todayState.value.todayWorkouts : [];
  return rows.length > 0 ? rows : todayProjection.value ? [todayProjection.value] : [];
});
const overdueWorkouts = computed(() => (Array.isArray(todayState.value.overdue) ? todayState.value.overdue : []));
const todayLoadError = computed(() => String(todayResource.loadError.value || "").trim());
const isTodayLoading = computed(() => Boolean(hasActiveAssignment.value && todayResource.isInitialLoading.value));
const todayDate = computed(() => String(todayState.value.date || "").trim());
const activeProgramToggleLabel = computed(() => (activeProgramExpanded.value ? "Hide details" : "Show details"));
const activeProgramName = computed(() => String(activeAssignment.value?.program?.name || "Active program").trim());
const activeProgramSummary = computed(() => cleanProgramSummary(activeAssignment.value?.program));
const activeProgramStartedLabel = computed(() => formatStartedDate(activeAssignment.value?.startsOn));
const activeProgramSchedule = computed(() => (
  Array.isArray(activeAssignment.value?.program?.schedulePreview)
    ? activeAssignment.value.program.schedulePreview
    : []
));

function selectProgramCollection(programCollectionId) {
  const normalizedProgramCollectionId = String(programCollectionId || "").trim();
  selectedProgramCollectionId.value = normalizedProgramCollectionId;
  selectedProgramVersionId.value = "";
  selectionModel.programVersionId = "";
}

function isSelectedProgramCollection(programCollectionId) {
  const currentId = String(selectedProgramCollection.value?.id || "").trim();
  return currentId === String(programCollectionId || "").trim();
}

function selectProgramVersion(programVersionId) {
  const normalizedProgramVersionId = String(programVersionId || "").trim();
  selectedProgramVersionId.value = normalizedProgramVersionId;
  selectionModel.programVersionId = normalizedProgramVersionId;
}

function isSelectedProgramVersion(programVersionId) {
  return String(selectedProgramVersionId.value || "").trim() === String(programVersionId || "").trim();
}

function cleanProgramSummary(program = {}) {
  const rawSummary = String(program?.summary || program?.description || "").trim();
  const withoutCanonicalPrefix = rawSummary
    .replace(/^Canonical Convict Conditioning template:\s*/i, "")
    .trim();

  return withoutCanonicalPrefix
    ? `${withoutCanonicalPrefix.slice(0, 1).toUpperCase()}${withoutCanonicalPrefix.slice(1)}`
    : "";
}

function formatStartedDate(dateString = "") {
  const date = parseDateOnly(dateString);
  if (!date) {
    return "";
  }

  const weekday = date.toLocaleDateString("en-AU", { weekday: "long" });
  const formattedDate = date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return `Started ${weekday}, ${formattedDate}`;
}

function workSetLabel(item = {}) {
  const min = Number(item?.workSetsMin || 0);
  const max = Number(item?.workSetsMax || 0);
  return min > 0 && min === max ? `${min} working sets` : `${min}-${max} working sets`;
}

function formatDateLabel(dateString = "", { includeYear = false } = {}) {
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

function workoutDateLine(workout = {}) {
  return formatDateLabel(workout.scheduledForDate);
}

function workoutHeadline(workout = {}) {
  const status = String(workout.status || "").trim().toLowerCase();

  if (status === "rest_day") {
    return "Rest day";
  }
  if (status === "not_started_yet") {
    return "Starts later";
  }
  if (status === "in_progress") {
    return "Open workout";
  }
  if (status === "completed") {
    return "Completed";
  }
  if (status === "definitely_missed") {
    return "Definitely missed";
  }
  if (status === "overdue") {
    return "Overdue";
  }
  if (status === "scheduled") {
    return "";
  }

  return "Training day";
}

function workoutSupportLine(workout = {}) {
  const status = String(workout.status || "").trim().toLowerCase();

  if (status === "rest_day") {
    return overdueWorkouts.value.length > 0
      ? "Rest today. Clear older open work below when you are ready."
      : "No prescribed work today.";
  }
  if (status === "not_started_yet") {
    return activeAssignment.value?.startsOn
      ? `Your program starts ${formatDateLabel(activeAssignment.value.startsOn, { includeYear: true })}.`
      : "This program has not started yet.";
  }
  if (status === "in_progress") {
    return "Keep logging sets.";
  }
  if (status === "completed") {
    const performedDate = normalizeDateOnly(workout.performedOnDate);
    const scheduledDate = normalizeDateOnly(workout.scheduledForDate);
    return performedDate && performedDate !== scheduledDate
      ? `Finished ${formatDateLabel(performedDate)}.`
      : "";
  }
  if (status === "definitely_missed") {
    return "Marked missed.";
  }
  if (status === "overdue") {
    return "Still available to complete.";
  }
  if (status === "scheduled") {
    return "";
  }

  return "";
}

function workoutActionContext(workoutOrDate = {}) {
  if (typeof workoutOrDate === "string") {
    return {
      scheduledForDate: workoutOrDate,
      programAssignmentId: ""
    };
  }

  return {
    scheduledForDate: String(workoutOrDate?.scheduledForDate || "").trim(),
    programAssignmentId: String(workoutOrDate?.programAssignmentId || "").trim()
  };
}

function workoutDetailPagePath(workoutOrDate = {}) {
  const context = workoutActionContext(workoutOrDate);
  const query = context.programAssignmentId
    ? `?programAssignmentId=${encodeURIComponent(context.programAssignmentId)}`
    : "";
  return paths.page(`/workouts/${context.scheduledForDate}${query}`);
}

function isStartActionLoading(dateString = "") {
  return Boolean(startWorkoutCommand.isRunning && activeStartScheduledForDate.value === String(dateString || "").trim());
}

function isMarkMissedActionLoading(dateString = "") {
  return Boolean(
    markWorkoutDefinitelyMissedCommand.isRunning &&
    activeMissedScheduledForDate.value === String(dateString || "").trim()
  );
}

async function startSelectedProgram() {
  await startProgramCommand.run();
}

async function startWorkoutForDate(workoutOrDate) {
  const context = workoutActionContext(workoutOrDate);
  activeStartScheduledForDate.value = context.scheduledForDate;
  try {
    await startWorkoutCommand.run(context);
  } finally {
    activeStartScheduledForDate.value = "";
  }
}

async function openWorkoutDetail(workoutOrDate) {
  await router.push(workoutDetailPagePath(workoutOrDate));
}

async function markWorkoutDefinitelyMissed(workoutOrDate) {
  const context = workoutActionContext(workoutOrDate);
  activeMissedScheduledForDate.value = context.scheduledForDate;
  try {
    await markWorkoutDefinitelyMissedCommand.run(context);
  } finally {
    activeMissedScheduledForDate.value = "";
  }
}

function toggleActiveProgramExpanded() {
  activeProgramExpanded.value = !activeProgramExpanded.value;
}
</script>

<template>
  <section class="program-home-page d-flex flex-column ga-6">
    <v-alert
      v-if="selectionLoadError"
      type="error"
      variant="tonal"
      border="start"
      title="Unable to load your program state"
      :text="selectionLoadError"
    >
      <template #append>
        <v-btn variant="text" :loading="selectionResource.isFetching.value" @click="selectionResource.reload()">
          Retry
        </v-btn>
      </template>
    </v-alert>

    <v-skeleton-loader
      v-else-if="isSelectionLoading"
      type="article, card, card, card"
      class="program-home-page__skeleton"
    />

    <template v-else>
      <v-alert
        v-if="startProgramCommand.message"
        :type="startProgramCommand.messageType === 'error' ? 'error' : 'success'"
        variant="tonal"
        border="start"
        :text="startProgramCommand.message"
      />

      <template v-if="hasActiveAssignment">
        <v-alert
          v-if="todayLoadError"
          type="error"
          variant="tonal"
          border="start"
          title="Unable to load today's projection"
          :text="todayLoadError"
        >
          <template #append>
            <v-btn variant="text" :loading="todayResource.isFetching.value" @click="todayResource.reload()">
              Retry
            </v-btn>
          </template>
        </v-alert>

        <template v-else>
          <v-alert
            v-if="startWorkoutCommand.message"
            :type="startWorkoutCommand.messageType === 'error' ? 'error' : 'success'"
            variant="tonal"
            border="start"
            :text="startWorkoutCommand.message"
          />

          <v-alert
            v-if="markWorkoutDefinitelyMissedCommand.message"
            :type="markWorkoutDefinitelyMissedCommand.messageType === 'error' ? 'error' : 'success'"
            variant="tonal"
            border="start"
            :text="markWorkoutDefinitelyMissedCommand.message"
          />

          <v-card
            rounded="xl"
            elevation="1"
            border
            class="active-program-card"
          >
            <v-card-item class="active-program-card__header">
              <template #prepend>
                <v-avatar color="primary" variant="flat" rounded="lg" class="active-program-card__icon">
                  <v-icon :icon="mdiDumbbell" />
                </v-avatar>
              </template>
              <div class="active-program-card__title-block">
                <h2 class="active-program-card__title">{{ activeProgramName }}</h2>
                <p v-if="activeProgramExpanded && activeProgramStartedLabel" class="active-program-card__started mb-0">
                  {{ activeProgramStartedLabel }}
                </p>
              </div>
              <template #append>
                <v-btn
                  variant="tonal"
                  color="primary"
                  size="small"
                  :append-icon="activeProgramExpanded ? mdiChevronUp : mdiChevronDown"
                  :aria-expanded="String(activeProgramExpanded)"
                  @click="toggleActiveProgramExpanded"
                >
                  {{ activeProgramToggleLabel }}
                </v-btn>
              </template>
            </v-card-item>
            <v-expand-transition>
              <div v-if="activeProgramExpanded">
                <v-divider />
                <v-card-text class="active-program-card__body">
                  <p v-if="activeProgramSummary" class="active-program-card__summary mb-0">
                    {{ activeProgramSummary }}
                  </p>

                  <div class="active-program-card__schedule" aria-label="Weekly schedule">
                    <article
                      v-for="day in activeProgramSchedule"
                      :key="`active-${day.dayOfWeek}`"
                      class="active-program-day"
                      :class="{ 'active-program-day--rest': day.isRestDay }"
                    >
                      <h3 class="active-program-day__title">{{ day.dayLabel }}</h3>
                      <p v-if="day.isRestDay" class="active-program-day__rest mb-0">Rest</p>
                      <div v-else class="active-program-day__items">
                        <div
                          v-for="item in day.items"
                          :key="`active-${day.dayOfWeek}-${item.slotNumber}`"
                          class="active-program-exercise"
                        >
                          <div class="active-program-exercise__name">{{ item.exerciseName }}</div>
                          <div class="active-program-exercise__work">{{ workSetLabel(item) }}</div>
                        </div>
                      </div>
                    </article>
                  </div>
                </v-card-text>
              </div>
            </v-expand-transition>
          </v-card>

          <v-sheet rounded="xl" border class="start-program-card start-program-card--compact">
            <header class="start-program-card__header">
              <v-avatar color="secondary" variant="tonal" rounded="lg">
                <v-icon :icon="mdiCalendarStart" />
              </v-avatar>
              <div>
                <h3 class="start-program-card__title">Add another program</h3>
                <p class="start-program-card__copy mb-0">
                  Start another program without closing your current training.
                </p>
              </div>
            </header>

            <div class="start-program-card__controls">
              <v-select
                v-model="selectedProgramCollectionId"
                :items="programCollections"
                item-title="name"
                item-value="id"
                label="Collection"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
                @update:model-value="selectProgramCollection"
              />

              <v-select
                v-model="selectionModel.programVersionId"
                :items="programVersions"
                item-title="name"
                item-value="id"
                label="Program"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
                @update:model-value="selectProgramVersion"
              />

              <div class="start-program-card__date">
                <label class="text-body-2 text-medium-emphasis" for="add-starts-on-input">Start date</label>
                <v-text-field
                  id="add-starts-on-input"
                  v-model="selectionModel.startsOn"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                />
              </div>

              <v-btn
                color="primary"
                size="large"
                :prepend-icon="mdiFlagCheckered"
                :disabled="startProgramDisabled"
                :loading="startProgramCommand.isRunning"
                class="start-program-card__button"
                @click="startSelectedProgram"
              >
                Start
              </v-btn>
            </div>
          </v-sheet>

          <v-skeleton-loader
            v-if="isTodayLoading"
            type="article, card"
            class="program-home-page__skeleton"
          />

          <template v-else>
            <v-sheet
              v-for="todayWorkout in todayWorkouts"
              :key="`today-${todayWorkout.programAssignmentId || 'none'}-${todayWorkout.scheduledForDate}`"
              rounded="xl"
              border
              class="training-panel today-card"
            >
              <header class="training-panel__header">
                <div class="training-panel__identity">
                  <v-avatar
                    :color="todayWorkout?.status === 'rest_day' ? 'surface-variant' : 'secondary'"
                    variant="tonal"
                    rounded="lg"
                    class="training-panel__icon"
                  >
                    <v-icon :icon="todayWorkout?.status === 'rest_day' ? mdiSleep : mdiCalendarClock" />
                  </v-avatar>
                  <div class="training-panel__title-block">
                    <h3 class="training-panel__title">
                      {{ todayWorkout.programName ? `Today: ${todayWorkout.programName}` : "Today" }}
                    </h3>
                    <p class="training-panel__date mb-0">
                      {{ todayDate ? formatDateLabel(todayDate) : "Current date unavailable" }}
                    </p>
                  </div>
                </div>
                <v-chip
                  v-if="todayWorkout"
                  :color="workoutStatusColor(todayWorkout.status)"
                  variant="tonal"
                  label
                  class="training-panel__status"
                >
                  {{ workoutStatusLabel(todayWorkout.status) }}
                </v-chip>
              </header>

              <template v-if="todayWorkout">
                <WorkoutExercisePreviewList
                  v-if="Array.isArray(todayWorkout.exercises) && todayWorkout.exercises.length > 0"
                  :exercises="todayWorkout.exercises"
                  :key-prefix="`today-${todayWorkout.programAssignmentId}-${todayWorkout.scheduledForDate}`"
                  :stacked="smAndDown"
                  class="training-panel__exercise-list"
                />

                <section
                  class="training-panel__summary"
                  :class="{
                    'training-panel__summary--actionable': todayWorkout.status === 'scheduled',
                    'training-panel__summary--button-only': ['scheduled', 'in_progress'].includes(todayWorkout.status)
                  }"
                >
                  <div v-if="!['scheduled', 'in_progress'].includes(todayWorkout.status)" class="training-panel__copy">
                    <div class="training-panel__headline">{{ workoutHeadline(todayWorkout) }}</div>
                    <p v-if="workoutSupportLine(todayWorkout)" class="training-panel__support mb-0">
                      {{ workoutSupportLine(todayWorkout) }}
                    </p>
                  </div>
                  <div class="training-panel__actions">
                    <v-btn
                      v-if="todayWorkout.status === 'scheduled'"
                      color="primary"
                      variant="flat"
                      size="large"
                      rounded="pill"
                      aria-label="Start today's workout"
                      :prepend-icon="mdiPlayCircleOutline"
                      class="training-panel__primary-action"
                      :loading="isStartActionLoading(todayWorkout.scheduledForDate)"
                      @click="startWorkoutForDate(todayWorkout)"
                    >
                      Start workout
                    </v-btn>
                    <v-btn
                      v-else-if="todayWorkout.status === 'in_progress'"
                      color="primary"
                      variant="flat"
                      rounded="pill"
                      aria-label="Resume workout"
                      :prepend-icon="mdiPlayCircleOutline"
                      class="training-panel__primary-action"
                      @click="openWorkoutDetail(todayWorkout)"
                    >
                      Resume
                    </v-btn>
                  </div>
                </section>
              </template>

              <p v-else class="training-panel__empty mb-0">
                No daily projection is available yet.
              </p>
            </v-sheet>

            <v-sheet
              v-if="overdueWorkouts.length > 0"
              rounded="xl"
              border
              class="missed-panel overdue-card"
            >
              <header class="missed-panel__header">
                <div class="training-panel__identity">
                  <v-avatar color="warning" variant="tonal" rounded="lg" class="training-panel__icon">
                    <v-icon :icon="mdiTimerSand" />
                  </v-avatar>
                  <div class="training-panel__title-block">
                    <h3 class="training-panel__title">Missed workouts</h3>
                    <p class="training-panel__date mb-0">
                      Older scheduled days that still need a decision.
                    </p>
                  </div>
                </div>
                <v-chip color="warning" variant="tonal" label class="training-panel__status">
                  {{ overdueWorkouts.length }}
                </v-chip>
              </header>

              <div class="missed-panel__list">
                <article
                  v-for="workout in overdueWorkouts"
                  :key="`overdue-${workout.programAssignmentId || 'none'}-${workout.scheduledForDate}`"
                  class="missed-workout-row overdue-workout-card"
                  :data-scheduled-for-date="workout.scheduledForDate"
                >
                  <div class="missed-workout-row__topline">
                    <div class="missed-workout-row__date">
                      {{ workoutDateLine(workout) }}
                    </div>
                    <v-chip
                      :color="workoutStatusColor(workout.status)"
                      variant="tonal"
                      size="small"
                      label
                      class="missed-workout-row__status"
                    >
                      {{ workoutStatusLabel(workout.status) }}
                    </v-chip>
                  </div>
                  <div class="missed-workout-row__body">
                    <div v-if="workout.status !== 'in_progress'" class="missed-workout-row__copy">
                      <div class="missed-workout-row__headline">{{ workoutHeadline(workout) }}</div>
                      <p v-if="workoutSupportLine(workout)" class="missed-workout-row__support mb-0">
                        {{ workoutSupportLine(workout) }}
                      </p>
                    </div>
                  </div>

                  <WorkoutExercisePreviewList
                    :exercises="workout.exercises"
                    :key-prefix="`overdue-${workout.scheduledForDate}`"
                    :stacked="smAndDown"
                    class="missed-workout-row__exercises"
                  />

                  <div class="missed-workout-row__actions">
                    <template v-if="workout.status === 'overdue'">
                      <v-btn
                        color="primary"
                        variant="tonal"
                        aria-label="Start overdue workout"
                        :prepend-icon="mdiPlayCircleOutline"
                        :loading="isStartActionLoading(workout.scheduledForDate)"
                        @click="startWorkoutForDate(workout)"
                      >
                        Start
                      </v-btn>
                      <v-btn
                        color="error"
                        variant="text"
                        aria-label="Mark definitely missed"
                        :prepend-icon="mdiCheckCircleOutline"
                        :loading="isMarkMissedActionLoading(workout.scheduledForDate)"
                        @click="markWorkoutDefinitelyMissed(workout)"
                      >
                        Mark missed
                      </v-btn>
                    </template>
                    <v-btn
                      v-else-if="workout.status === 'in_progress'"
                      color="primary"
                      variant="flat"
                      rounded="pill"
                      aria-label="Resume workout"
                      :prepend-icon="mdiPlayCircleOutline"
                      class="training-panel__primary-action missed-workout-row__primary-action"
                      @click="openWorkoutDetail(workout)"
                    >
                      Resume
                    </v-btn>
                  </div>
                </article>
              </div>
            </v-sheet>
          </template>
        </template>
      </template>

      <template v-else>
        <section class="start-program-layout">
          <v-sheet rounded="xl" border class="start-program-card">
            <header class="start-program-card__header">
              <v-avatar color="secondary" variant="tonal" rounded="lg">
                <v-icon :icon="mdiCalendarStart" />
              </v-avatar>
              <div>
                <h3 class="start-program-card__title">Start your first program</h3>
                <p class="start-program-card__copy mb-0">
                  Pick a collection, choose a program, and set the first training day.
                </p>
              </div>
            </header>

            <div class="start-program-card__controls">
              <div class="start-program-card__date">
                <label class="text-body-2 text-medium-emphasis" for="starts-on-input">Start date</label>
                <v-text-field
                  id="starts-on-input"
                  v-model="selectionModel.startsOn"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                />
              </div>

              <v-btn
                color="primary"
                size="large"
                :prepend-icon="mdiFlagCheckered"
                :disabled="startProgramDisabled"
                :loading="startProgramCommand.isRunning"
                class="start-program-card__button"
                @click="startSelectedProgram"
              >
                Start Program
              </v-btn>
            </div>
          </v-sheet>

          <div class="program-selection-layout">
            <div class="program-picker" aria-label="Program collections">
              <button
                v-for="programCollection in programCollections"
                :key="programCollection.id"
                type="button"
                class="program-option"
                :class="{ 'program-option--selected': isSelectedProgramCollection(programCollection.id) }"
                @click="selectProgramCollection(programCollection.id)"
              >
                <span class="program-option__icon" aria-hidden="true">
                  <v-icon :icon="isSelectedProgramCollection(programCollection.id) ? mdiCheckBold : mdiBookOpenPageVariantOutline" />
                </span>
                <span class="program-option__body">
                  <span class="program-option__name">{{ programCollection.name }}</span>
                  <span class="program-option__meta">{{ programCollection.programs?.length || 0 }} programs</span>
                </span>
              </button>
            </div>

            <div class="program-picker" aria-label="Programs">
              <button
                v-for="programVersion in programVersions"
                :key="programVersion.id"
                type="button"
                class="program-option"
                :class="{ 'program-option--selected': isSelectedProgramVersion(programVersion.id) }"
                @click="selectProgramVersion(programVersion.id)"
              >
                <span class="program-option__icon" aria-hidden="true">
                  <v-icon :icon="isSelectedProgramVersion(programVersion.id) ? mdiCheckBold : mdiBookOpenPageVariantOutline" />
                </span>
                <span class="program-option__body">
                  <span class="program-option__name">{{ programVersion.name }}</span>
                  <span class="program-option__meta">{{ programVersion.difficultyLabel || `Version ${programVersion.versionLabel}` }}</span>
                </span>
              </button>
            </div>

            <v-sheet rounded="xl" border class="program-detail-panel">
              <template v-if="selectedProgramVersion">
                <header class="program-detail-panel__header">
                  <div>
                    <p class="program-detail-panel__eyebrow mb-0">Selected program</p>
                    <h3 class="program-detail-panel__title">{{ selectedProgramVersion.name }}</h3>
                  </div>
                  <v-chip color="primary" variant="tonal" label>
                    {{ selectedProgramVersion.difficultyLabel || `Version ${selectedProgramVersion.versionLabel}` }}
                  </v-chip>
                </header>

                <p v-if="selectedProgramVersionSummary" class="program-detail-panel__summary mb-0">
                  {{ selectedProgramVersionSummary }}
                </p>

                <div class="program-detail-panel__schedule">
                  <article
                    v-for="day in selectedProgramVersionSchedule"
                    :key="`program-version-${selectedProgramVersion.id}-${day.dayOfWeek}`"
                    class="program-detail-day"
                    :class="{ 'program-detail-day--rest': day.isRestDay }"
                  >
                    <div class="program-detail-day__title">{{ day.dayLabel }}</div>
                    <p v-if="day.isRestDay" class="program-detail-day__rest mb-0">Rest</p>
                    <div v-else class="program-detail-day__items">
                      <div
                        v-for="item in day.items"
                        :key="`program-version-${selectedProgramVersion.id}-${day.dayOfWeek}-${item.slotNumber}`"
                        class="program-detail-day__item"
                      >
                        <span>{{ item.exerciseName }}</span>
                        <span>{{ workSetLabel(item) }}</span>
                      </div>
                    </div>
                  </article>
                </div>
              </template>

              <div v-else class="program-detail-panel__empty">
                Choose a collection and a program to see its weekly rhythm.
              </div>
            </v-sheet>
          </div>
        </section>
      </template>
    </template>
  </section>
</template>

<style scoped>
.program-home-page__skeleton {
  border-radius: 1.5rem;
}

.active-program-card {
  background:
    radial-gradient(circle at top left, rgba(var(--v-theme-primary), 0.12), transparent 32rem),
    rgb(var(--v-theme-surface));
  overflow: hidden;
}

.active-program-card__header {
  align-items: center;
}

.active-program-card__icon {
  box-shadow: 0 0.75rem 1.5rem rgba(var(--v-theme-primary), 0.22);
}

.active-program-card__title-block {
  min-width: 0;
}

.active-program-card__title {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 760;
  letter-spacing: -0.04em;
  line-height: 1;
  margin: 0;
  overflow-wrap: anywhere;
}

.active-program-card__started {
  color: rgba(var(--v-theme-on-surface), 0.68);
  font-size: 0.94rem;
  margin-top: 0.35rem;
}

.active-program-card__body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.active-program-card__summary {
  color: rgba(var(--v-theme-on-surface), 0.72);
  font-size: 1rem;
  line-height: 1.55;
  max-width: 48rem;
}

.active-program-card__schedule {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
}

.active-program-day {
  background: rgba(var(--v-theme-surface-variant), 0.22);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 8.5rem;
  padding: 1rem;
}

.active-program-day--rest {
  background: rgba(var(--v-theme-surface-variant), 0.1);
}

.active-program-day__title {
  font-size: 0.95rem;
  font-weight: 720;
  letter-spacing: -0.01em;
  margin: 0;
}

.active-program-day__rest {
  color: rgba(var(--v-theme-on-surface), 0.52);
  font-size: 0.9rem;
}

.active-program-day__items {
  display: grid;
  gap: 0.65rem;
}

.active-program-exercise {
  display: grid;
  gap: 0.1rem;
}

.active-program-exercise__name {
  font-size: 1.05rem;
  font-weight: 680;
  line-height: 1.2;
}

.active-program-exercise__work {
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 0.9rem;
}

.start-program-card {
  background:
    linear-gradient(180deg, rgba(var(--v-theme-secondary), 0.08), transparent),
    rgb(var(--v-theme-surface));
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.start-program-layout {
  display: grid;
  gap: 1rem;
}

.start-program-card__header {
  align-items: center;
  display: flex;
  gap: 0.9rem;
}

.start-program-card__title {
  font-size: clamp(1.35rem, 3vw, 1.9rem);
  font-weight: 780;
  letter-spacing: -0.035em;
  line-height: 1.08;
  margin: 0;
}

.start-program-card__copy,
.program-detail-panel__summary,
.program-detail-day__rest {
  color: rgba(var(--v-theme-on-surface), 0.64);
}

.start-program-card__controls {
  align-items: end;
  display: grid;
  gap: 0.9rem;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
}

.start-program-card__date {
  display: grid;
  gap: 0.35rem;
}

.start-program-card__button {
  min-height: 48px;
}

.program-selection-layout {
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(12rem, 16rem) minmax(13rem, 18rem) minmax(0, 1fr);
}

.program-picker {
  display: grid;
  gap: 0.5rem;
}

.program-option {
  appearance: none;
  align-items: center;
  background: rgba(var(--v-theme-surface), 0.68);
  border: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.72));
  border-radius: 1rem;
  color: inherit;
  cursor: pointer;
  display: flex;
  gap: 0.75rem;
  min-height: 64px;
  padding: 0.75rem;
  text-align: left;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.program-option:hover {
  border-color: rgba(var(--v-theme-primary), 0.35);
  transform: translateY(-1px);
}

.program-option--selected {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.14);
}

.program-option__icon {
  align-items: center;
  background: rgba(var(--v-theme-primary), 0.1);
  border-radius: 0.75rem;
  color: rgb(var(--v-theme-primary));
  display: inline-flex;
  flex: 0 0 auto;
  height: 2.5rem;
  justify-content: center;
  width: 2.5rem;
}

.program-option__body {
  display: grid;
  gap: 0.15rem;
  min-width: 0;
}

.program-option__name {
  font-size: 1rem;
  font-weight: 740;
  line-height: 1.2;
}

.program-option__meta,
.program-detail-panel__eyebrow,
.program-detail-day__item span:last-child {
  color: rgba(var(--v-theme-on-surface), 0.58);
}

.program-option__meta {
  font-size: 0.86rem;
}

.program-detail-panel {
  background:
    radial-gradient(circle at top right, rgba(var(--v-theme-primary), 0.08), transparent 20rem),
    rgb(var(--v-theme-surface));
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.program-detail-panel__header {
  align-items: flex-start;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
}

.program-detail-panel__eyebrow {
  font-size: 0.76rem;
  font-weight: 760;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.program-detail-panel__title {
  font-size: clamp(1.35rem, 3vw, 1.85rem);
  font-weight: 780;
  letter-spacing: -0.035em;
  line-height: 1.1;
  margin: 0.15rem 0 0;
}

.program-detail-panel__summary {
  line-height: 1.5;
  max-width: 54rem;
}

.program-detail-panel__schedule {
  display: grid;
  gap: 0.65rem;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
}

.program-detail-day {
  background: rgba(var(--v-theme-surface-variant), 0.16);
  border-radius: 1rem;
  display: grid;
  gap: 0.55rem;
  padding: 0.85rem;
}

.program-detail-day--rest {
  background: rgba(var(--v-theme-surface-variant), 0.08);
}

.program-detail-day__title {
  font-weight: 740;
  line-height: 1.2;
}

.program-detail-day__items {
  display: grid;
  gap: 0.45rem;
}

.program-detail-day__item {
  display: grid;
  gap: 0.15rem;
}

.program-detail-day__item span:first-child {
  font-weight: 680;
  line-height: 1.25;
}

.program-detail-day__item span:last-child {
  font-size: 0.88rem;
}

.program-detail-panel__empty {
  color: rgba(var(--v-theme-on-surface), 0.62);
  padding: 1rem;
  text-align: center;
}

.today-card {
  background:
    linear-gradient(180deg, rgba(var(--v-theme-primary), 0.06), transparent),
    rgb(var(--v-theme-surface));
}

.overdue-card {
  background:
    linear-gradient(180deg, rgba(var(--v-theme-warning), 0.08), transparent),
    rgb(var(--v-theme-surface));
}

.training-panel,
.missed-panel {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.training-panel__header,
.missed-panel__header {
  align-items: center;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

.training-panel__identity {
  align-items: center;
  display: flex;
  gap: 0.9rem;
  min-width: 0;
}

.training-panel__icon {
  flex: 0 0 auto;
}

.training-panel__title-block {
  min-width: 0;
}

.training-panel__title {
  font-size: clamp(1.35rem, 3vw, 1.85rem);
  font-weight: 760;
  letter-spacing: -0.035em;
  line-height: 1.05;
  margin: 0;
}

.training-panel__date {
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 0.95rem;
  line-height: 1.35;
  margin-top: 0.2rem;
}

.training-panel__status {
  flex: 0 0 auto;
}

.training-panel__summary {
  align-items: center;
  background: rgba(var(--v-theme-surface), 0.66);
  border: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.72));
  border-radius: 1.5rem;
  display: flex;
  gap: 1.25rem;
  justify-content: space-between;
  padding: 1rem 1.1rem;
}

.training-panel__summary--actionable {
  background:
    radial-gradient(circle at 10% 10%, rgba(var(--v-theme-primary), 0.18), transparent 18rem),
    linear-gradient(135deg, rgba(var(--v-theme-secondary), 0.12), rgba(var(--v-theme-surface-variant), 0.22)),
    rgb(var(--v-theme-surface));
  border-color: rgba(var(--v-theme-primary), 0.2);
  box-shadow: 0 1rem 2.5rem rgba(var(--v-theme-primary), 0.12);
}

.training-panel__summary--button-only {
  background: transparent;
  border: 0;
  box-shadow: none;
  justify-content: flex-end;
  padding: 0;
}

.training-panel__copy,
.missed-workout-row__copy {
  min-width: 0;
}

.training-panel__headline {
  color: rgba(var(--v-theme-on-surface), 0.92);
  font-size: clamp(1.22rem, 3vw, 1.65rem);
  font-weight: 780;
  letter-spacing: -0.035em;
  line-height: 1.12;
}

.missed-workout-row__headline {
  color: rgba(var(--v-theme-on-surface), 0.92);
  font-size: 1.08rem;
  font-weight: 740;
  line-height: 1.25;
}

.training-panel__support,
.missed-workout-row__support,
.training-panel__empty {
  color: rgba(var(--v-theme-on-surface), 0.64);
  font-size: 0.95rem;
  line-height: 1.45;
  margin-top: 0.2rem;
}

.training-panel__actions,
.missed-workout-row__actions {
  align-items: center;
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
}

.training-panel__actions :deep(.v-btn),
.missed-workout-row__actions :deep(.v-btn) {
  min-height: 44px;
}

.training-panel__primary-action {
  box-shadow: 0 0.75rem 1.5rem rgba(var(--v-theme-primary), 0.24);
  min-height: 56px !important;
  padding-inline: 1.4rem;
}

.training-panel__exercise-list,
.missed-workout-row__exercises {
  background: rgba(var(--v-theme-surface-variant), 0.16);
  border-radius: 1.2rem;
  padding: 0.65rem;
}

.missed-panel__list {
  display: grid;
  gap: 0.75rem;
}

.missed-workout-row {
  background: rgba(var(--v-theme-surface), 0.68);
  border: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.72));
  border-radius: 1.25rem;
  display: grid;
  gap: 0.85rem;
  padding: 0.95rem;
}

.missed-workout-row__topline,
.missed-workout-row__body {
  align-items: start;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
}

.missed-workout-row__date {
  color: rgba(var(--v-theme-on-surface), 0.88);
  font-size: 1.02rem;
  font-weight: 720;
  line-height: 1.3;
}

.missed-workout-row__status {
  flex: 0 0 auto;
}

.missed-workout-row__primary-action {
  padding-inline: 1.4rem;
}

@media (max-width: 640px) {
  .active-program-card__header {
    align-items: flex-start;
  }

  .active-program-card__header :deep(.v-card-item__append) {
    padding-left: 0.5rem;
  }

  .active-program-card__header :deep(.v-btn) {
    min-height: 48px;
  }

  .active-program-card__schedule {
    grid-template-columns: 1fr;
  }

  .start-program-card,
  .program-detail-panel {
    padding: 0.85rem;
  }

  .start-program-card__header,
  .start-program-card__controls,
  .program-detail-panel__header {
    align-items: stretch;
    grid-template-columns: 1fr;
  }

  .start-program-card__header,
  .program-detail-panel__header {
    flex-direction: column;
  }

  .program-selection-layout {
    grid-template-columns: 1fr;
  }

  .program-detail-panel__schedule {
    grid-template-columns: 1fr;
  }

  .training-panel,
  .missed-panel {
    gap: 0.85rem;
    padding: 0.85rem;
  }

  .training-panel__header,
  .missed-panel__header {
    align-items: flex-start;
  }

  .training-panel__summary,
  .missed-workout-row__body {
    align-items: stretch;
    flex-direction: column;
  }

  .training-panel__actions,
  .missed-workout-row__actions {
    justify-content: flex-start;
  }

  .training-panel__actions :deep(.v-btn),
  .missed-workout-row__actions :deep(.v-btn) {
    min-height: 48px;
  }

  .training-panel__actions :deep(.v-btn),
  .missed-workout-row__primary-action {
    width: 100%;
  }
}
</style>
