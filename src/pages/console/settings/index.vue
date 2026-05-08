<template>
  <section class="console-settings-empty">
    <h2 class="console-settings-empty__title">No app-level console settings</h2>
    <p class="text-body-2 text-medium-emphasis mb-0">
      No app-level console settings are enabled for this personal training app.
    </p>
  </section>
</template>

<style scoped>
.console-settings-empty {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 1.25rem;
  margin-inline: auto;
  max-width: 34rem;
  padding: 2rem 1.25rem;
  text-align: center;
}

.console-settings-empty__title {
  font-size: clamp(1.2rem, 2vw, 1.5rem);
  font-weight: 760;
  letter-spacing: -0.03em;
  line-height: 1.15;
  margin: 0 0 0.45rem;
}
</style>
