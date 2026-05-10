
Target Model

  Source/catalog world:

  - exercises: concrete movements.
  - categories: taxonomy/search grouping.
  - exercise_categories: exercise-to-category link table.
  - progressions: reusable progression path identity.
  - progression_entries: ordered exercises inside a progression.
  - routines: reusable warmup/cooldown block.
  - routine_entries: ordered exercises inside a routine.
  - program_collections: reusable program families/catalog groupings, e.g. Convict Conditioning.
  - programs: stable program identity, e.g. New Blood.
  - program_versions: immutable published version, e.g. New Blood 1.0.
  - program_entries: main work rows belonging to a program_version.
  - program_routines: routine assignments belonging to a program_version.

  Copied/user-owned structure:

  - instance_programs: copied program_version.
  - instance_program_entries: copied main work rows.
  - instance_program_routines: copied routine assignments.
  - instance_routine_entries: copied routine entries.
  - instance_progressions: copied progressions used by the selected program.
  - instance_progression_entries: copied progression entries.

  Runtime/user state:

  - program_assignments: user is doing this copied program. A user may have more than one active assignment.
  - program_assignment_revisions: assignment history, points to current instance_program.
  - user_progressions: user progress against an instance_progression, scoped to a program_assignment.
  - workouts: scheduled/performed workout days.
  - workout_exercises: workout exercise snapshots.
  - workout_sets: logged sets.

  Key rule:

  - Source tables are reusable/publishable.
  - Instance tables are frozen copies used for training.
  - Runtime tables are mutable user state.
  - Users never train directly from source rows.
  - Users can train on multiple active programs at the same time.
  - Progress belongs to a program assignment, not globally to a user/progression pair.
  - Workout uniqueness is assignment/date, not user/date.

  Versioning Decision

  Add versioning now.

  Use:

  - program_collections for source program families, e.g. Convict Conditioning.
  - programs for stable identity.
  - program_versions for immutable published versions.
  - programs belong to program_collections.
  - program_entries and program_routines belong to program_versions, not directly to programs.

  Program selection must be collection-first:

  1. Show program_collections.
  2. User picks a collection, e.g. Convict Conditioning.
  3. Show latest published program_versions for programs in that collection.
  4. User picks one version.

  Selection flow becomes:

  1. Show latest published program_versions for the selected program_collection, grouped by program.
  2. User picks one version.
  3. Copy that program_version into instance_programs.
  4. Copy program_entries into instance_program_entries.
  5. Copy used progressions into instance_progressions.
  6. Copy progression_entries into instance_progression_entries.
  7. Copy program_routines into instance_program_routines.
  8. Copy routine_entries into instance_routine_entries.
  9. Create program_assignments.
  10. Create program_assignment_revisions.
  11. Seed user_progressions against copied instance_progressions and the new program_assignment.

  That prevents source edits from changing existing users’ training.

  Multiple Active Program Decision

  Support multiple active programs now.

  Practical database requirements:

  - program_assignments must allow multiple active rows per user.
  - program_assignment_revisions must point to instance_programs.
  - user_progressions must include program_assignment_id.
  - user_progressions uniqueness must be (program_assignment_id, instance_progression_id).
  - workouts must include program_assignment_id and program_assignment_revision_id.
  - workouts uniqueness must be (program_assignment_id, scheduled_for_date).
  - workouts must not have a unique key on (user_id, scheduled_for_date).
  - instance_program_entries must point to instance_progression_id for progression work, not source progression_id.
  - workout_exercises must snapshot instance progression data from the copied instance tables.

  This means two active programs can schedule work on the same date without clobbering each other, and two programs using the
  same source progression can still advance independently.

  Precise Todo

  Stage 1: Freeze and inspect

  - Re-read AGENTS.md and JSKIT app instructions.
  - Confirm current DB/table/package state.
  - Confirm generated CRUD package names and route/resource names.
  - Confirm no unexpected uncommitted user changes.
  - Write the final rename/version map before touching code.

  Stage 2: DB source rename and versioning

  - Rename/create source tables first.
  - Add program_collections.
  - Add programs.program_collection_id.
  - Add program_versions.
  - Move current program_templates data into:
      - program_collections
      - programs
      - program_versions
  - Move current schedule/routine assignments so they point to program_versions.
  - Rename progression source tables:
      - progression_tracks -> progressions
      - progression_track_steps -> progression_entries
  - Rename taxonomy tables:
      - exercise_categories -> categories
      - exercise_category_memberships -> exercise_categories

  Stage 3: DB instance/runtime rename

  - Rename copied program tables:
      - current user-owned programs -> instance_programs
      - program_schedule_entries -> instance_program_entries
      - current copied program_routines -> instance_program_routines
      - program_routine_entries -> instance_routine_entries
  - Add new copied progression tables:
      - instance_progressions
      - instance_progression_entries
  - Rename runtime tables:
      - user_program_assignments -> program_assignments
      - user_program_assignment_revisions -> program_assignment_revisions
      - user_progression_track_progress -> user_progressions
      - workout_occurrences -> workouts
      - workout_occurrence_exercises -> workout_exercises
      - workout_set_logs -> workout_sets
  - Rename foreign-key columns to match the new names.
  - Add program_assignment_id to user_progressions.
  - Ensure user_progressions points to instance_progressions and instance_progression_entries.
  - Ensure workouts remains unique by program_assignment_id and scheduled_for_date.
  - Ensure no user/date uniqueness remains on workouts.

  Stage 4: Regenerate CRUD packages

  For every new/renamed CRUD table:

  1. DB table exists first.
  2. Run JSKIT server CRUD generator.
  3. Run client CRUD generator only where UI/client CRUD is needed.
  4. Run npm install.
  5. Run npm run devlinks.

  Likely regenerated server CRUDs:

  - categories
  - exercise-categories
  - progressions
  - progression-entries
  - program-collections
  - programs
  - program-versions
  - program-entries
  - program-routines
  - instance-programs
  - instance-program-entries
  - instance-program-routines
  - instance-routine-entries
  - instance-progressions
  - instance-progression-entries
  - program-assignments
  - program-assignment-revisions
  - user-progressions
  - workouts
  - workout-exercises
  - workout-sets

  Stage 5: Update workflow services

  - Update program-assignment selection flow to list program_collections first.
  - Update program-assignment selection flow to copy from program_versions.
  - Copy source progressions into instance progressions during selection.
  - Seed user_progressions against instance progressions and the selected program_assignment.
  - Update today projection to read all active program_assignments and group work by assignment/program.
  - Update today projection to read instance program/progression data only.
  - Update progress projection to read assignment-scoped user_progressions and instance progression entries.
  - Keep workflow repos thin and JSON REST based.

  Stage 6: Update UI

  - Program picker first lists program_collections.
  - Program picker reads latest published program_versions only after a collection is selected.
  - Program picker supports starting more than one active program.
  - Existing app pages should show no behavioral change.
  - Today groups work by active assignment/program when more than one program is active.
  - Workout page uses renamed workout/set resources.
  - Progress page reads instance progression state.
  - Avoid adding program/exercise builder UI in this slice.

  Stage 7: Remove old names

  - Delete old generated packages after replacements are wired.
  - Remove old table references from code.
  - Remove old package dependencies.
  - Remove stale docs/blueprint references.
  - Search for old names with rg.

  Stage 8: Verification

  - Run lint/verify.
  - Run full Playwright suite.
  - Empty user training data only, not system/source catalog.
  - Real smoke:
      - login
      - pick a latest program version
      - confirm instance rows are created
      - confirm progressions are copied
      - pick a second program version
      - confirm two active assignments can coexist
      - confirm same-date workouts for different assignments can coexist
      - open today
      - add sets
      - finish workout
      - confirm progress updates
      - confirm progress updates only for the matching assignment
  - Confirm source catalog rows remain unchanged.
  - Confirm changing source rows would not affect existing instance rows.
