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
  mdiSkipForwardOutline,
  mdiSleep,
  mdiTimerSand
} from "@mdi/js";
import { useRouter } from "vue-router";
import WorkoutExercisePreviewList from "@/components/WorkoutExercisePreviewList.vue";
import WorkspaceNotFoundCard from "@/components/WorkspaceNotFoundCard.vue";
import { useConvictWorkoutPresentation } from "@/composables/useConvictWorkoutPresentation";
import { useWorkspaceNotFoundState } from "@/composables/useWorkspaceNotFoundState";
import { localTodayDateString } from "@local/main/shared";
import { usePaths } from "@jskit-ai/users-web/client/composables/usePaths";
import { useCommand } from "@jskit-ai/users-web/client/composables/useCommand";
import { useEndpointResource } from "@jskit-ai/users-web/client/composables/useEndpointResource";

const { workspaceUnavailable, workspaceUnavailableMessage } = useWorkspaceNotFoundState();
const {
  formatWorkSetLabel,
  workoutStatusColor,
  workoutStatusLabel
} = useConvictWorkoutPresentation();
const paths = usePaths();
const router = useRouter();

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

function workoutDateLabel(workout = {}) {
  const dayLabel = String(workout.dayLabel || "").trim();
  const scheduledForDate = String(workout.scheduledForDate || "").trim();
  return [dayLabel, scheduledForDate].filter(Boolean).join(" • ");
}

function workoutSummary(workout = {}) {
  const status = String(workout.status || "").trim().toLowerCase();
  if (status === "rest_day") {
    return overdueWorkouts.value.length > 0
      ? "Today is a rest day, but you still have overdue work waiting below."
      : "No prescribed work today. Use the day to rest and recover.";
  }

  if (status === "not_started_yet") {
    return `Your assignment starts on ${workout.scheduledForDate}. No workout is scheduled before then.`;
  }

  if (status === "in_progress") {
    return "This workout occurrence is open. Resume it to keep logging sets.";
  }

  if (status === "completed") {
    return `Completed${workout.performedOnDate ? ` on ${workout.performedOnDate}` : ""}.`;
  }

  if (status === "definitely_missed") {
    return "This workout was explicitly marked definitely missed.";
  }

  if (status === "overdue") {
    return "This workout should have happened earlier and is still available to complete.";
  }

  return "This workout is ready to be opened.";
}

