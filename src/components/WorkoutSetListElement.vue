<script setup>
import {
  mdiPencilOutline,
  mdiTrashCanOutline
} from "@mdi/js";
import { useConvictWorkoutPresentation } from "@/composables/useConvictWorkoutPresentation";

defineProps({
  workoutSet: {
    type: Object,
    required: true
  },
  displaySetNumber: {
    type: Number,
    default: 1
  },
  measurementUnit: {
    type: String,
    default: "reps"
  },
  qualifiesForProgression: {
    type: Boolean,
    default: false
  },
  canEdit: {
    type: Boolean,
    default: false
  },
  isDeleting: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  "edit",
  "delete"
]);

const { measurementLabel } = useConvictWorkoutPresentation();
</script>

<template>
  <div class="workout-set-row">
    <div class="workout-set-row__main">
      <div class="text-body-2 font-weight-medium">Set {{ displaySetNumber }}</div>
      <div class="text-body-2 text-medium-emphasis">
        {{ workoutSet.performedValue }} {{ measurementLabel(measurementUnit) }}
      </div>
    </div>

    <div class="workout-set-row__actions">
      <v-chip
        v-if="qualifiesForProgression"
        color="success"
        size="x-small"
        variant="outlined"
        label
      >
        Meets progression
      </v-chip>
      <v-btn
        v-if="canEdit"
        icon
        variant="text"
        color="primary"
        :aria-label="`Edit set ${displaySetNumber}`"
        @click="emit('edit')"
      >
        <v-icon :icon="mdiPencilOutline" />
      </v-btn>
      <v-btn
        v-if="canEdit"
        icon
        variant="text"
        color="error"
        :loading="isDeleting"
        :aria-label="`Delete set ${displaySetNumber}`"
        @click="emit('delete')"
      >
        <v-icon :icon="mdiTrashCanOutline" />
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
.workout-set-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.72rem 0;
  border-bottom: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.72));
}

.workout-set-row:last-child {
  border-bottom: 0;
}

.workout-set-row__main {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.workout-set-row__actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}
</style>
