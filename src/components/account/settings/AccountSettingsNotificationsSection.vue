<script setup>
const props = defineProps({
  runtime: {
    type: Object,
    required: true
  }
});

const notifications = props.runtime.notifications;
</script>

<template>
  <v-sheet rounded="xl" border class="account-settings-section">
    <header class="account-settings-section__header">
      <h2 class="account-settings-section__title">Notifications</h2>
      <p class="account-settings-section__subtitle mb-0">Choose which account messages should reach you.</p>
    </header>
    <div class="account-settings-section__body">
      <v-form @submit.prevent="notifications.submit" novalidate>
        <v-switch
          v-model="notifications.form.productUpdates"
          label="Product updates"
          color="primary"
          hide-details
          :disabled="notifications.isSaving.value || notifications.isRefreshing.value"
          class="mb-2"
        />
        <v-switch
          v-model="notifications.form.accountActivity"
          label="Account activity alerts"
          color="primary"
          hide-details
          :disabled="notifications.isSaving.value || notifications.isRefreshing.value"
          class="mb-2"
        />
        <v-switch
          v-model="notifications.form.securityAlerts"
          label="Security alerts (required)"
          color="primary"
          hide-details
          disabled
          class="mb-4"
        />
        <v-btn
          type="submit"
          color="primary"
          :loading="notifications.isSaving.value"
          :disabled="notifications.isRefreshing.value"
        >
          Save notification settings
        </v-btn>
      </v-form>
    </div>
  </v-sheet>
</template>

<style scoped>
.account-settings-section {
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
}

.account-settings-section__header {
  padding: 1rem 1rem 0;
}

.account-settings-section__title {
  font-size: clamp(1.15rem, 2vw, 1.45rem);
  font-weight: 760;
  letter-spacing: -0.03em;
  line-height: 1.15;
  margin: 0;
}

.account-settings-section__subtitle {
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 0.92rem;
  line-height: 1.35;
  margin-top: 0.25rem;
}

.account-settings-section__body {
  padding: 1rem;
}

@media (max-width: 640px) {
  .account-settings-section__body :deep(.v-btn) {
    min-height: 48px;
  }
}
</style>
