<template>
  <section
    class="convict-conditioning-page"
    data-testid="convict-conditioning-page"
  >
    <v-sheet
      class="convict-conditioning-hero"
      rounded="xl"
      border
    >
      <p class="convict-conditioning-page__eyebrow mb-2">The source system</p>
      <h1 class="convict-conditioning-page__title">Convict Conditioning</h1>
      <p class="convict-conditioning-page__lead mb-0">
        A stripped-down bodyweight strength system built around one hard rule:
        earn the next step. No machines. No noise. No pretending.
      </p>
    </v-sheet>

    <div
      class="convict-conditioning-principles"
      data-testid="convict-conditioning-principles"
    >
      <v-sheet
        v-for="principle in principles"
        :key="principle.title"
        class="convict-conditioning-principle"
        rounded="lg"
        border
      >
        <div class="convict-conditioning-principle__number">{{ principle.number }}</div>
        <h2>{{ principle.title }}</h2>
        <p>{{ principle.copy }}</p>
      </v-sheet>
    </div>

    <v-sheet
      class="convict-conditioning-section"
      rounded="xl"
      border
    >
      <p class="convict-conditioning-page__eyebrow mb-2">Author and publisher</p>
      <div class="convict-conditioning-section__grid">
        <section>
          <h2>Paul "Coach" Wade</h2>
          <p>
            Wade presents the method as prison-hardened calisthenics: old physical
            culture reduced to repeatable progressions. The useful part is not the
            mythology. It is the discipline. Start low enough to own the movement,
            build tendons and joints with patience, and move up only when the work
            is clean.
          </p>
        </section>

        <section>
          <h2>Dragon Door Publications</h2>
          <p>
            Dragon Door published the book and gave it the same hard-edged strength
            culture that surrounds its kettlebell and bodyweight material. The
            package is blunt, but the training idea is simple: strength should be
            usable, progressive, and portable.
          </p>
        </section>
      </div>
    </v-sheet>

    <v-sheet
      class="convict-conditioning-section convict-conditioning-section--closing"
      rounded="xl"
      border
    >
      <h2>How this tracker uses it</h2>
      <p>
        This app keeps the boring part honest: program, day, step, sets, reps, and
        advancement. Do the work. Log it. Repeat it until the standard is yours.
      </p>
      <p class="convict-conditioning-page__note mb-0">
        Independent tracker. Not affiliated with Paul Wade or Dragon Door Publications.
      </p>
    </v-sheet>
  </section>
</template>

<script setup>
const principles = Object.freeze([
  {
    number: "01",
    title: "Six movements",
    copy: "Push, pull, squat, raise the legs, bridge, and invert. Cover the body without turning training into a circus."
  },
  {
    number: "02",
    title: "Ten steps",
    copy: "Every family starts with a version almost anyone can survive and ends with a master-level standard."
  },
  {
    number: "03",
    title: "Progress earned slowly",
    copy: "The next step is not a reward for enthusiasm. It is payment for repeated clean work."
  }
]);
</script>

<style scoped>
.convict-conditioning-page {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.convict-conditioning-hero,
.convict-conditioning-section,
.convict-conditioning-principle {
  background:
    linear-gradient(135deg, rgba(var(--v-theme-primary), 0.12), transparent 18rem),
    rgb(var(--v-theme-surface));
  border-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

.convict-conditioning-hero {
  min-height: 14rem;
  padding: clamp(1.1rem, 4vw, 2rem);
}

.convict-conditioning-page__eyebrow {
  color: rgba(var(--v-theme-primary), 0.92);
  font-size: 0.78rem;
  font-weight: 820;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.convict-conditioning-page__title {
  color: rgba(var(--v-theme-on-surface), 0.96);
  font-size: clamp(2.2rem, 10vw, 4.5rem);
  font-weight: 840;
  letter-spacing: -0.07em;
  line-height: 0.94;
  margin: 0;
  max-width: 12ch;
}

.convict-conditioning-page__lead {
  color: rgba(var(--v-theme-on-surface), 0.72);
  font-size: clamp(1.02rem, 3vw, 1.25rem);
  line-height: 1.42;
  margin-top: 1rem;
  max-width: 42rem;
}

.convict-conditioning-principles {
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.convict-conditioning-principle,
.convict-conditioning-section {
  padding: clamp(1rem, 3vw, 1.35rem);
}

.convict-conditioning-principle__number {
  color: rgba(var(--v-theme-primary), 0.74);
  font-size: 0.78rem;
  font-weight: 820;
  letter-spacing: 0.12em;
}

.convict-conditioning-principle h2,
.convict-conditioning-section h2 {
  color: rgba(var(--v-theme-on-surface), 0.94);
  font-size: clamp(1.15rem, 3vw, 1.35rem);
  font-weight: 780;
  letter-spacing: -0.035em;
  line-height: 1.1;
  margin: 0.35rem 0 0.45rem;
}

.convict-conditioning-principle p,
.convict-conditioning-section p {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 0.96rem;
  line-height: 1.52;
  margin: 0;
}

.convict-conditioning-section__grid {
  display: grid;
  gap: 1.15rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.convict-conditioning-section--closing {
  background:
    linear-gradient(135deg, rgba(var(--v-theme-secondary), 0.1), transparent 18rem),
    rgb(var(--v-theme-surface));
}

.convict-conditioning-page__note {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  color: rgba(var(--v-theme-on-surface), 0.5) !important;
  font-size: 0.8rem !important;
  margin-top: 1rem !important;
  padding-top: 0.8rem;
}

@media (max-width: 760px) {
  .convict-conditioning-principles,
  .convict-conditioning-section__grid {
    grid-template-columns: 1fr;
  }

  .convict-conditioning-hero {
    min-height: 13rem;
  }
}
</style>
