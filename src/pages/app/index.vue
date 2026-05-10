<script setup>
import { computed, reactive, ref, watch } from "vue";
import {
  mdiCalendarClock,
  mdiCheckCircleOutline,
  mdiChevronDown,
  mdiChevronUp,
  mdiDumbbell,
  mdiPlus,
  mdiPlayCircleOutline,
  mdiSleep,
  mdiTimerSand
} from "@mdi/js";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import ProgramSelectionPanel from "@/components/ProgramSelectionPanel.vue";
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
const activeProgramExpansion = reactive({});
const isAdditionalProgramPickerOpen = ref(false);
const activeStartWorkoutKey = ref("");
const activeMissedWorkoutKey = ref("");

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
const activeAssignments = computed(() => (Array.isArray(selectionState.value.activeAssignments) ? selectionState.value.activeAssignments : []));
const hasActiveAssignment = computed(() => activeAssignments.value.length > 0);
const activeProgramIdsSignature = computed(() => (
  activeAssignments.value
    .map((assignment) => String(assignment?.id || "").trim())
    .filter(Boolean)
    .join(",")
));
const activeSourceProgramIds = computed(() => new Set(
  activeAssignments.value
    .map((assignment) => (
      assignment?.program?.sourceProgramId ||
      assignment?.program?.sourceProgram?.id ||
      null
    ))
    .map((sourceProgramId) => String(sourceProgramId || "").trim())
    .filter(Boolean)
));
const selectedProgramCollection = computed(() => {
  const currentId = String(selectedProgramCollectionId.value || "").trim() || String(programCollections.value[0]?.id || "");
  return programCollections.value.find((collection) => String(collection.id) === currentId) || null;
});
const programVersions = computed(() => (
  (Array.isArray(selectedProgramCollection.value?.programs) ? selectedProgramCollection.value.programs : [])
    .map((programVersion) => ({
      ...programVersion,
      alreadyActive: Boolean(programVersion?.alreadyActive) || isProgramVersionAlreadyActive(programVersion)
    }))
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
      !versions.some((programVersion) => (
        String(programVersion.id || "") === currentProgramVersionId &&
        !programVersion.alreadyActive
      ))
    ) {
      selectedProgramVersionId.value = "";
      selectionModel.programVersionId = "";
    }
  },
  { immediate: true }
);
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
    selectedProgramVersion.value?.alreadyActive ||
    !String(selectionModel.startsOn || "").trim() ||
    startProgramCommand.isRunning
  );
});
const isSelectionLoading = computed(() => Boolean(selectionResource.isInitialLoading.value));
const selectionLoadError = computed(() => String(selectionResource.loadError.value || "").trim());
const programSelectionTitle = computed(() => (
  hasActiveAssignment.value ? "Add another program" : "Start your first program"
));
const programSelectionCopy = computed(() => (
  hasActiveAssignment.value
    ? "Pick a different program and keep both active in your training week."
    : "Pick a collection, choose a program, and set the first training day."
));

