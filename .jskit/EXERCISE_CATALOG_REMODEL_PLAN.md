# Exercise Catalog, Progression Track, and Routine Remodel Plan

Status: planning only
Date: 2026-05-09
Scope: data model and implementation plan for the next remodel slice

This file is the implementation plan. It does not authorize schema or code changes by itself. Before implementation starts in a later turn, re-read `AGENTS.md` and `node_modules/@jskit-ai/agent-docs/templates/app/AGENTS.md`, then repeat the required pre-change checkpoint.

## Binding Rules

This plan is bound to the repository rules in `AGENTS.md` and the JSKIT app agent docs.

Non-negotiable rules for the implementation:

- Root cause first.
- Smallest correct change per implementation chunk.
- No local-path hacks.
- No hidden dependency on machine state.
- No workspace columns on new app-domain tables because this app uses `none` tenancy.
- Every new persisted application table is created in the database first.
- After the table exists, run the CRUD server generator from the live DB table.
- If an existing generated CRUD table gains fields, alter the DB first, then run `crud-server-generator scaffold-field` for each generated field.
- Runtime workflow code must use generated CRUD repositories or internal JSON REST seams, not hand-written Knex.
- User-owned descendants need direct `user_id` owner columns.
- No app UI for creating programs in this slice.
- If `npm install` is needed, run `npm run devlinks` after it.

## Pre-Change Checkpoint

Root cause:

The current model still treats Convict Conditioning as six exercise families plus ten `exercise_steps` per family. That was good enough for the original Big 6 slice, but it is the wrong domain boundary for a general training app. A concrete movement such as `Wall Push-up` should be an exercise. A progression path such as `Convict Push-ups` should be an ordered track through exercises. A program schedule should be able to reference either a progression track or a direct exercise. Warmups and cooldowns should not be fake progression entries; they should be routines made from direct exercises.

Long-term fix:

Remodel the app around concrete exercises, categories, progression tracks, direct schedule entries, and direct-exercise routines. Keep system catalog data separate from user-owned program copies and workout history. Preserve JSKIT by making every persisted table a generated CRUD resource, then placing custom logic only in thin workflow services that consume those resources through JSON REST or generated repositories.

Why it will not drift:

The canonical contracts become generated CRUD resources backed by explicit tables. Program selection continues to copy template schedule/routine data into user-owned program rows. Workout occurrence rows snapshot the exact exercise/track/step/routine data that was planned at the time. The app stops deriving behavior from the old family/step double meaning, so future programs can mix progression tracks and direct exercises without special cases.

Alternatives rejected:

- Keep `exercise_steps` as the primary model: rejected because it bakes Convict-specific progression semantics into every exercise.
- Add direct exercises as special-case schedule rows without remodeling progress: rejected because Today, Progress, History, and advancement would keep two competing concepts of exercise identity.
- Put warmups into `program_schedule_entries`: rejected because warmups/cooldowns are reusable direct-exercise routines, not main progression work.
- Use one mixed-ownership table for system and user-created catalog rows in this slice: rejected because it fights JSKIT's simple ownership model and creates visibility ambiguity.
- Build a program-builder UI now: rejected because the requested slice is the durable model and runtime behavior, not authoring UX.

## Product Model

The new product model is:

- An exercise is one concrete movement.
- A category is a taxonomy label for browsing and grouping exercises.
- An exercise can belong to multiple categories.
- One category membership can be marked as primary for display.
- A progression track is an ordered path through concrete exercises.
- A progression track step points to one concrete exercise and stores progression standards.
- A program schedule entry can be main work from either a progression track or a direct exercise.
- A routine is an ordered list of direct exercises with prescriptions.
- Programs can attach routines as warmups or cooldowns.
- A user can have more than one active program.
- A user-owned program is still a copy of a system template, not a live view of the template.
- Workout occurrence rows snapshot what the user was meant to do on that day.

## Current Model To Replace

Current canonical tables that are too Convict-specific:

- `exercises`: currently stores the six Big 6 families.
- `exercise_steps`: currently stores concrete movements plus progression standards.
- `program_template_schedule_entries`: currently schedules Big 6 families.
- `program_schedule_entries`: currently schedules Big 6 families in user-owned program copies.
- `user_exercise_progress`: currently tracks progress per Big 6 family.
- `workout_occurrence_exercises`: currently snapshots an exercise family plus canonical step fields.

The target model keeps the existing generated CRUD discipline, but moves the domain meaning:

