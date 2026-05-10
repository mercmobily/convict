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
  mdiStairsUp
} from "@mdi/js";
import { useApplyAdvancementCommand } from "@/composables/useApplyAdvancementCommand";
import { useConvictWorkoutPresentation } from "@/composables/useConvictWorkoutPresentation";
import { usePaths } from "@jskit-ai/users-web/client/composables/usePaths";
import { useEndpointResource } from "@jskit-ai/users-web/client/composables/useEndpointResource";

const { exerciseDetailLine, progressionTargetLabel } = useConvictWorkoutPresentation();
const paths = usePaths();

const progressApiPath = computed(() => paths.api("/progress"));
const progressResource = useEndpointResource({
  queryKey: computed(() => ["progress", progressApiPath.value]),
  path: progressApiPath,
  refreshOnPull: true,
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
const readyToAdvanceCount = computed(() => Number(summary.value.readyToAdvanceExercises || 0));

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

function currentStepTitle(exercise = {}) {
  return exerciseDetailLine(exercise) || "No step data available.";
}

function nextStepTitle(exercise = {}) {
  const stepNumber = Number(exercise.readyToAdvanceStepNumber || 0);
  const stepName = String(exercise.readyToAdvanceStepName || "").trim();

  if (stepNumber > 0 && stepName) {
    return `Step ${stepNumber}: ${stepName}`;
  }
  if (stepNumber > 0) {
    return `Step ${stepNumber}`;
  }

  return stepName || "Next step";
}

function exerciseMetaParts(exercise = {}) {
  return [
    progressionTargetLabel(exercise) ? `Progression ${progressionTargetLabel(exercise)}` : "",
    lastCompletedLabel(exercise)
  ].filter(Boolean);
}

</script>

<template>
  <section class="progress-page">
    <div class="progress-page__header mb-4">
      <div>
        <h1 class="text-h5 font-weight-bold">Progress</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Current steps and earned advancement.
        </p>
      </div>
      <div class="progress-page__header-actions">
        <v-chip
          v-if="readyToAdvanceCount > 0"
          color="success"
          variant="tonal"
          label
          :prepend-icon="mdiFlagCheckered"
          data-testid="progress-summary-ready"
        >
          {{ readyToAdvanceCount }} ready
        </v-chip>
        <v-progress-circular
          v-if="isRefreshing"
          indeterminate
          color="primary"
          size="22"
          width="2"
        />
      </div>
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
      <div class="progress-page__exercise-list">
        <v-skeleton-loader
          v-for="card in 6"
          :key="card"
          type="article"
        />
      </div>
    </template>

    <template v-else>
      <v-alert
        v-if="progressCards.length < 1"
        type="info"
        variant="tonal"
      >
        No exercise progress is available yet.
      </v-alert>

      <div
        v-else
        class="progress-page__exercise-list"
      >
        <article
          v-for="exercise in progressCards"
          :key="exercise.progressionTrackId"
          class="progress-exercise-card"
          :data-testid="`progress-track-${exercise.progressionTrackSlug}`"
        >
          <header class="progress-exercise-card__header">
            <div class="progress-exercise-card__identity">
              <v-avatar
                color="primary"
                variant="tonal"
                size="40"
                class="progress-exercise-card__icon"
              >
                <v-icon :icon="mdiChartTimelineVariant" />
              </v-avatar>
              <div class="progress-exercise-card__title-block">
                <div class="progress-exercise-card__family">{{ exercise.progressionTrackName }}</div>
                <h2 class="progress-exercise-card__step">{{ currentStepTitle(exercise) }}</h2>
              </div>
            </div>
            <v-chip
              :color="progressStatusColor(exercise.status)"
              size="small"
              variant="tonal"
              label
              class="progress-exercise-card__status"
            >
              {{ progressStatusLabel(exercise.status) }}
            </v-chip>
          </header>

          <p
            v-if="exercise.currentProgressStepInstruction"
            class="progress-exercise-card__instruction mb-0"
          >
            {{ exercise.currentProgressStepInstruction }}
          </p>

          <div class="progress-exercise-card__meta">
            <span
              v-for="metaPart in exerciseMetaParts(exercise)"
              :key="metaPart"
            >
              {{ metaPart }}
            </span>
          </div>

          <section
            v-if="exercise.readyToAdvanceStepId"
            class="progress-exercise-card__ready"
          >
            <div class="progress-exercise-card__ready-copy">
              <div class="progress-exercise-card__ready-label">Next step</div>
              <div class="progress-exercise-card__ready-title">{{ nextStepTitle(exercise) }}</div>
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
          </section>
        </article>
      </div>
    </template>
  </section>
</template>

<style scoped>
.progress-page__header {
  align-items: center;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

.progress-page__header-actions {
  align-items: center;
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: flex-end;
}

.progress-page__exercise-list {
  display: grid;
  gap: 0.85rem;
}

.progress-exercise-card {
  background:
    linear-gradient(135deg, rgba(var(--v-theme-primary), 0.07), transparent 18rem),
    rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 1.35rem;
  display: grid;
  gap: 0.9rem;
  padding: 1rem;
}

.progress-exercise-card__header {
  align-items: start;
  display: flex;
  gap: 0.8rem;
  justify-content: space-between;
}

.progress-exercise-card__identity {
  align-items: start;
  display: flex;
  gap: 0.85rem;
  min-width: 0;
}

.progress-exercise-card__icon,
.progress-exercise-card__status {
  flex: 0 0 auto;
}

.progress-exercise-card__title-block {
  min-width: 0;
}

.progress-exercise-card__family {
  color: rgba(var(--v-theme-on-surface), 0.58);
  font-size: 0.78rem;
  font-weight: 760;
  letter-spacing: 0.08em;
  line-height: 1.2;
  text-transform: uppercase;
}

.progress-exercise-card__step {
  color: rgba(var(--v-theme-on-surface), 0.94);
  font-size: clamp(1.2rem, 3vw, 1.55rem);
  font-weight: 780;
  letter-spacing: -0.035em;
  line-height: 1.12;
  margin: 0.15rem 0 0;
  overflow-wrap: anywhere;
}

.progress-exercise-card__instruction {
  color: rgba(var(--v-theme-on-surface), 0.68);
  font-size: 0.94rem;
  line-height: 1.45;
}

.progress-exercise-card__meta {
  color: rgba(var(--v-theme-on-surface), 0.62);
  display: flex;
  flex-wrap: wrap;
  font-size: 0.9rem;
  gap: 0.35rem 0.75rem;
}

.progress-exercise-card__ready {
  align-items: center;
  background: rgba(var(--v-theme-success), 0.1);
  border: 1px solid rgba(var(--v-theme-success), 0.24);
  border-radius: 1rem;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  padding: 0.85rem;
}

.progress-exercise-card__ready-copy {
  min-width: 0;
}

.progress-exercise-card__ready-label {
  color: rgba(var(--v-theme-success), 0.92);
  font-size: 0.78rem;
  font-weight: 760;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.progress-exercise-card__ready-title {
  color: rgba(var(--v-theme-on-surface), 0.92);
  font-size: 1rem;
  font-weight: 720;
  line-height: 1.25;
  margin-top: 0.15rem;
}

@media (max-width: 640px) {
  .progress-page__header,
  .progress-exercise-card__ready {
    align-items: stretch;
    flex-direction: column;
  }

  .progress-page__header-actions {
    justify-content: flex-start;
  }

  .progress-exercise-card {
    border-radius: 1.25rem;
    padding: 0.9rem;
  }

  .progress-exercise-card__header {
    align-items: flex-start;
  }

  .progress-exercise-card__ready :deep(.v-btn) {
    min-height: 48px;
  }
}
</style>
