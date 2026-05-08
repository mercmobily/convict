<script setup>
import { computed } from "vue";
import { useShellLayoutState } from "@jskit-ai/shell-web/client/composables/useShellLayoutState";

const { drawerDefaultOpen, setDrawerDefaultOpen } = useShellLayoutState();

const drawerDefaultOpenModel = computed({
  get() {
    return drawerDefaultOpen.value;
  },
  set(value) {
    setDrawerDefaultOpen(Boolean(value));
  }
});
</script>

<template>
  <section class="generated-ui-screen generated-ui-screen--settings settings-general-screen d-flex flex-column ga-4">
    <div>
      <h2 class="settings-general-screen__title">Navigation</h2>
      <p class="text-body-2 text-medium-emphasis mb-0">
        Choose the default behavior for wider screens. Phone layouts keep primary navigation in the bottom bar.
      </p>
    </div>

    <v-switch
      v-model="drawerDefaultOpenModel"
      color="primary"
      inset
      hide-details="auto"
      label="Open drawer by default on wider screens"
    />
  </section>
</template>

<style scoped>
.settings-general-screen :deep(.v-switch) {
  min-height: 48px;
}

.settings-general-screen__title {
  font-size: clamp(1.15rem, 2vw, 1.45rem);
  font-weight: 760;
  letter-spacing: -0.03em;
  line-height: 1.15;
  margin: 0 0 0.45rem;
}
</style>