- `exercises` becomes concrete movements.
- `exercise_steps` is replaced by `progression_track_steps`.
- `user_exercise_progress` is replaced by `user_progression_track_progress`.
- Schedule entries reference `progression_tracks` or direct `exercises`.
- Occurrence exercise snapshots reference concrete exercises and optional progression track context.

## Tenancy And Ownership

The app is `none` tenancy. New app-domain tables must not include `workspace_id`.

System catalog tables:

- `exercise_categories`
- `exercises`
- `exercise_category_memberships`
- `progression_tracks`
- `progression_track_steps`
- `routines`
- `routine_entries`
- `program_templates`
- `program_template_schedule_entries`
- `program_template_routine_assignments`

System catalog tables should use generated public/internal CRUD resources for slice 1. They are read by app workflow services. They are not editable from the app UI in this slice.

User-owned tables:

- `programs`
- `program_schedule_entries`
- `program_routines`
- `program_routine_entries`
- `user_program_assignments`
- `user_program_assignment_revisions`
- `user_progression_track_progress`
- `workout_occurrences`
- `workout_occurrence_exercises`
- `workout_set_logs`

Every new user-owned table must have a direct `user_id` column. CRUD resources for these tables use `--ownership-filter user`.

## Target Tables

### `exercise_categories`

Purpose:

Taxonomy for browsing, grouping, and future discovery.

Ownership:

System catalog, no `user_id`, no `workspace_id`.

Columns:

- `id`
- `slug`
- `name`
- `description`
- `sort_order`
- `status`
- `created_at`
- `updated_at`

Indexes and constraints:

- Unique `slug`.
- Index `status`.
- Index `sort_order`.

Notes:

The first system seed should include the current six Convict families as categories, not as exercises:

- Push-ups
- Squats
- Pull-ups
- Leg Raises
- Bridges
- Handstand Push-ups

Future categories can include Triceps, Core, Mobility, Balance, Posterior Chain, Grip, and similar groupings.

### `exercises`

Purpose:

Concrete movements. This table already exists, but its meaning changes from family to movement.

Ownership:

System catalog for this slice, no `user_id`, no `workspace_id`.

Target columns:

- `id`
- `slug`
- `name`
- `short_name`
- `description`
- `instruction_text`
- `default_measurement_unit`
- `default_equipment`
- `difficulty_hint`
- `status`
- `source_key`
- `source_ref`
- `created_at`
- `updated_at`

Indexes and constraints:

- Unique `slug`.
- Index `status`.
- Index `default_measurement_unit`.
- Index `source_key`.

Notes:

The Convict Conditioning seed should create 60 concrete exercise rows. Examples:

- Wall Push-up
- Incline Push-up
- Kneeling Push-up
- Half Push-up
- Full Push-up
- Close Push-up
- Uneven Push-up
- Half One-Arm Push-up
- Lever Push-up
- One-Arm Push-up

The same pattern applies across all six Convict progression categories.

### `exercise_category_memberships`

Purpose:

Many-to-many category assignment for concrete exercises.

Ownership:

System catalog, no `user_id`, no `workspace_id`.

Columns:

- `id`
- `exercise_id`
- `exercise_category_id`
- `role`
- `sort_order`
- `created_at`
- `updated_at`

Allowed `role` values:

- `primary`
- `secondary`

Indexes and constraints:

- Foreign key `exercise_id` to `exercises.id`.
- Foreign key `exercise_category_id` to `exercise_categories.id`.
- Unique `(exercise_id, exercise_category_id)`.
- Index `(exercise_category_id, role, sort_order)`.
- Index `(exercise_id, role)`.

Notes:

Do not build a clever mixed ownership system here. These are system memberships for slice 1.

The "one primary category per exercise" rule should be validated by seed/runtime catalog validation. A DB-only partial unique index is awkward in MariaDB and should not force generated CRUD complexity in this slice.

### `progression_tracks`

Purpose:

Named ordered progression paths. A progression track is not an exercise. It is a sequence through exercises.

Ownership:

System catalog, no `user_id`, no `workspace_id`.

Columns:

- `id`
- `slug`
- `name`
- `description`
- `default_exercise_category_id`
- `status`
- `source_key`
- `source_ref`
- `sort_order`
- `created_at`
- `updated_at`

Indexes and constraints:

- Unique `slug`.
- Foreign key `default_exercise_category_id` to `exercise_categories.id`.
- Index `status`.
- Index `sort_order`.

Seed examples:

- Convict Push-ups
- Convict Squats
- Convict Pull-ups
- Convict Leg Raises
- Convict Bridges
- Convict Handstand Push-ups