const todayApiPath = computed(() => paths.api("/today"));
const todayResource = useEndpointResource({
  queryKey: computed(() => ["today", todayApiPath.value, activeProgramIdsSignature.value || "none"]),
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
    success: "Workout opened.",
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

function selectProgramCollection(programCollectionId) {
  const normalizedProgramCollectionId = String(programCollectionId || "").trim();
  selectedProgramCollectionId.value = normalizedProgramCollectionId;
  selectedProgramVersionId.value = "";
  selectionModel.programVersionId = "";
}

function selectProgramVersion(programVersionId) {
  const normalizedProgramVersionId = String(programVersionId || "").trim();
  const programVersion = programVersions.value.find((item) => String(item.id || "") === normalizedProgramVersionId);
  if (programVersion?.alreadyActive) {
    return;
  }
  selectedProgramVersionId.value = normalizedProgramVersionId;
  selectionModel.programVersionId = normalizedProgramVersionId;
}

function isProgramVersionAlreadyActive(programVersion = {}) {
  const sourceProgramId = String(programVersion?.programId || "").trim();
  return Boolean(sourceProgramId && activeSourceProgramIds.value.has(sourceProgramId));
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
    const startsOn = workout.assignmentStartsOn || assignmentForWorkout(workout)?.startsOn || "";
    return startsOn
      ? `This program starts ${formatDateLabel(startsOn, { includeYear: true })}.`
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

function workoutActionKey(workoutOrDate = {}) {
  const context = workoutActionContext(workoutOrDate);
  return `${context.programAssignmentId || ""}:${context.scheduledForDate || ""}`;
}

function workoutDetailPagePath(workoutOrDate = {}) {
  const context = workoutActionContext(workoutOrDate);
  const query = context.programAssignmentId
    ? `?programAssignmentId=${encodeURIComponent(context.programAssignmentId)}`
    : "";
  return paths.page(`/workouts/${context.scheduledForDate}${query}`);
}

function isStartActionLoading(workoutOrDate = {}) {
  return Boolean(startWorkoutCommand.isRunning && activeStartWorkoutKey.value === workoutActionKey(workoutOrDate));
}

function isMarkMissedActionLoading(workoutOrDate = {}) {
  return Boolean(
    markWorkoutDefinitelyMissedCommand.isRunning &&
    activeMissedWorkoutKey.value === workoutActionKey(workoutOrDate)
  );
}

async function startSelectedProgram() {
  await startProgramCommand.run();
  isAdditionalProgramPickerOpen.value = false;
  selectedProgramVersionId.value = "";
  selectionModel.programVersionId = "";
}

async function startWorkoutForDate(workoutOrDate) {
  const context = workoutActionContext(workoutOrDate);
  activeStartWorkoutKey.value = workoutActionKey(workoutOrDate);
  try {
    await startWorkoutCommand.run(context);
  } finally {
    activeStartWorkoutKey.value = "";
  }
}

async function openWorkoutDetail(workoutOrDate) {
  await router.push(workoutDetailPagePath(workoutOrDate));
}

async function markWorkoutDefinitelyMissed(workoutOrDate) {
  const context = workoutActionContext(workoutOrDate);
  activeMissedWorkoutKey.value = workoutActionKey(workoutOrDate);
  try {
    await markWorkoutDefinitelyMissedCommand.run(context);
  } finally {
    activeMissedWorkoutKey.value = "";
  }
}

function assignmentId(assignment = {}) {
  return String(assignment?.id || "").trim();
}

function assignmentForWorkout(workout = {}) {
  const programAssignmentId = String(workout?.programAssignmentId || "").trim();
  return activeAssignments.value.find((assignment) => assignmentId(assignment) === programAssignmentId) || null;
}

function activeProgramName(assignment = {}) {
  return String(assignment?.program?.name || "Active program").trim();
}

function activeProgramSummary(assignment = {}) {
  return cleanProgramSummary(assignment?.program);
}

function activeProgramStartedLabel(assignment = {}) {
  return formatStartedDate(assignment?.startsOn);
}

function activeProgramSchedule(assignment = {}) {
  return Array.isArray(assignment?.program?.schedulePreview) ? assignment.program.schedulePreview : [];
}

function isActiveProgramExpanded(assignment = {}) {
  const id = assignmentId(assignment);
  return Boolean(id && activeProgramExpansion[id]);
}

function activeProgramToggleLabel(assignment = {}) {
  return isActiveProgramExpanded(assignment) ? "Hide details" : "Show details";
}

function toggleActiveProgramExpanded(assignment = {}) {
  const id = assignmentId(assignment);
  if (!id) {
    return;
  }
  activeProgramExpansion[id] = !activeProgramExpansion[id];
}

function workoutProgramName(workout = {}) {
  return String(workout?.programName || assignmentForWorkout(workout)?.program?.name || "Program").trim();
}

function openAdditionalProgramPicker() {
  selectedProgramVersionId.value = "";
  selectionModel.programVersionId = "";
  isAdditionalProgramPickerOpen.value = true;
}

function closeAdditionalProgramPicker() {
  selectedProgramVersionId.value = "";
  selectionModel.programVersionId = "";
  isAdditionalProgramPickerOpen.value = false;
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

          <v-sheet rounded="xl" border class="active-programs-panel">
            <header class="active-programs-panel__header">
              <div class="active-programs-panel__identity">
                <v-avatar color="primary" variant="flat" rounded="lg" class="active-programs-panel__icon">
                  <v-icon :icon="mdiDumbbell" />
                </v-avatar>
                <div class="active-programs-panel__title-block">
                  <p class="active-programs-panel__eyebrow mb-0">Active programs</p>
                  <h2 class="active-programs-panel__title">
                    {{ activeAssignments.length === 1 ? "1 program" : `${activeAssignments.length} programs` }}
                  </h2>
                </div>
              </div>

              <v-btn
                v-if="!isAdditionalProgramPickerOpen"
                color="primary"
                variant="tonal"
                size="small"
                rounded="pill"
                aria-label="Add another program"
                :prepend-icon="mdiPlus"
                class="active-programs-panel__add"
                @click="openAdditionalProgramPicker"
              >
                Add
              </v-btn>
            </header>

            <div class="active-programs-panel__list" aria-label="Active programs">
              <article
                v-for="assignment in activeAssignments"
                :key="`active-program-${assignment.id}`"
                class="active-program-row active-program-card"
              >
                <div class="active-program-row__summary">
                  <div class="active-program-row__copy">
                    <h3 class="active-program-row__title">{{ activeProgramName(assignment) }}</h3>
                    <p v-if="activeProgramSummary(assignment)" class="active-program-row__summary-copy mb-0">
                      {{ activeProgramSummary(assignment) }}
                    </p>
                  </div>
                  <v-btn
                    variant="text"
                    color="primary"
                    size="small"
                    :append-icon="isActiveProgramExpanded(assignment) ? mdiChevronUp : mdiChevronDown"
                    :aria-expanded="String(isActiveProgramExpanded(assignment))"
                    @click="toggleActiveProgramExpanded(assignment)"
                  >
                    {{ activeProgramToggleLabel(assignment) }}
                  </v-btn>
                </div>

                <v-expand-transition>
                  <div v-if="isActiveProgramExpanded(assignment)" class="active-program-row__details">
                    <p v-if="activeProgramStartedLabel(assignment)" class="active-program-row__started mb-0">
                      {{ activeProgramStartedLabel(assignment) }}
                    </p>

                    <div class="active-program-card__schedule" aria-label="Weekly schedule">
                      <article
                        v-for="day in activeProgramSchedule(assignment)"
                        :key="`active-${assignment.id}-${day.dayOfWeek}`"
                        class="active-program-day"
                        :class="{ 'active-program-day--rest': day.isRestDay }"
                      >
                        <h4 class="active-program-day__title">{{ day.dayLabel }}</h4>
                        <p v-if="day.isRestDay" class="active-program-day__rest mb-0">Rest</p>
                        <div v-else class="active-program-day__items">
                          <div
                            v-for="item in day.items"
                            :key="`active-${assignment.id}-${day.dayOfWeek}-${item.slotNumber}`"
                            class="active-program-exercise"
                          >
                            <div class="active-program-exercise__name">{{ item.exerciseName }}</div>
                            <div class="active-program-exercise__work">{{ workSetLabel(item) }}</div>
                          </div>
                        </div>
                      </article>
                    </div>
                  </div>
                </v-expand-transition>
              </article>
            </div>
          </v-sheet>

          <ProgramSelectionPanel
            v-if="isAdditionalProgramPickerOpen"
            :title="programSelectionTitle"
            :copy="programSelectionCopy"
            :starts-on="selectionModel.startsOn"
            :program-collections="programCollections"
            :program-versions="programVersions"
            :selected-program-collection-id="selectedProgramCollectionId"
            :selected-program-version-id="selectedProgramVersionId"
            :selected-program-version="selectedProgramVersion"
            :selected-program-version-summary="selectedProgramVersionSummary"
            :selected-program-version-schedule="selectedProgramVersionSchedule"
            :can-start="!startProgramDisabled"
            :is-starting="startProgramCommand.isRunning"
            show-cancel
            @select-collection="selectProgramCollection"
            @select-program="selectProgramVersion"
            @update:starts-on="selectionModel.startsOn = $event"
            @start="startSelectedProgram"
            @cancel="closeAdditionalProgramPicker"
          />

          <v-skeleton-loader
            v-if="isTodayLoading"
            type="article, card"
            class="program-home-page__skeleton"
          />

          <template v-else>
            <section class="today-section" aria-labelledby="today-section-title">
              <header class="today-section__header">
                <div>
                  <h2 id="today-section-title" class="today-section__title">Today</h2>
                  <p class="today-section__date mb-0">
                    {{ todayDate ? formatDateLabel(todayDate) : "Current date unavailable" }}
                  </p>
                </div>
              </header>

              <div class="today-section__list">
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
                          {{ workoutProgramName(todayWorkout) }}
                        </h3>
                        <p class="training-panel__date mb-0">
                          {{ workoutHeadline(todayWorkout) || "Training day" }}
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
                          :loading="isStartActionLoading(todayWorkout)"
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
              </div>
            </section>

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
                    <div class="missed-workout-row__identity">
                      <div class="missed-workout-row__program">
                        {{ workoutProgramName(workout) }}
                      </div>
                      <div class="missed-workout-row__date">
                        {{ workoutDateLine(workout) }}
                      </div>
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
                        :loading="isStartActionLoading(workout)"
                        @click="startWorkoutForDate(workout)"
                      >
                        Start
                      </v-btn>
                      <v-btn
                        color="error"
                        variant="text"
                        aria-label="Mark definitely missed"
                        :prepend-icon="mdiCheckCircleOutline"
                        :loading="isMarkMissedActionLoading(workout)"
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
        <ProgramSelectionPanel
          :title="programSelectionTitle"
          :copy="programSelectionCopy"
          :starts-on="selectionModel.startsOn"
          :program-collections="programCollections"
          :program-versions="programVersions"
          :selected-program-collection-id="selectedProgramCollectionId"
          :selected-program-version-id="selectedProgramVersionId"
          :selected-program-version="selectedProgramVersion"
          :selected-program-version-summary="selectedProgramVersionSummary"
          :selected-program-version-schedule="selectedProgramVersionSchedule"
          :can-start="!startProgramDisabled"
          :is-starting="startProgramCommand.isRunning"
          @select-collection="selectProgramCollection"
          @select-program="selectProgramVersion"
          @update:starts-on="selectionModel.startsOn = $event"
          @start="startSelectedProgram"
        />
      </template>
    </template>
  </section>
</template>

<style scoped>
.program-home-page__skeleton {
  border-radius: 1.5rem;
}

.active-programs-panel {
  background:
    radial-gradient(circle at top left, rgba(var(--v-theme-primary), 0.12), transparent 32rem),
    rgb(var(--v-theme-surface));
  display: grid;
  gap: 0.85rem;
  overflow: hidden;
  padding: 0.9rem;
}

.active-programs-panel__header {
  align-items: center;
  display: flex;
  gap: 0.9rem;
  justify-content: space-between;
}

.active-programs-panel__identity {
  align-items: center;
  display: flex;
  gap: 0.85rem;
  min-width: 0;
}

.active-programs-panel__icon {
  box-shadow: 0 0.75rem 1.5rem rgba(var(--v-theme-primary), 0.22);
}

.active-programs-panel__title-block {
  min-width: 0;
}

.active-programs-panel__eyebrow {
  color: rgba(var(--v-theme-on-surface), 0.56);
  font-size: 0.76rem;
  font-weight: 760;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.active-programs-panel__title {
  font-size: clamp(1.22rem, 3vw, 1.65rem);
  font-weight: 760;
  letter-spacing: -0.03em;
  line-height: 1.05;
  margin: 0;
}

.active-programs-panel__add {
  flex: 0 0 auto;
  min-height: 48px;
}

.active-programs-panel__list {
  display: grid;
  gap: 0.65rem;
}

.active-program-row {
  background: rgba(var(--v-theme-surface), 0.7);
  border: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.72));
  border-radius: 1.15rem;
  display: grid;
  gap: 0.75rem;
  padding: 0.85rem;
}

.active-program-row__summary {
  align-items: center;
  display: flex;
  gap: 0.85rem;
  justify-content: space-between;
}

.active-program-row__copy {
  display: grid;
  gap: 0.2rem;
  min-width: 0;
}

.active-program-row__title {
  font-size: clamp(1.15rem, 3vw, 1.45rem);
  font-weight: 760;
  letter-spacing: -0.03em;
  line-height: 1.08;
  margin: 0;
  overflow-wrap: anywhere;
}

.active-program-row__summary-copy,
.active-program-row__started {
  color: rgba(var(--v-theme-on-surface), 0.66);
  font-size: 0.94rem;
  line-height: 1.4;
}

.active-program-row__details {
  border-top: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.6));
  display: grid;
  gap: 0.85rem;
  padding-top: 0.85rem;
}

.active-program-card__schedule {
  display: grid;
  gap: 0.6rem;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
}

.active-program-day {
  background: rgba(var(--v-theme-surface-variant), 0.22);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 0.95rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-height: 6.4rem;
  padding: 0.75rem;
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
  font-size: 1rem;
  font-weight: 680;
  line-height: 1.2;
}

.active-program-exercise__work {
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 0.9rem;
}

.today-section {
  display: grid;
  gap: 0.85rem;
}

.today-section__header {
  align-items: end;
  display: flex;
  justify-content: space-between;
  padding-inline: 0.15rem;
}

.today-section__date {
  color: rgba(var(--v-theme-on-surface), 0.56);
  font-size: 0.95rem;
  line-height: 1.35;
  margin-top: 0.15rem;
}

.today-section__title {
  font-size: clamp(1.45rem, 4vw, 2.15rem);
  font-weight: 780;
  letter-spacing: -0.04em;
  line-height: 1.06;
  margin: 0;
}

.today-section__list {
  display: grid;
  gap: 0.85rem;
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

.missed-workout-row__identity {
  display: grid;
  gap: 0.15rem;
  min-width: 0;
}

.missed-workout-row__program {
  color: rgba(var(--v-theme-on-surface), 0.88);
  font-size: 1.02rem;
  font-weight: 720;
  line-height: 1.3;
}

.missed-workout-row__date {
  color: rgba(var(--v-theme-on-surface), 0.58);
  font-size: 0.9rem;
  line-height: 1.3;
}

.missed-workout-row__status {
  flex: 0 0 auto;
}

.missed-workout-row__primary-action {
  padding-inline: 1.4rem;
}

@media (max-width: 640px) {
  .active-programs-panel__header,
  .active-program-row__summary {
    align-items: flex-start;
  }

  .active-program-card__schedule {
    grid-template-columns: 1fr;
  }

  .active-program-row__summary {
    flex-direction: column;
  }

  .active-program-row__summary :deep(.v-btn) {
    align-self: flex-start;
    min-height: 48px;
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