function workoutDetailPagePath(scheduledForDate) {
  return {
    name: "/w/[workspaceSlug]/workouts/[scheduledForDate]",
    params: {
      workspaceSlug: String(paths.routeParams.value.workspaceSlug || "").trim(),
      scheduledForDate: String(scheduledForDate || "").trim()
    }
  };
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
  <WorkspaceNotFoundCard
    v-if="workspaceUnavailable"
    :message="workspaceUnavailableMessage"
    surface-label="App"
  />
  <section v-else class="program-home-page d-flex flex-column ga-6">
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
            <v-card-item>
              <template #prepend>
                <v-avatar color="primary" variant="tonal" rounded="lg">
                  <v-icon :icon="mdiDumbbell" />
                </v-avatar>
              </template>
              <div class="d-flex flex-column ga-1">
                <h3 class="text-h5 mb-0">Your active program</h3>
                <p v-if="activeProgramExpanded" class="text-body-2 text-medium-emphasis mb-0">
                  This assignment now drives the daily Today view and overdue projection for this cell.
                </p>
                <div v-else class="d-flex flex-wrap ga-2 align-center">
                  <v-chip color="primary" variant="tonal" size="small" label>
                    {{ activeAssignment?.program?.name || "Active" }}
                  </v-chip>
                  <v-chip color="secondary" variant="tonal" size="small" label>
                    Starts {{ activeAssignment?.startsOn }}
                  </v-chip>
                </div>
              </div>
              <template #append>
                <v-btn
                  variant="text"
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
                <v-card-text class="d-flex flex-column ga-5">
                  <div class="d-flex flex-wrap ga-3 align-center">
                    <div class="d-flex flex-column ga-1">
                      <span class="text-overline text-medium-emphasis">Program</span>
                      <strong class="text-h6">{{ activeAssignment?.program?.name }}</strong>
                    </div>
                    <v-chip color="primary" variant="tonal" label>
                      {{ activeAssignment?.program?.difficultyLabel || "Active" }}
                    </v-chip>
                    <v-chip color="secondary" variant="tonal" label>
                      Starts {{ activeAssignment?.startsOn }}
                    </v-chip>
                    <v-chip v-if="activeAssignment?.workspace?.name" color="info" variant="tonal" label>
                      Cell {{ activeAssignment.workspace.name }}
                    </v-chip>
                  </div>

                  <p class="text-body-1 text-medium-emphasis mb-0">
                    {{ activeAssignment?.program?.summary }}
                  </p>

                  <v-list lines="two" density="comfortable" class="active-program-card__schedule">
                    <v-list-subheader>Weekly schedule</v-list-subheader>
                    <v-list-item
                      v-for="day in activeAssignment?.program?.schedulePreview || []"
                      :key="`active-${day.dayOfWeek}`"
                      :subtitle="scheduleText(day)"
                    >
                      <template #prepend>
                        <v-avatar
                          :color="day.isRestDay ? 'surface-variant' : 'primary'"
                          :variant="day.isRestDay ? 'tonal' : 'flat'"
                          size="30"
                        >
                          {{ day.dayLabel.slice(0, 1) }}
                        </v-avatar>
                      </template>
                      <v-list-item-title>{{ day.dayLabel }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
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
            <v-card
              rounded="xl"
              elevation="1"
              border
              class="today-card"
            >
              <v-card-item>
                <template #prepend>
                  <v-avatar
                    :color="todayProjection?.status === 'rest_day' ? 'surface-variant' : 'secondary'"
                    variant="tonal"
                    rounded="lg"
                  >
                    <v-icon :icon="todayProjection?.status === 'rest_day' ? mdiSleep : mdiCalendarClock" />
                  </v-avatar>
                </template>
                <div class="d-flex flex-column ga-1">
                  <h3 class="text-h5 mb-0">Today</h3>
                  <p class="text-body-2 text-medium-emphasis mb-0">
                    {{ todayDate || "Current date unavailable" }}
                  </p>
                </div>
              </v-card-item>
              <v-divider />
              <v-card-text class="d-flex flex-column ga-4">
                <template v-if="todayProjection">
                  <div class="d-flex flex-wrap ga-2 align-center">
                    <v-chip :color="workoutStatusColor(todayProjection.status)" variant="tonal" label>
                      {{ workoutStatusLabel(todayProjection.status) }}
                    </v-chip>
                    <v-chip v-if="todayProjection.programName" color="primary" variant="tonal" label>
                      {{ todayProjection.programName }}
                    </v-chip>
                    <v-chip v-if="todayProjection.scheduledForDate" color="secondary" variant="tonal" label>
                      {{ workoutDateLabel(todayProjection) }}
                    </v-chip>
                    <v-chip
                      v-if="todayProjection.performedOnDate"
                      color="info"
                      variant="tonal"
                      label
                    >
                      Performed {{ todayProjection.performedOnDate }}
                    </v-chip>
                  </div>

                  <p class="text-body-1 text-medium-emphasis mb-0">
                    {{ workoutSummary(todayProjection) }}
                  </p>

                  <WorkoutExercisePreviewList
                    v-if="Array.isArray(todayProjection.exercises) && todayProjection.exercises.length > 0"
                    :exercises="todayProjection.exercises"
                    :key-prefix="`today-${todayProjection.scheduledForDate}`"
                    class="today-card__exercise-list"
                  />

                  <div
                    v-if="todayProjection.status === 'scheduled'"
                    class="d-flex flex-wrap ga-3 align-center"
                  >
                    <v-btn
                      color="primary"
                      :prepend-icon="mdiPlayCircleOutline"
                      :loading="isStartActionLoading(todayProjection.scheduledForDate)"
                      @click="startWorkoutForDate(todayProjection.scheduledForDate)"
                    >
                      Start today's workout
                    </v-btn>
                  </div>

                  <v-alert
                    v-else-if="todayProjection.status === 'in_progress'"
                    type="info"
                    variant="tonal"
                    border="start"
                    text="The occurrence is open. Resume it to keep logging sets."
                  >
                    <template #append>
                      <v-btn
                        color="primary"
                        variant="text"
                        :prepend-icon="mdiPlayCircleOutline"
                        @click="openWorkoutDetail(todayProjection.scheduledForDate)"
                      >
                        Resume workout
                      </v-btn>
                    </template>
                  </v-alert>
                </template>

                <p v-else class="text-body-1 text-medium-emphasis mb-0">
                  No daily projection is available yet.
                </p>
              </v-card-text>
            </v-card>

            <v-card
              v-if="overdueWorkouts.length > 0"
              rounded="xl"
              elevation="1"
              border
              class="overdue-card"
            >
              <v-card-item>
                <template #prepend>
                  <v-avatar color="warning" variant="tonal" rounded="lg">
                    <v-icon :icon="mdiTimerSand" />
                  </v-avatar>
                </template>
                <div class="d-flex flex-column ga-1">
                  <h3 class="text-h5 mb-0">Missed workouts</h3>
                  <p class="text-body-2 text-medium-emphasis mb-0">
                    These scheduled workouts are still actionable until you complete them or explicitly mark them definitely missed.
                  </p>
                </div>
              </v-card-item>
              <v-divider />
              <v-card-text class="d-flex flex-column ga-4">
                <div class="overdue-grid">
                  <v-card
                    v-for="workout in overdueWorkouts"
                    :key="`overdue-${workout.scheduledForDate}`"
                    rounded="xl"
                    elevation="0"
                    border
                    class="overdue-workout-card"
                  >
                    <v-card-item>
                      <template #prepend>
                        <v-avatar :color="workoutStatusColor(workout.status)" variant="tonal" rounded="lg">
                          <v-icon :icon="workout.status === 'in_progress' ? mdiPlayCircleOutline : mdiSkipForwardOutline" />
                        </v-avatar>
                      </template>
                      <div class="d-flex flex-column ga-1">
                        <h4 class="text-h6 mb-0">{{ workoutDateLabel(workout) }}</h4>
                        <p class="text-body-2 text-medium-emphasis mb-0">
                          {{ workoutSummary(workout) }}
                        </p>
                      </div>
                    </v-card-item>
                    <v-divider />
                    <v-card-text class="d-flex flex-column ga-4">
                      <div class="d-flex flex-wrap ga-2 align-center">
                        <v-chip :color="workoutStatusColor(workout.status)" variant="tonal" size="small" label>
                          {{ workoutStatusLabel(workout.status) }}
                        </v-chip>
                        <v-chip v-if="workout.programName" color="primary" variant="tonal" size="small" label>
                          {{ workout.programName }}
                        </v-chip>
                        <v-chip
                          v-if="workout.performedOnDate"
                          color="info"
                          variant="tonal"
                          size="small"
                          label
                        >
                          Performed {{ workout.performedOnDate }}
                        </v-chip>
                      </div>

                      <WorkoutExercisePreviewList
                        :exercises="workout.exercises"
                        :key-prefix="`overdue-${workout.scheduledForDate}`"
                        class="today-card__exercise-list"
                      />

                      <div
                        v-if="workout.status === 'overdue'"
                        class="d-flex flex-wrap ga-3"
                      >
                        <v-btn
                          color="primary"
                          :prepend-icon="mdiPlayCircleOutline"
                          :loading="isStartActionLoading(workout.scheduledForDate)"
                          @click="startWorkoutForDate(workout.scheduledForDate)"
                        >
                          Start overdue workout
                        </v-btn>
                        <v-btn
                          color="error"
                          variant="tonal"
                          :prepend-icon="mdiCheckCircleOutline"
                          :loading="isMarkMissedActionLoading(workout.scheduledForDate)"
                          @click="markWorkoutDefinitelyMissed(workout.scheduledForDate)"
                        >
                          Mark definitely missed
                        </v-btn>
                      </div>

                      <v-alert
                        v-else-if="workout.status === 'in_progress'"
                        type="info"
                        variant="tonal"
                        border="start"
                        text="This overdue workout is already open. Resume it to keep logging sets."
                      >
                        <template #append>
                          <v-btn
                            color="primary"
                            variant="text"
                            :prepend-icon="mdiPlayCircleOutline"
                            @click="openWorkoutDetail(workout.scheduledForDate)"
                          >
                            Resume workout
                          </v-btn>
                        </template>
                      </v-alert>
                    </v-card-text>
                  </v-card>
                </div>
              </v-card-text>
            </v-card>
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

.program-grid,
.overdue-grid {
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

.program-card__schedule,
.active-program-card__schedule,
.today-card__exercise-list {
  background: rgba(var(--v-theme-surface-variant), 0.22);
  border-radius: 1rem;
  padding: 0.25rem 0.75rem 0.75rem;
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

.overdue-workout-card {
  background: rgba(var(--v-theme-surface-variant), 0.12);
}

@media (max-width: 640px) {
}
</style>