### `progression_track_steps`

Purpose:

Ordered steps inside a progression track. This replaces `exercise_steps` as the canonical progression model.

Ownership:

System catalog, no `user_id`, no `workspace_id`.

Columns:

- `id`
- `progression_track_id`
- `exercise_id`
- `step_number`
- `step_label`
- `instruction_text`
- `measurement_unit`
- `beginner_sets`
- `beginner_reps_min`
- `beginner_reps_max`
- `beginner_seconds`
- `intermediate_sets`
- `intermediate_reps_min`
- `intermediate_reps_max`
- `intermediate_seconds`
- `progression_sets`
- `progression_reps_min`
- `progression_reps_max`
- `progression_seconds`
- `source_ref`
- `created_at`
- `updated_at`

Indexes and constraints:

- Foreign key `progression_track_id` to `progression_tracks.id`.
- Foreign key `exercise_id` to `exercises.id`.
- Unique `(progression_track_id, step_number)`.
- Index `(progression_track_id, exercise_id)`.

Notes:

The step owns advancement standards. The exercise owns only the movement.

### `routines`

Purpose:

Reusable named routine definitions made from direct exercises. In this slice, routines are system catalog data.

Ownership:

System catalog, no `user_id`, no `workspace_id`.

Columns:

- `id`
- `slug`
- `name`
- `description`
- `status`
- `source_key`
- `source_ref`
- `created_at`
- `updated_at`

Indexes and constraints:

- Unique `slug`.
- Index `status`.

Notes:

Routine definitions are not main work. They are used to create warmup or cooldown rows when copied into a user-owned program.

### `routine_entries`

Purpose:

Ordered direct exercises inside a system routine.

Ownership:

System catalog, no `user_id`, no `workspace_id`.

Columns:

- `id`
- `routine_id`
- `slot_number`
- `exercise_id`
- `measurement_unit`
- `target_sets`
- `target_reps_min`
- `target_reps_max`
- `target_seconds`
- `rest_seconds`
- `notes`
- `created_at`
- `updated_at`

Indexes and constraints:

- Foreign key `routine_id` to `routines.id`.
- Foreign key `exercise_id` to `exercises.id`.
- Unique `(routine_id, slot_number)`.
- Index `(routine_id, exercise_id)`.

Notes:

Routine entries must always reference direct exercises, never progression tracks.

### `program_template_schedule_entries`

Purpose:

System template main-work schedule rows. This table already exists, but it must stop assuming every row is an exercise family.

Ownership:

System catalog, no `user_id`, no `workspace_id`.

Target columns:

- `id`
- `program_template_id`
- `day_of_week`
- `slot_number`
- `entry_kind`
- `progression_track_id`
- `exercise_id`
- `work_sets_min`
- `work_sets_max`
- `measurement_unit`
- `target_reps_min`
- `target_reps_max`
- `target_seconds`
- `rest_seconds`
- `notes`
- `created_at`
- `updated_at`

Allowed `entry_kind` values:

- `progression_track`
- `direct_exercise`

Indexes and constraints:

- Foreign key `program_template_id` to `program_templates.id`.
- Nullable foreign key `progression_track_id` to `progression_tracks.id`.
- Nullable foreign key `exercise_id` to `exercises.id`.
- Unique `(program_template_id, day_of_week, slot_number)`.
- Index `(program_template_id, entry_kind)`.
- Index `progression_track_id`.
- Index `exercise_id`.

Validation rule:

- If `entry_kind = progression_track`, `progression_track_id` must be present and `exercise_id` must be null.
- If `entry_kind = direct_exercise`, `exercise_id` must be present and `progression_track_id` must be null.

Implementation note:

Use a DB check constraint only if it stays clean with the generated CRUD resource. The workflow/service validation must still enforce the rule because it is a domain contract, not only a persistence detail.

### `program_schedule_entries`

Purpose:

User-owned copied main-work schedule rows. This table already exists and should mirror the template schedule shape, with direct ownership.

Ownership:

User-owned, direct `user_id`, no `workspace_id`.

Target columns:

- `id`
- `user_id`
- `program_id`
- `day_of_week`
- `slot_number`
- `entry_kind`
- `progression_track_id`
- `exercise_id`
- `work_sets_min`
- `work_sets_max`
- `measurement_unit`
- `target_reps_min`
- `target_reps_max`
- `target_seconds`
- `rest_seconds`
- `notes`
- `created_at`
- `updated_at`

