<script setup>
import { mdiCalendarMonthOutline } from "@mdi/js";
import WorkoutExercisePreviewList from "@/components/WorkoutExercisePreviewList.vue";
import { useConvictWorkoutPresentation } from "@/composables/useConvictWorkoutPresentation";

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
</script>

<template>
  <v-card
    rounded="xl"
    variant="outlined"
  >
    <v-card-item>
      <template #prepend>
        <v-avatar
          color="primary"
          variant="tonal"
          size="42"
        >
          <v-icon :icon="mdiCalendarMonthOutline" />
        </v-avatar>
      </template>

      <v-card-title class="d-flex flex-wrap align-center justify-space-between ga-2">
        <span>{{ props.day?.dayLabel || "Selected day" }} {{ props.day?.scheduledForDate || "" }}</span>
        <v-chip
          v-if="props.day"
          :color="workoutStatusColor(props.day.status)"
          variant="tonal"
          size="small"
        >
          {{ workoutStatusLabel(props.day.status) }}
        </v-chip>
      </v-card-title>

      <v-card-subtitle class="history-day-detail-card__subtitle">
        {{ props.description }}
      </v-card-subtitle>
    </v-card-item>

    <v-card-text class="pt-0">
      <div
        v-if="props.day?.programName"
        class="text-body-2 text-medium-emphasis mb-3"
      >
        Program: {{ props.day.programName }}
      </div>

      <WorkoutExercisePreviewList
        v-if="props.day && props.day.exercises.length > 0"
        :exercises="props.day.exercises"
        key-prefix="history-day"
        stacked
      />

      <v-alert
        v-else
        type="info"
        variant="tonal"
      >
        No exercise list is available for this day.
      </v-alert>
    </v-card-text>

    <v-card-actions
      v-if="props.day?.canOpenWorkoutDetail"
      class="px-4 pb-4 pt-0"
    >
      <v-btn
        color="primary"
        variant="flat"
        :to="props.workoutDetailPagePath"
      >
        Open workout detail
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.history-day-detail-card__subtitle {
  white-space: normal;
  overflow: visible;
  text-overflow: unset;
}
</style>
