<script setup>
import WorkspaceNotFoundCard from "@/components/WorkspaceNotFoundCard.vue";
import { useWorkspaceNotFoundState } from "@/composables/useWorkspaceNotFoundState";

const { workspaceUnavailable, workspaceUnavailableMessage } = useWorkspaceNotFoundState();
</script>

<template>
  <WorkspaceNotFoundCard
    v-if="workspaceUnavailable"
    :message="workspaceUnavailableMessage"
    surface-label="Workspace settings"
  />
  <v-card
    v-else
    rounded="lg"
    elevation="0"
    border
  >
    <v-card-item>
      <v-card-title>Current workspace</v-card-title>
      <v-card-subtitle>Settings in this section apply to the current cell only.</v-card-subtitle>
    </v-card-item>
    <v-divider />
    <v-card-text class="d-flex flex-column ga-3">
      <p class="text-body-2 text-medium-emphasis mb-0">
        Use this area for cell-level settings when a module exposes them here. Membership remains on the
        <strong>Members</strong> page, while app-wide assistant behavior stays in the Console.
      </p>
      <p class="text-body-2 text-medium-emphasis mb-0">
        This workspace does not currently expose any extra settings beyond the standard JSKIT workspace controls.
      </p>
    </v-card-text>
  </v-card>
</template>
