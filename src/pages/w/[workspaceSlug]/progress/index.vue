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
import { computed } from "vue";
import {
  mdiChartTimelineVariant,
  mdiFlagCheckered,
  mdiRunFast,
  mdiStairsUp
} from "@mdi/js";
import WorkspaceNotFoundCard from "@/components/WorkspaceNotFoundCard.vue";
import { useApplyAdvancementCommand } from "@/composables/useApplyAdvancementCommand";
import { useConvictWorkoutPresentation } from "@/composables/useConvictWorkoutPresentation";
import { useWorkspaceNotFoundState } from "@/composables/useWorkspaceNotFoundState";
import { usePaths } from "@jskit-ai/users-web/client/composables/usePaths";
import { useEndpointResource } from "@jskit-ai/users-web/client/composables/useEndpointResource";

const { workspaceUnavailable, workspaceUnavailableMessage } = useWorkspaceNotFoundState();
const { exerciseDetailLine, progressionTargetLabel } = useConvictWorkoutPresentation();
const paths = usePaths();

const progressApiPath = computed(() => paths.api("/progress"));
const progressResource = useEndpointResource({
  queryKey: computed(() => ["progress", progressApiPath.value]),
  path: progressApiPath,
  fallbackLoadError: "Unable to load progress."
});

const { applyAdvancement, isApplyingAdvancement } = useApplyAdvancementCommand({
  async onSuccess() {
    await progressResource.reload();
  }
});

const progressState = computed(() => {
  const payload = progressResource.data.value;
  return payload && typeof payload === "object" ? payload : {};
});
const summary = computed(() => progressState.value.summary || {});
const progressCards = computed(() => (Array.isArray(progressState.value.progress) ? progressState.value.progress : []));
const isInitialLoading = computed(() => Boolean(progressResource.isInitialLoading.value));
const isRefreshing = computed(() => Boolean(progressResource.isRefetching.value));
const loadError = computed(() => String(progressResource.loadError.value || "").trim());

const summaryCards = computed(() => ([
  {
    key: "total",
    label: "Exercise families",
    value: Number(summary.value.totalExercises || 0),
    icon: mdiChartTimelineVariant,
    color: "primary"
  },
  {
    key: "started",
    label: "Started",
    value: Number(summary.value.startedExercises || 0),
    icon: mdiRunFast,
    color: "info"
  },
  {
    key: "ready",
    label: "Ready to advance",
    value: Number(summary.value.readyToAdvanceExercises || 0),
    icon: mdiFlagCheckered,
    color: "success"
  }
]));

function progressStatusLabel(status = "") {
  switch (String(status || "").trim().toLowerCase()) {
    case "ready_to_advance":
      return "Ready to advance";
    case "in_progress":
      return "In progress";
    default:
      return "Not started";
  }
}

function progressStatusColor(status = "") {
  switch (String(status || "").trim().toLowerCase()) {
    case "ready_to_advance":
      return "success";
    case "in_progress":
      return "info";
    default:
      return "surface-variant";
  }
}

function lastCompletedLabel(exercise = {}) {
  const scheduledForDate = String(exercise.lastCompletedScheduledForDate || "").trim();
  const performedOnDate = String(exercise.lastPerformedOnDate || "").trim();

  if (scheduledForDate && performedOnDate && scheduledForDate !== performedOnDate) {
    return `Last completed ${scheduledForDate} • performed ${performedOnDate}`;
  }

  if (scheduledForDate) {
    return `Last completed ${scheduledForDate}`;
  }

  if (performedOnDate) {
    return `Last completed ${performedOnDate}`;
  }

  return "No completed workout yet.";
}

</script>