Indexes and constraints:

- Foreign key `user_id` to `users.id`.
- Foreign key `program_id` to `programs.id`.
- Nullable foreign key `progression_track_id` to `progression_tracks.id`.
- Nullable foreign key `exercise_id` to `exercises.id`.
- Unique `(program_id, day_of_week, slot_number)`.
- Index `(user_id, program_id)`.
- Index `(user_id, entry_kind)`.

Validation rule:

Same target exclusivity as `program_template_schedule_entries`.

Notes:

Remove any old uniqueness that assumes `(program_id, day_of_week, exercise_id)` is meaningful. A day can legitimately have repeated direct exercises or multiple entries that do not have `exercise_id`.

### `program_template_routine_assignments`

Purpose:

System template mapping from a program template to one or more routines.

Ownership:

System catalog, no `user_id`, no `workspace_id`.

Columns:

- `id`
- `program_template_id`
- `routine_id`
- `timing`
- `day_of_week`
- `slot_number`
- `created_at`
- `updated_at`

Allowed `timing` values:

- `warmup`
- `cooldown`

Indexes and constraints:

- Foreign key `program_template_id` to `program_templates.id`.
- Foreign key `routine_id` to `routines.id`.
- Nullable `day_of_week`.
- Unique `(program_template_id, timing, day_of_week, slot_number)`.
- Index `(program_template_id, timing)`.

Notes:

If `day_of_week` is null, the routine applies to every workout day in the program. If it is set, it applies only to that day.

### `program_routines`

Purpose:

User-owned copied routine headers attached to a user-owned program.

Ownership:

User-owned, direct `user_id`, no `workspace_id`.

Columns:

- `id`
- `user_id`
- `program_id`
- `source_routine_id`
- `timing`
- `day_of_week`
- `slot_number`
- `name_snapshot`
- `description_snapshot`
- `created_at`
- `updated_at`

Allowed `timing` values:

- `warmup`
- `cooldown`

Indexes and constraints:

- Foreign key `user_id` to `users.id`.
- Foreign key `program_id` to `programs.id`.
- Nullable foreign key `source_routine_id` to `routines.id`.
- Unique `(program_id, timing, day_of_week, slot_number)`.
- Index `(user_id, program_id, timing)`.

Notes:

This table keeps "copy a program" honest. The template routine assignment is copied into a user-owned row. The source routine id remains as provenance, not the only source of display truth.

### `program_routine_entries`

Purpose:

User-owned copied routine exercises attached to a user-owned program routine.

Ownership:

User-owned, direct `user_id`, no `workspace_id`.

Columns:

- `id`
- `user_id`
- `program_routine_id`
- `exercise_id`
- `slot_number`
- `exercise_name_snapshot`
- `measurement_unit`
- `target_sets`
- `target_reps_min`
- `target_reps_max`
- `target_seconds`
- `rest_seconds`
- `notes`
- `created_at`
- `updated_at`

Indexes and constraints:

- Foreign key `user_id` to `users.id`.
- Foreign key `program_routine_id` to `program_routines.id`.
- Foreign key `exercise_id` to `exercises.id`.
- Unique `(program_routine_id, slot_number)`.
- Index `(user_id, program_routine_id)`.
- Index `(user_id, exercise_id)`.

Notes:

These rows reference direct exercises only. They are copied from `routine_entries` when a program template is selected.

### `user_progression_track_progress`

Purpose:

User progress through progression tracks. This replaces `user_exercise_progress`.

Ownership:

User-owned, direct `user_id`, no `workspace_id`.

Columns:

- `id`
- `user_id`
- `progression_track_id`
- `current_progression_track_step_id`
- `ready_to_advance_progression_track_step_id`
- `started_at`
- `last_workout_occurrence_id`
- `created_at`
- `updated_at`

Indexes and constraints:

- Foreign key `user_id` to `users.id`.
- Foreign key `progression_track_id` to `progression_tracks.id`.
- Foreign key `current_progression_track_step_id` to `progression_track_steps.id`.
- Nullable foreign key `ready_to_advance_progression_track_step_id` to `progression_track_steps.id`.
- Nullable foreign key `last_workout_occurrence_id` to `workout_occurrences.id`.
- Unique `(user_id, progression_track_id)`.
- Index `(user_id, current_progression_track_step_id)`.

Notes:

Progress belongs to the user and track, not to a program assignment. If two active programs use the same progression track, they should reflect the same current step.

### `workout_occurrence_exercises`

Purpose:

