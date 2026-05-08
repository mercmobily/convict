<script setup>
import { computed } from "vue";
import { mdiCalendarMonthOutline } from "@mdi/js";
import WorkoutExercisePreviewList from "@/components/WorkoutExercisePreviewList.vue";
import { useConvictWorkoutPresentation } from "@/composables/useConvictWorkoutPresentation";
import { parseDateOnly } from "@local/main/shared";

const props = defineProps({
  day: {
    type: Object,
    default: null
  },
  description: {
    type: String,
    default: ""
  },
  workoutDetailPagePath: {
    type: String,
    default: ""
  }
});

const { workoutStatusColor, workoutStatusLabel } = useConvictWorkoutPresentation();

const selectedDateLabel = computed(() => formatDateLabel(props.day?.scheduledForDate));

function formatDateLabel(dateString = "") {
  const date = parseDateOnly(dateString);
  if (!date) {
    return String(dateString || "").trim();
  }

  return date.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}
</script>

<template>
  <v-sheet
    rounded="xl"
    border
    class="history-day-detail-card"
    :data-scheduled-for-date="props.day?.scheduledForDate || ''"
  >
    <header class="history-day-detail-card__header">
      <div class="history-day-detail-card__identity">
        <v-avatar
          color="primary"
          variant="tonal"
          size="42"
          class="history-day-detail-card__icon"
        >
          <v-icon :icon="mdiCalendarMonthOutline" />
        </v-avatar>
        <div class="history-day-detail-card__title-block">
          <h2 class="history-day-detail-card__title">
            {{ selectedDateLabel || "Selected day" }}
          </h2>
          <p v-if="props.day?.programName" class="history-day-detail-card__program mb-0">
            {{ props.day.programName }}
          </p>
        </div>
      </div>

      <v-chip
        v-if="props.day"
        :color="workoutStatusColor(props.day.status)"
        variant="tonal"
        size="small"
        label
        class="history-day-detail-card__status"
      >
        {{ workoutStatusLabel(props.day.status) }}
      </v-chip>
    </header>

    <div class="history-day-detail-card__body">
      <p class="history-day-detail-card__description mb-0">
        {{ props.description }}
      </p>

      <WorkoutExercisePreviewList
        v-if="props.day && props.day.exercises.length > 0"
        :exercises="props.day.exercises"
        key-prefix="history-day"
        stacked
        class="history-day-detail-card__exercises"
      />

      <div
        v-else
        class="history-day-detail-card__empty"
      >
        No exercise list is available for this day.
      </div>
    </div>

    <div
      v-if="props.day?.canOpenWorkoutDetail"
      class="history-day-detail-card__actions"
    >
      <v-btn
        color="primary"
        variant="flat"
        :to="props.workoutDetailPagePath"
      >
        Open workout detail
      </v-btn>
    </div>
  </v-sheet>
</template>

<style scoped>
.history-day-detail-card {
  background:
    radial-gradient(circle at top left, rgba(var(--v-theme-primary), 0.08), transparent 18rem),
    rgb(var(--v-theme-surface));
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.history-day-detail-card__header {
  align-items: flex-start;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
}

.history-day-detail-card__identity {
  align-items: flex-start;
  display: flex;
  gap: 0.85rem;
  min-width: 0;
}

.history-day-detail-card__icon,
.history-day-detail-card__status {
  flex: 0 0 auto;
}

.history-day-detail-card__title-block {
  min-width: 0;
}

.history-day-detail-card__title {
  color: rgba(var(--v-theme-on-surface), 0.94);
  font-size: clamp(1.25rem, 3vw, 1.75rem);
  font-weight: 780;
  letter-spacing: -0.035em;
  line-height: 1.1;
  margin: 0;
}

.history-day-detail-card__program,
.history-day-detail-card__description,
.history-day-detail-card__empty {
  color: rgba(var(--v-theme-on-surface), 0.64);
}

.history-day-detail-card__program {
  font-size: 0.94rem;
  margin-top: 0.2rem;
}

.history-day-detail-card__body {
  display: grid;
  gap: 0.9rem;
}

.history-day-detail-card__description,
.history-day-detail-card__empty {
  font-size: 0.95rem;
  line-height: 1.45;
}

.history-day-detail-card__exercises {
  background: rgba(var(--v-theme-surface-variant), 0.14);
  border-radius: 1.2rem;
  padding: 0.65rem;
}

.history-day-detail-card__actions {
  display: flex;
  justify-content: flex-start;
}

@media (max-width: 640px) {
  .history-day-detail-card {
    border-radius: 1.5rem 1.5rem 0 0;
    padding: 0.85rem;
  }

  .history-day-detail-card__header {
    flex-direction: column;
  }

  .history-day-detail-card__actions :deep(.v-btn) {
    min-height: 48px;
    width: 100%;
  }
}
</style>
