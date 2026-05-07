<template>
  <v-card rounded="lg" elevation="1" border>
    <v-card-item class="home-surface-card__header">
      <template #prepend>
        <v-chip color="primary" size="small" label>Convict</v-chip>
      </template>
      <v-card-title class="text-h5">Convict Conditioning tracker</v-card-title>
      <v-card-subtitle>Public home surface</v-card-subtitle>
    </v-card-item>
    <v-divider />
    <v-card-text class="home-surface-card__body d-flex flex-column ga-3">
      <p class="text-medium-emphasis mb-0">
        Track your Convict Conditioning work by workspace cell, log sets against the scheduled day, and
        keep your step progress anchored to the canonical Big 6.
      </p>
      <p class="text-body-2 text-medium-emphasis mb-0">
        Sign in from the profile menu, switch into your workspace, and the app will take you straight to
        today&apos;s training, overdue work, and progress.
      </p>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.home-surface-card__header {
  padding: 0.875rem 1rem;
}

.home-surface-card__body {
  padding: 0.875rem 1rem 1rem;
}
</style>