Snapshot planned exercise rows for a workout occurrence. This table already exists, but must snapshot the new model.

Ownership:

User-owned, direct `user_id`, no `workspace_id`.

Target added/reworked columns:

- `section`
- `source_kind`
- `program_schedule_entry_id`
- `program_routine_entry_id`
- `progression_track_id`
- `progression_track_step_id`
- `exercise_id`
- `exercise_name_snapshot`
- `progression_track_name_snapshot`
- `progression_step_label_snapshot`
- `measurement_unit_snapshot`
- `planned_sets_min`
- `planned_sets_max`
- `target_reps_min_snapshot`
- `target_reps_max_snapshot`
- `target_seconds_snapshot`
- `progression_sets_snapshot`
- `progression_reps_min_snapshot`
- `progression_reps_max_snapshot`
- `progression_seconds_snapshot`
- `rest_seconds_snapshot`
- `notes_snapshot`

Allowed `section` values:

- `warmup`
- `main`
- `cooldown`

Allowed `source_kind` values:

- `program_schedule_entry`
- `program_routine_entry`

Notes:

Existing fields such as `canonical_step_id` and `canonical_step_name_snapshot` become legacy once `progression_track_step_id` and `progression_step_label_snapshot` exist. Do not keep both as active canonical concepts after migration.

## Generator Plan

### New CRUD server resources

Create the DB tables first, then run one generated server CRUD scaffold per table.

System/internal catalog scaffolds:

```bash
npx jskit generate crud-server-generator scaffold --namespace exercise-categories --surface app --ownership-filter public --table-name exercise_categories --internal
npx jskit generate crud-server-generator scaffold --namespace exercise-category-memberships --surface app --ownership-filter public --table-name exercise_category_memberships --internal
npx jskit generate crud-server-generator scaffold --namespace progression-tracks --surface app --ownership-filter public --table-name progression_tracks --internal
npx jskit generate crud-server-generator scaffold --namespace progression-track-steps --surface app --ownership-filter public --table-name progression_track_steps --internal
npx jskit generate crud-server-generator scaffold --namespace routines --surface app --ownership-filter public --table-name routines --internal
npx jskit generate crud-server-generator scaffold --namespace routine-entries --surface app --ownership-filter public --table-name routine_entries --internal
npx jskit generate crud-server-generator scaffold --namespace program-template-routine-assignments --surface app --ownership-filter public --table-name program_template_routine_assignments --internal
```

User-owned scaffolds:

```bash
npx jskit generate crud-server-generator scaffold --namespace program-routines --surface app --ownership-filter user --table-name program_routines --internal
npx jskit generate crud-server-generator scaffold --namespace program-routine-entries --surface app --ownership-filter user --table-name program_routine_entries --internal
npx jskit generate crud-server-generator scaffold --namespace user-progression-track-progress --surface app --ownership-filter user --table-name user_progression_track_progress --internal
```

Important generator notes:

- Use `--internal` for slice 1 because there is no authoring UI and workflow services are the intended consumer.
- If later console authoring is added, expose the needed generated resources deliberately and generate console CRUD UI then.
- After generator runs, inspect `config/roles.js`. The generator can append default CRUD permissions. Any generated permission exposure must match the intended surface.
- If generated packages are added to dependencies and `npm install` is run, run `npm run devlinks`.

### Existing CRUD resource field scaffolds

For existing generated resources, alter the table first and then patch generated resource fields from the DB snapshot.

Command shape:

```bash
npx jskit generate crud-server-generator scaffold-field <fieldKey> <targetFile> --table-name <table_name>
```

Examples:

```bash
npx jskit generate crud-server-generator scaffold-field entryKind packages/program-template-schedule-entries/src/shared/programTemplateScheduleEntryResource.js --table-name program_template_schedule_entries
npx jskit generate crud-server-generator scaffold-field progressionTrackId packages/program-template-schedule-entries/src/shared/programTemplateScheduleEntryResource.js --table-name program_template_schedule_entries
npx jskit generate crud-server-generator scaffold-field entryKind packages/program-schedule-entries/src/shared/programScheduleEntryResource.js --table-name program_schedule_entries
npx jskit generate crud-server-generator scaffold-field progressionTrackId packages/program-schedule-entries/src/shared/programScheduleEntryResource.js --table-name program_schedule_entries
npx jskit generate crud-server-generator scaffold-field section packages/workout-occurrence-exercises/src/shared/workoutOccurrenceExerciseResource.js --table-name workout_occurrence_exercises
npx jskit generate crud-server-generator scaffold-field progressionTrackStepId packages/workout-occurrence-exercises/src/shared/workoutOccurrenceExerciseResource.js --table-name workout_occurrence_exercises
```

