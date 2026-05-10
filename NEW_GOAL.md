
Target Model

  Source/catalog world:

  - exercises: concrete movements.
  - categories: taxonomy/search grouping.
  - exercise_categories: exercise-to-category link table.
  - progressions: reusable progression path identity.
  - progression_entries: ordered exercises inside a progression.
  - routines: reusable warmup/cooldown block.
  - routine_entries: ordered exercises inside a routine.
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

  - program_assignments: user is doing this copied program.
  - program_assignment_revisions: assignment history, points to current instance_program.
  - user_progressions: user progress against an instance_progression.
  - workouts: scheduled/performed workout days.
  - workout_exercises: workout exercise snapshots.
  - workout_sets: logged sets.

  Key rule:

  - Source tables are reusable/publishable.
  - Instance tables are frozen copies used for training.
  - Runtime tables are mutable user state.
  - Users never train directly from source rows.

  Versioning Decision

  Add versioning now.

  Use:

  - programs for stable identity.
  - program_versions for immutable published versions.
  - program_entries and program_routines belong to program_versions, not directly to programs.

  Selection flow becomes:

  1. Show latest published program_versions, grouped by program.
  2. User picks one version.
  3. Copy that program_version into instance_programs.
  4. Copy program_entries into instance_program_entries.
  5. Copy used progressions into instance_progressions.
  6. Copy progression_entries into instance_progression_entries.
  7. Copy program_routines into instance_program_routines.
  8. Copy routine_entries into instance_routine_entries.
  9. Create program_assignments.
  10. Create program_assignment_revisions.
  11. Seed user_progressions against copied instance_progressions.

  That prevents source edits from changing existing users’ training.

  Precise Todo

  Stage 1: Freeze and inspect

  - Re-read AGENTS.md and JSKIT app instructions.
  - Confirm current DB/table/package state.
  - Confirm generated CRUD package names and route/resource names.
  - Confirm no unexpected uncommitted user changes.
  - Write the final rename/version map before touching code.

  Stage 2: DB source rename and versioning

  - Rename/create source tables first.
  - Add program_versions.
  - Move current program_templates data into:
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

  - Update program-assignment selection flow to copy from program_versions.
  - Copy source progressions into instance progressions during selection.
  - Seed user_progressions against instance progressions.
  - Update today projection to read instance program/progression data only.
  - Update progress projection to read user_progressions and instance progression entries.
  - Keep workflow repos thin and JSON REST based.

  Stage 6: Update UI

  - Program picker reads latest published program_versions.
  - Existing app pages should show no behavioral change.
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
      - open today
      - add sets
      - finish workout
      - confirm progress updates
  - Confirm source catalog rows remain unchanged.
  - Confirm changing source rows would not affect existing instance rows.
