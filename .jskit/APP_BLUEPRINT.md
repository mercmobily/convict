# App Blueprint

## Product

- App purpose:
  Personal Convict Conditioning tracker with optional cell-based accountability through JSKIT workspaces.
- Primary users:
  Individual trainees following Convict Conditioning programs.
- Success criteria:
  Users can pick a program, see today's prescribed work, log sessions quickly, and understand whether they should stay on a step or advance.

## Platform Choices

- Tenancy mode:
  `personal`
- Database engine:
  MariaDB / MySQL
- Auth provider:
  Supabase
- Optional extras:
  Workspaces enabled and repurposed as `cells`; assistant/realtime/social scoring deferred beyond v1

## Actors And Access

- Actor list:
  Guest, authenticated user, cell member, cell admin, console admin
- Permission boundaries:
  Training data is user-owned. Cell membership governs social visibility, not ownership of progress.
- Console/admin-only areas:
  Internal admin and support tooling only

## Surfaces

- Global surfaces:
  `home`, `auth`, `account`, `console`
- Workspace surfaces:
  `app` for day-to-day cell participation and personal training views
- Settings surfaces:
  `account` for personal settings, `admin` for cell settings and membership

## Data Model

| Entity | Purpose | Ownership | Notes |
| --- | --- | --- | --- |
| exercises | Canonical Big 6 exercise families | system | One row per family |
| exercise_steps | Canonical progression steps and thresholds | system | Includes `measurement_unit` |
| programs | Canonical programs and user forks | system or user | Built-ins are system-owned; forks are user-owned |
| program_schedule_entries | Day-by-day program prescriptions | follows parent program | One row per weekday exercise entry |
| user_program_assignments | User's active training timeline | user | Owns program lifecycle, start/end dates, and active status |
| user_program_assignment_revisions | Effective-dated schedule revisions for an assignment | user | Source of truth for derived future workouts |
| user_exercise_progress | Current step and state per user per exercise family | user | Global across programs; separates earned advancement from current active step |
| personal_step_variations | User-defined variants of a canonical step | user | For injury, rehab, or practical substitutions |
| workout_occurrences | Persisted actualized or explicitly resolved workouts | user | Stores `scheduled_for_date`, `performed_on_date`, and resolution state |
| workout_occurrence_exercises | Exercise rows within a workout occurrence | user | Captures canonical step, optional variation, and planned set range |
| workout_set_logs | Actual logged sets within an occurrence exercise row | user | Stores reps or seconds per set |

## Route And Screen Plan

- Home/global routes:
  Landing page, product explanation, sign-up/login
- Account routes:
  Profile, reminders, export, visibility preferences
- Console routes:
  Internal admin/support only
- Workspace app routes:
  Today, History, Progress, Members
- Workspace admin routes:
  Cell settings, invites, member management

## Package Plan

- Baseline runtime packages:
  Existing JSKIT users/auth/workspaces/database stack already installed
- Optional runtime packages:
  None required for the MVP rules stage
- Generator packages to use:
  To be decided when implementation starts
- Package-owned workflows to accept as baseline:
  JSKIT workspace membership and invitation flows
- Package-owned workflows to override or extend:
  Workspaces are relabeled conceptually as `cells`

## Implementation Notes

- CRUDs to scaffold:
  User progress and session logging entities later
- Non-CRUD pages to scaffold:
  Today, Choose Program, Progress, History, Missed Workouts, Cell Members
- Custom code areas:
  Progression engine, program assignment logic, revision-aware schedule projection, overdue workflow, adherence calculations
- Delivery strategy:
  Use very vertical slices.
  Every new service, query, or mutation must ship with the smallest usable UI that exercises it in the same chunk.
  The product should become usable slice-by-slice rather than waiting for a full backend-first pass.
- First runtime slices:
  1. Program Selection: assignment service plus `Choose Program` screen
  2. Today: revision-aware schedule projection plus `Today` screen
  3. Workout Logging: occurrence creation plus set logging screen
  4. Submit And Advancement: workout submission plus `ready to advance` prompt and manual apply action
  5. Progress And History: progress detail plus calendar/history screens