Field scaffolding will not replace domain validation. After scaffolding, review generated resource metadata, relation names, search filters, and writable fields.

### CRUD UI generator

Do not run CRUD UI generation in this slice.

Future console authoring should use CRUD UI generation after server CRUD resources exist and permissions are correct. Candidate future screens:

- Exercise Categories
- Exercises
- Progression Tracks
- Progression Track Steps
- Routines
- Routine Entries
- Program Templates
- Program Template Schedule Entries
- Program Template Routine Assignments

No app-surface program-builder UI belongs in slice 1.

## Data Migration And Seeding Plan

### Safety decision before implementation

Before implementation, choose one of these paths:

- Dev reset path: delete user-owned training data, keep app/system infrastructure, reseed system catalog and templates.
- Preserve-history path: migrate old family/step references into new track/step references and keep old workout history readable.

Recommended for this repo right now:

Use the dev reset path unless the user explicitly asks to preserve historical workout logs. The old model has different semantics, and preserving it would add a lot of migration code for little product value during V0.

User-owned training tables likely requiring reset if using the dev path:

- `workout_set_logs`
- `workout_occurrence_exercises`
- `workout_occurrences`
- `user_exercise_progress`
- `user_progression_track_progress`
- `user_program_assignment_revisions`
- `user_program_assignments`
- `program_routine_entries`
- `program_routines`
- `program_schedule_entries`
- `programs`

System/catalog tables to reseed:

- `exercise_categories`
- `exercises`
- `exercise_category_memberships`
- `progression_tracks`
- `progression_track_steps`
- `routines`
- `routine_entries`
- `program_templates`
- `program_template_schedule_entries`
- `program_template_routine_assignments`

Do not delete `console_settings`.

### Seed content

Seed the Convict Conditioning catalog as:

- 60 exercise rows.
- 6 primary categories.
- 6 progression tracks.
- 10 progression track steps per progression track.
- Existing program templates converted so schedule entries point at progression tracks.

The original template schedules should become:

- Day rows schedule `entry_kind = progression_track`.
- Rows point to a progression track, not an exercise category.
- Work set ranges remain on the schedule entry.
- Advancement standards remain on the progression track step.

Warmup/cooldown routines:

- Seed only if there is a real product rule.
- If seeded, attach through `program_template_routine_assignments`.
- Copy into `program_routines` and `program_routine_entries` when the user selects a program.

### Idempotence

Seeds must be slug-driven and deterministic.

Avoid seed ordering that depends on:

- Filesystem order.
- Object key order.
- Auto-increment ids.

Use explicit `sort_order`, `step_number`, and stable slugs.

## Workflow Refactor Plan

### Program assignment workflow

Current responsibility:

Select a program template, copy it to a user-owned program, then create an assignment/revision.

Target behavior:

- List system templates as before.
- On selection, copy the program template into `programs`.
- Copy `program_template_schedule_entries` into `program_schedule_entries`.
- Copy `program_template_routine_assignments` into `program_routines`.
- Copy source `routine_entries` into `program_routine_entries`.
- Keep `source_routine_id` and snapshots for provenance.
- Initialize `user_progression_track_progress` for progression tracks used by the copied program if rows do not already exist.
- Allow more than one active assignment.

Multiple active program rules:

- Remove the "one active assignment per user" application constraint.
- Do not add a database uniqueness constraint that blocks multiple active programs.
- Prevent exact duplicate starts only if that is a clear product rule, for example same program and same starts_on date.
- Today/Progress/History must aggregate assignments instead of assuming one.

JSKIT constraints:

- Writes go through generated CRUD repositories.
- Reads go through internal JSON REST or generated CRUD repositories.
- No direct Knex in workflow runtime.

### Today workflow

Current responsibility:

Build the state for today, workout details, occurrence creation, set logging, and workout submission.

Target behavior:

- Load active assignments for the user.
- Load each assignment's current revision.
- Load copied programs.
- Load copied main schedule entries.
- Load copied program routines and routine entries.
- Load progression track progress rows.
- Load progression track steps and concrete exercises through generated resources.
- Project each scheduled day as a grouped plan.

Projection shape:

- Assignment/program group.
- Warmup section.
- Main section.
- Cooldown section.
- Occurrence status per assignment/date.
- Direct exercise rows with target prescription.
- Progression rows resolved to current track step.