<template>
  <section class="progress-page pa-4">
    <WorkspaceNotFoundCard
      v-if="workspaceUnavailable"
      class="mb-4"
      :message="workspaceUnavailableMessage"
    />

    <template v-else>
      <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
        <div>
          <h1 class="text-h5 font-weight-bold">Progress</h1>
          <p class="text-body-2 text-medium-emphasis mb-0">
            See where you currently stand on each exercise family. Progress stays with you even if you change programs.
          </p>
        </div>
        <v-progress-circular
          v-if="isRefreshing"
          indeterminate
          color="primary"
          size="22"
          width="2"
        />
      </div>

      <v-alert
        v-if="loadError"
        type="error"
        variant="tonal"
        class="mb-4"
      >
        {{ loadError }}
      </v-alert>

      <template v-if="isInitialLoading">
        <div class="progress-page__summary-grid mb-4">
          <v-skeleton-loader
            v-for="summaryCard in 3"
            :key="summaryCard"
            type="article"
          />
        </div>
        <div class="progress-page__exercise-grid">
          <v-skeleton-loader
            v-for="card in 6"
            :key="card"
            type="article"
          />
        </div>
      </template>

      <template v-else>
        <div class="progress-page__summary-grid mb-4">
          <v-card
            v-for="summaryCard in summaryCards"
            :key="summaryCard.key"
            class="progress-summary-card"
            :data-testid="`progress-summary-${summaryCard.key}`"
            variant="tonal"
            rounded="xl"
          >
            <v-card-text class="progress-summary-card__body">
              <div>
                <div class="text-overline text-medium-emphasis">{{ summaryCard.label }}</div>
                <div class="text-h4 font-weight-bold">{{ summaryCard.value }}</div>
              </div>
              <v-avatar
                :color="summaryCard.color"
                variant="flat"
                size="44"
              >
                <v-icon :icon="summaryCard.icon" />
              </v-avatar>
            </v-card-text>
          </v-card>
        </div>

        <v-alert
          type="info"
          variant="tonal"
          class="mb-4"
        >
          Earned advancement stays advisory until you choose to apply it. The app never forces you off a step.
        </v-alert>

        <v-alert
          v-if="progressCards.length < 1"
          type="info"
          variant="tonal"
        >
          No exercise progress is available yet.
        </v-alert>

        <div
          v-else
          class="progress-page__exercise-grid"
        >
          <div
            v-for="exercise in progressCards"
            :key="exercise.exerciseId"
            class="progress-exercise-card"
            :data-testid="`progress-exercise-${exercise.exerciseSlug}`"
          >
            <v-card
              rounded="xl"
              variant="outlined"
            >
              <v-card-item>
                <template #prepend>
                  <v-avatar
                    color="primary"
                    variant="tonal"
                    size="40"
                  >
                    <v-icon :icon="mdiChartTimelineVariant" />
                  </v-avatar>
                </template>

                <v-card-title class="d-flex flex-wrap align-center justify-space-between ga-2">
                  <span>{{ exercise.exerciseName }}</span>
                  <v-chip
                    :color="progressStatusColor(exercise.status)"
                    size="small"
                    variant="tonal"
                  >
                    {{ progressStatusLabel(exercise.status) }}
                  </v-chip>
                </v-card-title>

                <v-card-subtitle>
                  {{ exerciseDetailLine(exercise) || "No step data available." }}
                </v-card-subtitle>
              </v-card-item>

              <v-card-text class="pt-0">
                <p
                  v-if="exercise.currentProgressStepInstruction"
                  class="text-body-2 mb-3"
                >
                  {{ exercise.currentProgressStepInstruction }}
                </p>

                <div class="d-flex flex-wrap ga-2 mb-3">
                  <v-chip
                    v-if="progressionTargetLabel(exercise)"
                    color="primary"
                    size="small"
                    variant="tonal"
                  >
                    Progression {{ progressionTargetLabel(exercise) }}
                  </v-chip>
                  <v-chip
                    v-if="exercise.activeVariationName"
                    color="warning"
                    size="small"
                    variant="tonal"
                  >
                    Variation: {{ exercise.activeVariationName }}
                  </v-chip>
                </div>

                <div class="text-body-2 text-medium-emphasis mb-3">
                  {{ lastCompletedLabel(exercise) }}
                </div>

                <v-alert
                  v-if="exercise.readyToAdvanceStepId"
                  type="success"
                  variant="tonal"
                  density="comfortable"
                  class="mb-3"
                >
                  <div class="d-flex flex-wrap align-center justify-space-between ga-3">
                    <div>
                      <div class="font-weight-medium">
                        Next step: Step {{ exercise.readyToAdvanceStepNumber }}{{ exercise.readyToAdvanceStepName ? ` - ${exercise.readyToAdvanceStepName}` : "" }}
                      </div>
                      <div class="text-body-2">
                        You have already earned the next canonical step and can advance whenever you want.
                      </div>
                    </div>
                    <v-btn
                      color="success"
                      variant="flat"
                      :prepend-icon="mdiStairsUp"
                      :loading="isApplyingAdvancement(exercise)"
                      @click="applyAdvancement(exercise)"
                    >
                      Advance now
                    </v-btn>
                  </div>
                </v-alert>
              </v-card-text>
            </v-card>
          </div>
        </div>
      </template>
    </template>
  </section>
</template>

<style scoped>
.progress-page__summary-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(148px, 1fr));
}

.progress-page__exercise-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.progress-summary-card {
  height: 100%;
}

.progress-summary-card__body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 88px;
}

@media (max-width: 640px) {
  .progress-page__summary-grid {
    gap: 12px;
  }
}
</style>