## Concrete Table Proposal

### `user_program_assignments`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `bigint unsigned` | Primary key |
| `user_id` | `bigint unsigned` | FK to `users.id`, `ON DELETE CASCADE` |
| `workspace_id` | `bigint unsigned nullable` | FK to `workspaces.id`, `ON DELETE SET NULL`; optional social context only |
| `starts_on` | `date` | First date this assignment can produce scheduled workouts |
| `ends_on` | `date nullable` | Null while active |
| `status` | `varchar(32)` | `active` or `archived` |
| `created_at` | `timestamp` | Standard created timestamp |
| `updated_at` | `timestamp` | Standard updated timestamp |

Keys and constraints:
- Primary key on `id`
- Index on `user_id`
- Index on `workspace_id`
- Index on `(user_id, status)`

Notes:
- V1 should enforce one active assignment per user in application logic.
- V1 supports one active assignment per user. Multi-program concurrency is deferred.
- This table does not own schedule details directly. Revisions do.

### `user_program_assignment_revisions`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `bigint unsigned` | Primary key |
| `user_program_assignment_id` | `bigint unsigned` | FK to `user_program_assignments.id`, `ON DELETE CASCADE` |
| `program_id` | `bigint unsigned` | FK to `programs.id`; the schedule source for dates from `effective_from_date` onward |
| `effective_from_date` | `date` | First date this revision governs |
| `change_reason` | `varchar(64)` | Examples: `initial`, `program_switch`, `schedule_edit`, `fork_update` |
| `notes` | `text nullable` | Optional explanation of the change |
| `created_at` | `timestamp` | Standard created timestamp |

Keys and constraints:
- Primary key on `id`
- Unique key on `(user_program_assignment_id, effective_from_date)`
- Index on `(user_program_assignment_id, effective_from_date)`
- Index on `program_id`

Notes:
- Future schedule projection reads from the latest revision effective on the requested date.
- Programs should be treated as immutable once referenced by a revision.
- Editing a user-owned fork after it has been used should create a new program row and a new revision, not mutate the historical source row in place.

### `personal_step_variations`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `bigint unsigned` | Primary key |
| `user_id` | `bigint unsigned` | FK to `users.id`, `ON DELETE CASCADE` |
| `canonical_step_id` | `bigint unsigned` | FK to `exercise_steps.id`, `ON DELETE CASCADE` |
| `name` | `varchar(160)` | User-visible variation name |
| `measurement_unit` | `varchar(16)` | Defaults to canonical step unit; allows `reps` or `seconds` override when needed |
| `reason` | `varchar(160) nullable` | Short reason such as injury or equipment limitation |
| `notes` | `text nullable` | Longer explanation |
| `status` | `varchar(32)` | `active` or `archived` |
| `created_at` | `timestamp` | Standard created timestamp |
| `updated_at` | `timestamp` | Standard updated timestamp |

Keys and constraints:
- Primary key on `id`
- Index on `user_id`
- Index on `canonical_step_id`
- Index on `(user_id, canonical_step_id, status)`

Notes:
- Variations do not replace canonical steps.
- When a variation is active, progression guidance is advisory.

### `user_exercise_progress`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `bigint unsigned` | Primary key |
| `user_id` | `bigint unsigned` | FK to `users.id`, `ON DELETE CASCADE` |
| `exercise_id` | `bigint unsigned` | FK to `exercises.id`, `ON DELETE CASCADE` |
| `current_step_id` | `bigint unsigned` | FK to `exercise_steps.id`; what the user is actually doing now |
| `ready_to_advance_step_id` | `bigint unsigned nullable` | FK to `exercise_steps.id`; next earned step, not yet applied |
| `active_variation_id` | `bigint unsigned nullable` | FK to `personal_step_variations.id`, `ON DELETE SET NULL` |
| `ready_to_advance_at` | `timestamp nullable` | When the user earned advancement |
| `last_completed_occurrence_id` | `bigint unsigned nullable` | Optional FK to the last completed `workout_occurrences.id` |
| `last_completed_at` | `timestamp nullable` | Last completed workout touching this exercise |
| `stall_count` | `smallint unsigned` | Default `0` |
| `created_at` | `timestamp` | Standard created timestamp |
| `updated_at` | `timestamp` | Standard updated timestamp |