Occurrence creation:

- Create one `workout_occurrences` row per assignment/date.
- Snapshot warmup rows from `program_routine_entries`.
- Snapshot main progression rows from resolved `progression_track_steps`.
- Snapshot main direct rows from `program_schedule_entries`.
- Snapshot cooldown rows from `program_routine_entries`.
- Set `section` and `source_kind` on every `workout_occurrence_exercises` row.

Submission:

- Advancement only applies to main progression rows.
- Direct exercise rows and routine rows do not earn progression advancement.
- Progress updates write to `user_progression_track_progress`.

### Progress workflow

Current responsibility:

Show Big 6 progress and advisory advancement.

Target behavior:

- Show progression tracks the user has started.
- Use `user_progression_track_progress` as canonical state.
- Display current track step as the primary title.
- Display track/category as metadata.
- Keep manual advancement.
- Direct exercise programs do not appear as progression progress unless they are part of a progression track.

### History workflow

Current responsibility:

Show completed/in-progress/overdue/calendar projections.

Target behavior:

- Aggregate by assignment/program.
- Keep occurrence overlays per assignment/date.
- Display warmup/main/cooldown sections in day detail.
- Do not show "Starts later" for every future non-selected detail if a cleaner scheduled/rest/open label exists.

## UI Plan

No program-builder UI in this slice.

Required app UI updates:

- Today can show multiple program groups.
- Workout detail can show sections: Warmup, Main Work, Cooldown.
- Direct exercise rows use simple target prescriptions.
- Progress shows progression tracks, not Big 6 families.
- History day detail shows program and sections clearly.

Material direction:

- Keep cards near full-width on mobile.
- Prefer compact lists over card stacks inside card stacks.
- Keep primary actions obvious and thumb-reachable.
- Do not introduce clever custom controls where a simple list, chip, or button works.
- Use existing JSKIT composables for client queries.
- Keep all business rules in services, not Vue components.

Future console UI:

- Build generated CRUD screens only after the generated server resources and permissions are correct.
- Console authoring should be for system admins, not normal app users.
- App-surface users should consume programs, not author them in this slice.

## Implementation Phases

### Phase 0: Preflight

Actions:

- Re-read `AGENTS.md`.
- Re-read JSKIT app docs.
- Run `git status --short`.
- Confirm current tenancy is `none`.
- Confirm no implementation starts from a dirty, ambiguous worktree.
- Decide reset-vs-preserve history.
- If installing dependencies, run `npm install` then `npm run devlinks`.

Verification:

- `npx jskit doctor`
- Existing app smoke test if the worktree is not already broken.

### Phase 1: Database schema

Actions:

- Create new tables in MariaDB.
- Alter existing tables.
- Remove obsolete constraints from schedule tables.
- Add new indexes.
- Keep all new app-domain tables free of `workspace_id`.
- Add direct `user_id` to every new user-owned table.

Do not:

- Write workflow code yet.
- Hand-write CRUD repositories.
- Patch generated resources before the DB columns exist.

Verification:

- Inspect `SHOW CREATE TABLE` for every new or altered table.
- Confirm user-owned tables have direct `user_id`.
- Confirm system tables do not have `user_id` or `workspace_id`.

### Phase 2: CRUD server generation

Actions:

- Run `crud-server-generator scaffold` for every new table.
- Run `crud-server-generator scaffold-field` for every new field in existing generated CRUD resources.
- Inspect generated resources.
- Fix only generator-supported contracts or resource metadata needed to reflect the DB accurately.
- Check `config/roles.js` for accidental write exposure.

Verification:

- `npm install` if package dependencies changed.
- `npm run devlinks` if `npm install` ran.
- `./node_modules/.bin/eslint` on generated and touched app files.
- `npx jskit doctor`.

### Phase 3: System seeds

Actions:

- Seed categories.
- Seed concrete exercises.
- Seed category memberships.
- Seed progression tracks.
- Seed progression track steps.
- Convert template schedule entries to track/direct entries.
- Seed routines only if product rules exist.
- Seed template routine assignments only if routines are part of the selected product rules.

Verification:

- Count categories.
- Count exercises.
- Count tracks.
- Count ten steps per Convict track.
- Confirm template schedule rows no longer point at old exercise families.

### Phase 4: Program copy workflow

Actions:

- Update program assignment repository/service to read new generated resources.
- Copy template schedule entries to user-owned schedule entries.
- Copy template routine assignments to `program_routines`.
- Copy routine entries to `program_routine_entries`.
- Initialize track progress rows where needed.
- Allow multiple active assignments.

