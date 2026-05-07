<script setup>
import { computed } from "vue";
import { usePaths } from "@jskit-ai/users-web/client/composables/usePaths";

const paths = usePaths();
const homePagePath = computed(() => paths.page("/", { surface: "home" }));
</script>

<template>
  <v-card rounded="lg" elevation="1" border>
    <v-card-item>
      <template #prepend>
        <v-chip color="primary" size="small" label>Console</v-chip>
      </template>
      <v-card-title class="text-h5">Operations Console</v-card-title>
      <v-card-subtitle>Maintenance, diagnostics, and app-level operations.</v-card-subtitle>
    </v-card-item>
    <v-divider />
    <v-card-text class="d-flex flex-column ga-4">
      <div class="d-flex flex-wrap ga-3">
        <v-chip color="secondary" variant="tonal" label>Route: /console</v-chip>
        <v-chip color="info" variant="tonal" label>Surface status: enabled</v-chip>
      </div>
      <p class="text-medium-emphasis mb-0">
        Use this area for maintenance tasks and diagnostics that do not belong in an end-user workspace.
      </p>
      <div>
        <v-btn color="primary" variant="flat" :to="homePagePath">Back to home</v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>