Keys and constraints:
- Primary key on `id`
- Unique key on `(user_id, exercise_id)`
- Index on `current_step_id`
- Index on `ready_to_advance_step_id`

Notes:
- `current_step_id` and `ready_to_advance_step_id` must belong to the same exercise family in application logic.
- This table intentionally separates earned advancement from applied advancement.

### `workout_occurrences`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `bigint unsigned` | Primary key |
| `user_id` | `bigint unsigned` | FK to `users.id`, `ON DELETE CASCADE` |
| `user_program_assignment_id` | `bigint unsigned` | FK to `user_program_assignments.id`; protect history with `RESTRICT` / default no-action |
| `user_program_assignment_revision_id` | `bigint unsigned` | FK to `user_program_assignment_revisions.id`; protects the source revision used |
| `workspace_id` | `bigint unsigned nullable` | FK to `workspaces.id`, `ON DELETE SET NULL` |
| `scheduled_for_date` | `date` | When this workout should have happened |
| `performed_on_date` | `date nullable` | When it actually happened |
| `status` | `varchar(32)` | `in_progress`, `completed`, or `definitely_missed` |
| `started_at` | `timestamp nullable` | First interaction time |
| `submitted_at` | `timestamp nullable` | Final submission time for completed workouts |
| `definitely_missed_at` | `timestamp nullable` | Explicit abandonment time |
| `notes` | `text nullable` | User notes about the workout |
| `created_at` | `timestamp` | Standard created timestamp |
| `updated_at` | `timestamp` | Standard updated timestamp |

Keys and constraints:
- Primary key on `id`
- Unique key on `(user_program_assignment_id, scheduled_for_date)`
- Index on `user_id`
- Index on `(user_id, scheduled_for_date)`
- Index on `(user_id, performed_on_date)`
- Index on `(user_program_assignment_revision_id, scheduled_for_date)`

Notes:
- Only actualized or explicitly resolved workouts get rows here.
- `scheduled` and `overdue` remain derived states and are not persisted as occurrence rows in v1.

### `workout_occurrence_exercises`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `bigint unsigned` | Primary key |
| `workout_occurrence_id` | `bigint unsigned` | FK to `workout_occurrences.id`, `ON DELETE CASCADE` |
| `slot_number` | `smallint unsigned` | Preserves workout ordering |
| `exercise_id` | `bigint unsigned` | FK to `exercises.id` |
| `exercise_name_snapshot` | `varchar(160)` | Historical display snapshot |
| `canonical_step_id` | `bigint unsigned` | FK to `exercise_steps.id` |
| `canonical_step_name_snapshot` | `varchar(160)` | Historical display snapshot |
| `personal_step_variation_id` | `bigint unsigned nullable` | FK to `personal_step_variations.id`, `ON DELETE SET NULL` |
| `variation_name_snapshot` | `varchar(160) nullable` | Historical display snapshot |
| `measurement_unit_snapshot` | `varchar(16)` | Effective input unit at log time |
| `planned_work_sets_min` | `smallint unsigned` | Snapshot from the schedule source |
| `planned_work_sets_max` | `smallint unsigned` | Snapshot from the schedule source |
| `progression_sets_snapshot` | `smallint unsigned nullable` | Snapshot from the canonical step at log time |
| `progression_reps_min_snapshot` | `smallint unsigned nullable` | Snapshot from the canonical step at log time |
| `progression_reps_max_snapshot` | `smallint unsigned nullable` | Snapshot from the canonical step at log time |
| `progression_seconds_snapshot` | `smallint unsigned nullable` | Snapshot from the canonical step at log time |
| `status` | `varchar(32)` | `pending`, `completed`, or `skipped` |
| `notes` | `text nullable` | Exercise-level notes |
| `created_at` | `timestamp` | Standard created timestamp |
| `updated_at` | `timestamp` | Standard updated timestamp |