Verification:

- Starting one program creates copied program rows.
- Starting a second program keeps the first active.
- Copied rows have direct `user_id`.
- No workflow code writes direct Knex.

### Phase 5: Today and workout workflow

Actions:

- Refactor projection loaders to batch multiple assignments.
- Resolve main progression entries from `user_progression_track_progress`.
- Resolve main direct entries directly from `program_schedule_entries`.
- Add warmup/cooldown projection from copied program routine rows.
- Update occurrence creation snapshots.
- Update submit logic to advance only progression-track main rows.

Verification:

- Today shows all active programs.
- Workout detail opens for each scheduled assignment/date.
- Warmups appear before main work.
- Cooldowns appear after main work.
- Direct exercises can be logged but do not trigger progression advancement.
- Progression exercises still earn advisory advancement.

### Phase 6: Progress and history workflow

Actions:

- Move progress projection from Big 6 family rows to progression tracks.
- Update history projection for multiple assignments and sections.
- Keep UI compact and Material.

Verification:

- Progress shows track and current concrete exercise correctly.
- History calendar counts multiple programs correctly.
- History detail is readable on phone width.

### Phase 7: Deprecated model cleanup

Actions:

- Remove runtime dependence on `exercise_steps`.
- Remove runtime dependence on `user_exercise_progress`.
- Remove stale generated packages only after all consumers are gone.
- Drop obsolete tables only after the reset/migration decision is executed.
- Remove stale feature metadata and routes.

Verification:

- `rg "exercise_steps|exerciseSteps|user_exercise_progress|userExerciseProgress"` has no runtime references except migrations or deliberate historical notes.
- `npm test`
- `npm run build:app`
- Playwright app flow.
- `npx jskit doctor`

## Tests And Verification Matrix

Minimum automated verification after implementation:

- Lint touched files.
- Unit tests for program copy service.
- Unit tests for Today projection with mixed entry kinds.
- Unit tests for progression advancement by track.
- Playwright program selection.
- Playwright Today with multiple active programs.
- Playwright workout detail with warmup, main, and cooldown sections.
- Playwright set logging on direct and progression rows.
- Playwright submit and manual advancement.
- Playwright Progress.
- Playwright History.
- `jskit app verify-ui` for the affected flows.
- `jskit doctor`.

Manual database checks:

- No new `workspace_id` columns.
- Every user-owned new table has `user_id`.
- No active runtime table uses mixed public/user ownership.
- No workflow runtime direct Knex for CRUD-owned tables.
- New generated CRUD packages have expected package descriptors.

## Open Decisions Before Implementation

Decision 1:

Reset user-owned training data or preserve historical logs.

Recommendation:

Reset user-owned training data during V0. Preserve system catalog/program definitions. This is the smallest correct path and avoids mapping old Big 6 family semantics into the new model.

Decision 2:

Seed warmups/cooldowns immediately or only create the routine model.

Recommendation:

Create the model now. Seed routines only if there is a clear first routine. Do not invent fake warmups just to prove the schema.

Decision 3:

Expose catalog CRUD routes now or keep them internal.

Recommendation:

Keep new catalog CRUD resources internal in slice 1. Generate console authoring later, deliberately.

Decision 4:

Allow duplicate active assignments for the same program.

Recommendation:

Allow multiple active programs generally, but prevent exact accidental duplicate starts for the same user, same program template, and same starts_on date if the current UI can submit twice.

Decision 5:

How to represent one primary category per exercise.

Recommendation:

Use membership `role = primary` and enforce one primary in seed/catalog validation, not via a complicated generated-CRUD-unfriendly DB constraint.

## Definition Of Done

The remodel is done only when:

- Exercises are concrete movements.
- Categories are separate from exercises.
- Progression tracks are separate from exercises.
- Progression track steps own progression standards.
- Program schedule entries can reference a progression track or a direct exercise.
- Warmups/cooldowns are routines made from direct exercises.
- Program selection copies template schedule and routine data into user-owned rows.
- Multiple active programs work.
- Today, Workout Detail, Progress, and History use the new model.
- Deprecated Big 6 family/`exercise_steps` runtime paths are gone.
- All new persisted tables were created first and generated through JSKIT CRUD.
- Workflow runtime uses generated CRUD/internal JSON REST seams.
- Mobile UI remains simple, compact, and Material.
- Lint, tests, Playwright, verify-ui, and doctor pass.
