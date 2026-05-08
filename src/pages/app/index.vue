<script setup>
import { computed, reactive, ref } from "vue";
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
import { localTodayDateString, parseDateOnly } from "@local/main/shared";
import { usePaths } from "@jskit-ai/users-web/client/composables/usePaths";
import { useCommand } from "@jskit-ai/users-web/client/composables/useCommand";
import { useEndpointResource } from "@jskit-ai/users-web/client/composables/useEndpointResource";

const {
  formatWorkSetLabel,
  workoutStatusColor,
  workoutStatusLabel
} = useConvictWorkoutPresentation();
const paths = usePaths();
const router = useRouter();
const { smAndDown } = useDisplay();

const selectionModel = reactive({
  programTemplateId: "",
  startsOn: localTodayDateString()
});
const selectedProgramTemplateId = ref("");
const activeProgramExpanded = ref(false);
const activeStartScheduledForDate = ref("");
const activeMissedScheduledForDate = ref("");

const selectionApiPath = computed(() => paths.api("/program-assignment"));
const selectionResource = useEndpointResource({
  queryKey: computed(() => ["program-assignment", selectionApiPath.value]),
  path: selectionApiPath,
  fallbackLoadError: "Unable to load program choices."
});

const startProgramCommand = useCommand({
  apiSuffix: "/program-assignment",
  writeMethod: "POST",
  fallbackRunError: "Unable to start this program.",
  buildRawPayload: () => ({
    programTemplateId: selectionModel.programTemplateId,
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
const programTemplates = computed(() => (Array.isArray(selectionState.value.programTemplates) ? selectionState.value.programTemplates : []));
const activeAssignment = computed(() => selectionState.value.activeAssignment || null);
const hasActiveAssignment = computed(() => Boolean(activeAssignment.value));
const canStartProgram = computed(() => selectionState.value?.rules?.canStartProgram === true && !hasActiveAssignment.value);
const selectedProgramTemplate = computed(() => {
  const currentId = String(selectedProgramTemplateId.value || "").trim();
  return programTemplates.value.find((programTemplate) => String(programTemplate.id) === currentId) || null;
});
const startProgramDisabled = computed(() => {
  return (
    !canStartProgram.value ||
    !String(selectionModel.programTemplateId || "").trim() ||
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
  fallbackLoadError: "Unable to load today's training."
});

const startWorkoutCommand = useCommand({
  apiSuffix: "/today/start",
  writeMethod: "POST",
  fallbackRunError: "Unable to open this workout.",
  buildRawPayload: (_model, { context }) => ({
    scheduledForDate: String(context?.scheduledForDate || "").trim()
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
    await router.push(workoutDetailPagePath(scheduledForDate));
  }
});

const markWorkoutDefinitelyMissedCommand = useCommand({
  apiSuffix: "/today/mark-definitely-missed",
  writeMethod: "POST",
  fallbackRunError: "Unable to mark this workout definitely missed.",
  buildRawPayload: (_model, { context }) => ({
    scheduledForDate: String(context?.scheduledForDate || "").trim()
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

function selectProgramTemplate(programTemplateId) {
  const normalizedProgramTemplateId = String(programTemplateId || "").trim();
  selectedProgramTemplateId.value = normalizedProgramTemplateId;
  selectionModel.programTemplateId = normalizedProgramTemplateId;
}

function isSelectedProgramTemplate(programTemplateId) {
  return String(selectedProgramTemplateId.value || "").trim() === String(programTemplateId || "").trim();
}

function scheduleText(day = {}) {
  if (day?.isRestDay === true) {
    return "Rest";
  }
  return Array.isArray(day?.items)
    ? day.items.map((item) => `${item.exerciseName} (${formatWorkSetLabel(item.workSetsMin, item.workSetsMax)})`).join(" • ")
    : "";
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

  return "Ready to train";
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
    return workout.performedOnDate
      ? `Finished ${formatDateLabel(workout.performedOnDate)}.`
      : "Finished.";
  }
  if (status === "definitely_missed") {
    return "Marked missed.";
  }
  if (status === "overdue") {
    return "Still available to complete.";
  }

  return "Start when ready.";
}

function workoutDetailPagePath(scheduledForDate) {
  return paths.page(`/workouts/${String(scheduledForDate || "").trim()}`);
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

async function startWorkoutForDate(scheduledForDate) {
  activeStartScheduledForDate.value = String(scheduledForDate || "").trim();
  try {
    await startWorkoutCommand.run({
      scheduledForDate: activeStartScheduledForDate.value
    });
  } finally {
    activeStartScheduledForDate.value = "";
  }
}

async function openWorkoutDetail(scheduledForDate) {
  await router.push(workoutDetailPagePath(scheduledForDate));
}

async function markWorkoutDefinitelyMissed(scheduledForDate) {
  activeMissedScheduledForDate.value = String(scheduledForDate || "").trim();
  try {
    await markWorkoutDefinitelyMissedCommand.run({
      scheduledForDate: activeMissedScheduledForDate.value
    });
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

          <v-skeleton-loader
            v-if="isTodayLoading"
            type="article, card"
            class="program-home-page__skeleton"
          />

          <template v-else>
            <v-sheet
              rounded="xl"
              border
              class="training-panel today-card"
            >
              <header class="training-panel__header">
                <div class="training-panel__identity">
                  <v-avatar
                    :color="todayProjection?.status === 'rest_day' ? 'surface-variant' : 'secondary'"
                    variant="tonal"
                    rounded="lg"
                    class="training-panel__icon"
                  >
                    <v-icon :icon="todayProjection?.status === 'rest_day' ? mdiSleep : mdiCalendarClock" />
                  </v-avatar>
                  <div class="training-panel__title-block">
                    <h3 class="training-panel__title">Today</h3>
                    <p class="training-panel__date mb-0">
                      {{ todayDate ? formatDateLabel(todayDate) : "Current date unavailable" }}
                    </p>
                  </div>
                </div>
                <v-chip
                  v-if="todayProjection"
                  :color="workoutStatusColor(todayProjection.status)"
                  variant="tonal"
                  label
                  class="training-panel__status"
                >
                  {{ workoutStatusLabel(todayProjection.status) }}
                </v-chip>
              </header>

              <template v-if="todayProjection">
                <section class="training-panel__summary">
                  <div class="training-panel__copy">
                    <div class="training-panel__headline">{{ workoutHeadline(todayProjection) }}</div>
                    <p class="training-panel__support mb-0">
                      {{ workoutSupportLine(todayProjection) }}
                    </p>
                  </div>
                  <div class="training-panel__actions">
                    <v-btn
                      v-if="todayProjection.status === 'scheduled'"
                      color="primary"
                      aria-label="Start today's workout"
                      :prepend-icon="mdiPlayCircleOutline"
                      :loading="isStartActionLoading(todayProjection.scheduledForDate)"
                      @click="startWorkoutForDate(todayProjection.scheduledForDate)"
                    >
                      Start
                    </v-btn>
                    <v-btn
                      v-else-if="todayProjection.status === 'in_progress'"
                      color="primary"
                      variant="tonal"
                      aria-label="Resume workout"
                      :prepend-icon="mdiPlayCircleOutline"
                      @click="openWorkoutDetail(todayProjection.scheduledForDate)"
                    >
                      Resume
                    </v-btn>
                  </div>
                </section>

                <WorkoutExercisePreviewList
                  v-if="Array.isArray(todayProjection.exercises) && todayProjection.exercises.length > 0"
                  :exercises="todayProjection.exercises"
                  :key-prefix="`today-${todayProjection.scheduledForDate}`"
                  :stacked="smAndDown"
                  class="training-panel__exercise-list"
                />
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
                  :key="`overdue-${workout.scheduledForDate}`"
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
                    <div class="missed-workout-row__copy">
                      <div class="missed-workout-row__headline">{{ workoutHeadline(workout) }}</div>
                      <p class="missed-workout-row__support mb-0">
                        {{ workoutSupportLine(workout) }}
                      </p>
                    </div>
                    <div class="missed-workout-row__actions">
                      <template v-if="workout.status === 'overdue'">
                        <v-btn
                          color="primary"
                          variant="tonal"
                          aria-label="Start overdue workout"
                          :prepend-icon="mdiPlayCircleOutline"
                          :loading="isStartActionLoading(workout.scheduledForDate)"
                          @click="startWorkoutForDate(workout.scheduledForDate)"
                        >
                          Start
                        </v-btn>
                        <v-btn
                          color="error"
                          variant="text"
                          aria-label="Mark definitely missed"
                          :prepend-icon="mdiCheckCircleOutline"
                          :loading="isMarkMissedActionLoading(workout.scheduledForDate)"
                          @click="markWorkoutDefinitelyMissed(workout.scheduledForDate)"
                        >
                          Mark missed
                        </v-btn>
                      </template>
                      <v-btn
                        v-else-if="workout.status === 'in_progress'"
                        color="primary"
                        variant="text"
                        aria-label="Resume workout"
                        :prepend-icon="mdiPlayCircleOutline"
                        @click="openWorkoutDetail(workout.scheduledForDate)"
                      >
                        Resume
                      </v-btn>
                    </div>
                  </div>

                  <WorkoutExercisePreviewList
                    :exercises="workout.exercises"
                    :key-prefix="`overdue-${workout.scheduledForDate}`"
                    :stacked="smAndDown"
                    class="missed-workout-row__exercises"
                  />
                </article>
              </div>
            </v-sheet>
          </template>
        </template>
      </template>

      <template v-else>
        <v-card rounded="xl" elevation="1" border class="start-program-card">
          <v-card-item>
            <template #prepend>
              <v-avatar color="secondary" variant="tonal" rounded="lg">
                <v-icon :icon="mdiCalendarStart" />
              </v-avatar>
            </template>
            <div class="d-flex flex-column ga-1">
              <h3 class="text-h5 mb-0">Start your first program</h3>
              <p class="text-body-2 text-medium-emphasis mb-0">
                Pick one official template and the date you want it to begin.
              </p>
            </div>
          </v-card-item>
          <v-divider />
          <v-card-text class="d-flex flex-column ga-4">
            <div class="d-flex flex-column ga-2">
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

            <v-alert
              v-if="selectedProgramTemplate"
              type="info"
              variant="tonal"
              border="start"
              :title="selectedProgramTemplate.name"
              :text="selectedProgramTemplate.summary"
            />

            <v-btn
              color="primary"
              size="large"
              :prepend-icon="mdiFlagCheckered"
              :disabled="startProgramDisabled"
              :loading="startProgramCommand.isRunning"
              @click="startSelectedProgram"
            >
              Start Program
            </v-btn>
          </v-card-text>
        </v-card>

        <div class="program-grid">
          <v-card
            v-for="programTemplate in programTemplates"
            :key="programTemplate.id"
            rounded="xl"
            elevation="1"
            border
            class="program-card"
            :class="{ 'program-card--selected': isSelectedProgramTemplate(programTemplate.id) }"
            @click="selectProgramTemplate(programTemplate.id)"
          >
            <v-card-item>
              <template #prepend>
                <v-avatar
                  :color="isSelectedProgramTemplate(programTemplate.id) ? 'primary' : 'surface-variant'"
                  :variant="isSelectedProgramTemplate(programTemplate.id) ? 'flat' : 'tonal'"
                  rounded="lg"
                >
                  <v-icon :icon="isSelectedProgramTemplate(programTemplate.id) ? mdiCheckBold : mdiBookOpenPageVariantOutline" />
                </v-avatar>
              </template>
              <v-card-title class="text-h6">{{ programTemplate.name }}</v-card-title>
              <v-card-subtitle>{{ programTemplate.difficultyLabel || "Program" }}</v-card-subtitle>
            </v-card-item>
            <v-card-text class="d-flex flex-column ga-4">
              <p class="text-body-2 text-medium-emphasis mb-0">{{ programTemplate.summary }}</p>

              <v-list lines="two" density="compact" class="program-card__schedule">
                <v-list-item
                  v-for="day in programTemplate.schedulePreview"
                  :key="`${programTemplate.id}-${day.dayOfWeek}`"
                  :subtitle="scheduleText(day)"
                  class="px-0"
                >
                  <template #prepend>
                    <v-chip
                      :color="day.isRestDay ? 'default' : 'primary'"
                      :variant="day.isRestDay ? 'tonal' : 'flat'"
                      label
                      size="small"
                      class="mr-3"
                    >
                      {{ day.dayLabel.slice(0, 3) }}
                    </v-chip>
                  </template>
                  <v-list-item-title>{{ day.dayLabel }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
            <v-card-actions class="px-4 pb-4">
              <v-btn
                :color="isSelectedProgramTemplate(programTemplate.id) ? 'primary' : 'default'"
                :variant="isSelectedProgramTemplate(programTemplate.id) ? 'flat' : 'outlined'"
                block
                @click.stop="selectProgramTemplate(programTemplate.id)"
              >
                {{ isSelectedProgramTemplate(programTemplate.id) ? "Selected" : "Choose" }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </div>
      </template>
    </template>
  </section>
</template>

<style scoped>
.program-home-page__skeleton {
  border-radius: 1.5rem;
}

.program-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.program-card {
  cursor: pointer;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease;
}

.program-card:hover {
  transform: translateY(-2px);
}

.program-card--selected {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 18px 40px rgba(var(--v-theme-primary), 0.12);
}

.program-card__schedule {
  background: rgba(var(--v-theme-surface-variant), 0.22);
  border-radius: 1rem;
  padding: 0.25rem 0.75rem 0.75rem;
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
  border-radius: 1.25rem;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  padding: 1rem;
}

.training-panel__copy,
.missed-workout-row__copy {
  min-width: 0;
}

.training-panel__headline,
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
}
</style>