Keys and constraints:
- Primary key on `id`
- Unique key on `(workout_occurrence_id, slot_number)`
- Unique key on `(workout_occurrence_id, exercise_id)`
- Index on `exercise_id`
- Index on `canonical_step_id`

Notes:
- Snapshotting names and benchmark fields keeps history stable even if later edits correct source data.
- `status` is intentionally per exercise row so incomplete workout attempts can be represented cleanly.

### `workout_set_logs`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `bigint unsigned` | Primary key |
| `workout_occurrence_exercise_id` | `bigint unsigned` | FK to `workout_occurrence_exercises.id`, `ON DELETE CASCADE` |
| `set_number` | `smallint unsigned` | Display/order within the exercise |
| `side` | `varchar(16)` | `both`, `left`, or `right` |
| `measurement_unit_snapshot` | `varchar(16)` | The unit used for this set |
| `performed_value` | `smallint unsigned` | Reps or seconds |
| `qualifies_for_progression` | `boolean` | Derived when the set is evaluated against the occurrence exercise snapshot |
| `logged_at` | `timestamp` | Exact time the set was logged |
| `created_at` | `timestamp` | Standard created timestamp |
| `updated_at` | `timestamp` | Standard updated timestamp |

Keys and constraints:
- Primary key on `id`
- Unique key on `(workout_occurrence_exercise_id, set_number, side)`
- Index on `logged_at`

Notes:
- V1 logs only work sets. Warmup-specific tracking can be added later if needed.
- `performed_value` is unit-agnostic because the unit is captured in the snapshot column.

## Product Rules

- Completed workout:
  A workout is a scheduled calendar expectation that becomes a persisted workout occurrence only when the user starts resolving it.
  The user may log parts of it throughout the day.
  It becomes complete only when the user explicitly submits that workout occurrence.
- Completed scheduled day:
  A scheduled day counts as completed when the derived expected workout for that date has a matching completed workout occurrence.
  A completed workout may still be below the programmed minimum volume on one or more exercises.
  Timeliness is separate from completion.
  The system always stores both `scheduled_for_date` and `performed_on_date`.
  Whether the user met the programmed minimum remains derivable from saved set counts versus `planned_work_sets_min`.
- Ready to advance:
  A user can earn a `ready_to_advance` state when a single submitted workout occurrence logs at least `progression_sets` qualifying work sets for the current step and every qualifying set meets the progression target.
  For time-based steps, the target is `progression_seconds`.
  If a time-based canonical step has no explicit `progression_sets`, one qualifying timed set is enough to earn readiness.
  For rep-based steps, the target is `progression_reps_max` when present, otherwise `progression_reps_min`.
  This benchmark can exceed the program's normal daily minimum volume, so users may log extra sets on benchmark or test days.
  The system does not auto-advance the user.
  Advancement is earned automatically but applied only when the user explicitly chooses to move to the next step.
- Missed day behavior:
  Future workouts are not persisted ahead of time.
  The system derives expected workouts from the active assignment revision for a given date.
  If a past scheduled date has no completed or definitely-missed workout occurrence, that workout is derived as overdue.
  Overdue workouts remain actionable and can be completed at any later time.
  Multiple overdue and current workouts may be completed on the same `performed_on_date`.
  The user can explicitly mark an overdue workout as `definitely_missed` by creating a resolved workout occurrence.
  The system should surface a missed or overdue workout list instead of silently discarding old workouts.
- Program change behavior:
  Program or schedule changes create a new assignment revision with an effective start date.
  Calendar and future schedule views are recomputed from assignment revisions on read.
  Past completed workouts, definitely-missed workouts, and historical logs remain unchanged.
  Personal exercise progress carries forward.
  The product should feel flexible enough that users can adjust schedule or program structure without feeling locked in.
  Editing a user-owned fork that has already been used by a revision should create a new program source row rather than mutating the historical source in place.
- Calendar generation:
  The calendar is a projection, not a store of pre-generated future rows.
  Future training days are derived from program schedule entries and assignment revisions for the requested date range.
  Persisted workout occurrences overlay that derived schedule to show completed, in-progress, and definitely-missed workouts.
- Progress scope:
  Progress is tracked globally per user per exercise family, not separately per program.
- Canonical steps and personal variations:
  Canonical Convict Conditioning steps remain the core progression anchor.
  Users may attach a personal variation to a canonical step for injury, rehab, or practical substitution reasons.
  Logs store both the canonical step and the optional active variation.
  When a personal variation is active, progression prompts remain advisory and the user keeps explicit control over whether to stay or advance.
- Cell visibility in v1:
  Cell members can see display name, active program name, weekly adherence, streak, last completed workout date, and milestone headlines.
  Raw set logs, private notes, and exact reps/seconds are private by default.
- Future scoring principle:
  Competition later should weight adherence first and progression second.
  The primary signals are completed scheduled days, weekly adherence percentage, and streaks.
  Progression milestones and step advancement are secondary bonuses.

## CRUD Planning

| CRUD | Operations | List Fields | View Form Shape | Edit/New Form Shape | Notes |
| --- | --- | --- | --- | --- | --- |
| User program assignments | list, view, new, edit | program, status, start date | Lightweight summary and history | Choose program and start date | One active assignment expected in v1 |
| User program assignment revisions | list, view, new | effective date, source program, notes | Revision timeline | Edit schedule from a given date forward | Drives derived calendar behavior |
| User exercise progress | list, view | exercise, current step, earned advancement, status | Exercise-centric detail | N/A | Derived mostly from logging |
| Personal step variations | list, view, new, edit | canonical step, variation name, reason, status | Variation detail with history | Create variation name and notes | Optional flexibility layer |
| Workout occurrences | list, view, new, edit | scheduled date, performed date, status, lateness | Workout summary with exercise rows | Fast logging flow with submit or definitely missed | Stores only actualized or explicitly resolved workouts |
| Program forks | list, view, new, edit | name, source program, status | Weekly schedule detail | Clone and adjust schedule | System programs are read-only |

## Delivery Plan

| Chunk | Goal | Type | Depends on | Done when |
| --- | --- | --- | --- | --- |
| 1 | Lock product and rules | custom local code/docs | none | Blueprint, workboard, and TODO reflect final product decisions |
| 2 | Add user progress and occurrence schema | custom local code | 1 | Tables and ownership model are implemented |
| 3 | Program Selection slice | custom local code + UI | 2 | User can choose a program, pick a start date, and create an active assignment with its first revision |
| 4 | Today slice | custom local code + UI | 2, 3 | User can open the app and see today's derived workout plus overdue workouts |
| 5 | Workout Logging slice | custom local code + UI | 2, 4 | User can start a workout occurrence and log reps or seconds against the prescribed exercises |
| 6 | Submit And Advancement slice | custom local code + UI | 2, 5 | User can submit a workout, earn `ready to advance`, and choose whether to apply advancement |
| 7 | Progress And History slice | custom local code + UI | 2, 6 | User can inspect current progress, earned advancement, and calendar/history detail |
| 8 | Cell Visibility slice | custom local code + UI | 4, 7 | Cell members can see adherence and milestone summaries without private set logs |

## Verification

- Commands to run:
  Verify planning docs by readback; implementation verification added in later chunks
- Playwright coverage plan:
  Start with the `Choose Program` flow in Slice 3, then extend coverage slice-by-slice as each user-facing screen is added
- Test auth strategy:
  Use JSKIT dev auth bypass once authenticated UI work starts
- UI review expectations:
  Mobile-first day logging flow with explicit step/unit/target visibility
- Known open questions:
  Multi-cell membership in v1, exact future scoring formula, and how much automatic guidance to show for personal variations remain deferred
