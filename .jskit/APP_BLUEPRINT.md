# App Blueprint

## Product

- App purpose:
  Personal Convict Conditioning tracker focused on one authenticated user's program, workout logs, progress, and history.
- Primary users:
  Individual trainees following Convict Conditioning programs.
- Success criteria:
  Users can pick a program, see today's prescribed work, log sessions quickly, and understand whether they should stay on a step or advance.

## Platform Choices

- Tenancy mode:
  `none`
- Database engine:
  MariaDB / MySQL
- Auth provider:
  Supabase
- Optional extras:
  Realtime remains available for app/runtime status. Workspaces are not part of the Convict product model. Assistant/social scoring deferred beyond v1.

## Actors And Access

- Actor list:
  Guest, authenticated user, console admin
- Permission boundaries:
  Training data is user-owned. Workspace membership is not part of access control for Convict training data.
- Console/admin-only areas:
  Internal admin and support tooling only

## Surfaces

- Global surfaces:
  `home`, `auth`, `account`, `console`
- App surfaces:
  `app` for authenticated personal training views at `/app`
- Settings surfaces:
  `account` for personal settings, `console` for operator tooling

## Data Model

| Entity | Purpose | Ownership | Notes |
| --- | --- | --- | --- |
| exercises | Canonical concrete movements | system | One row per actual exercise movement |
| categories | Canonical grouping/search taxonomy | system | Includes the Convict movement families as categories |
| exercise_categories | Exercise-to-category taxonomy links | system | Supports primary and secondary category metadata |
| progressions | Canonical ordered progression paths | system | Convict families are progression paths, not exercises |
| progression_entries | Canonical progression entries and thresholds | system | Points each entry at a concrete exercise |
| routines | Canonical reusable direct-exercise routine definitions | system | Used for warmups/cooldowns, not main progression work |
| routine_entries | Ordered direct exercises inside canonical routines | system | Direct exercises only |
| program_collections | Source program families/catalog groupings | system | Example: Convict Conditioning |
| programs | Stable source program identity | system | Example: New Blood |
| program_versions | Immutable published source program version | system | Program selection copies a version |
| program_entries | Source main-work prescriptions | system | Belongs to a program version and schedules a progression or direct exercise |
| program_routines | Source warmup/cooldown routine assignments | system | Belongs to a program version |
| instance_programs | User-owned copied program version | user | A frozen copy is created when the user selects a version |
| instance_program_entries | User-owned copied main work rows | user | Points to copied instance progressions for progression work |
| instance_progressions | User-owned copied progressions | user | Prevents source progression edits from changing active training |
| instance_progression_entries | User-owned copied progression entries | user | Snapshot of ordered standards and exercise links |
| instance_program_routines | User-owned copied routine assignments | user | Snapshot routine headers for the copied program |
| instance_routine_entries | User-owned copied routine entries | user | Snapshot routine exercise rows |
| program_assignments | User's active training timelines | user | Multiple active assignments per user are allowed |
| program_assignment_revisions | Effective-dated assignment revisions | user | Points assignment history to current instance program |
| user_progressions | Assignment-scoped progression state | user | Unique per assignment and instance progression |
| workouts | Persisted actualized or explicitly resolved workouts | user | Unique per assignment/date, not user/date |
| workout_exercises | Exercise rows within a workout | user | Snapshots copied program/progression/routine data |
| workout_sets | Actual logged sets within a workout exercise row | user | Stores reps or seconds per set |

## Route And Screen Plan

- Home/global routes:
  Landing page, product explanation, sign-up/login
- Account routes:
  Profile, reminders, export, visibility preferences
- Console routes:
  Internal admin/support only
- App routes:
  Today, History, Progress, Workout detail

## Package Plan

- Baseline runtime packages:
  Existing JSKIT users/auth/database stack already installed
- Optional runtime packages:
  None required for the MVP rules stage
- Generator packages to use:
  `crud-server-generator` for every persisted app-owned table first; `feature-server-generator` only for true workflow/orchestration packages that sit on top of generated resources
- Package-owned workflows to accept as baseline:
  JSKIT users/auth/session flows
- Package-owned workflows to override or extend:
  None for Convict training.

## Implementation Notes

- CRUDs to scaffold:
  `exercises`, `categories`, `exercise_categories`, `progressions`, `progression_entries`, `routines`, `routine_entries`, `program_collections`, `programs`, `program_versions`, `program_entries`, `program_routines`, `instance_programs`, `instance_program_entries`, `instance_program_routines`, `instance_routine_entries`, `instance_progressions`, `instance_progression_entries`, `program_assignments`, `program_assignment_revisions`, `user_progressions`, `workouts`, `workout_exercises`, and `workout_sets`
- Non-CRUD pages to scaffold:
  Today, Choose Program, Progress, History, Missed Workouts
- Custom code areas:
  Progression engine, revision-aware schedule projection, overdue workflow, workout submission/advancement orchestration, adherence calculations
- CRUD-first rule:
  Persisted app-owned entities must be scaffolded through `crud-server-generator` before custom workflow code is added. Generated resources own the canonical CRUD contract and migration scaffold. Custom services may orchestrate those entities later, but data reads and writes should go through JSKIT/internal `json-rest-api` seams rather than direct Knex unless there is a clear explicit exception.
- Program-copy rule:
  Program selection never points an assignment directly at source rows. The user first picks a `program_collection`, then picks the latest published `program_version`. The app clones that version plus entries, routines, routine entries, progressions, and progression entries into `instance_*` tables before the assignment revision is written. A user cannot copy the same source `program` twice.
- Multi-program rule:
  A user may have multiple active `program_assignments`. `user_progressions` are scoped to `program_assignment_id`, and `workouts` are unique by `(program_assignment_id, scheduled_for_date)` so two active programs can schedule work on the same date.
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

- Source/catalog tables:
  `exercises`, `categories`, `exercise_categories`, `progressions`, `progression_entries`, `routines`, `routine_entries`, `program_collections`, `programs`, `program_versions`, `program_entries`, and `program_routines`.
- Copied/user-owned structure tables:
  `instance_programs`, `instance_program_entries`, `instance_program_routines`, `instance_routine_entries`, `instance_progressions`, and `instance_progression_entries`.
- Runtime/user state tables:
  `program_assignments`, `program_assignment_revisions`, `user_progressions`, `workouts`, `workout_exercises`, and `workout_sets`.

Key constraints:
- `program_versions` belong to `programs`; `programs` belong to `program_collections`.
- `program_entries` and `program_routines` belong to `program_versions`, not directly to source `programs`.
- `instance_programs` copy a `program_version` and retain `source_program_id` plus `source_program_version_id`.
- `instance_programs` are unique by `(user_id, source_program_id)` so a user cannot copy the same source program twice.
- `instance_program_entries` point to `instance_progressions` for progression work.
- `instance_progressions` and `instance_progression_entries` copy the source progression data used by the selected program.
- `program_assignments` allow multiple active rows per user.
- `program_assignment_revisions` point to `instance_programs`.
- `user_progressions` include `program_assignment_id` and are unique by `(program_assignment_id, instance_progression_id)`.
- `workouts` are unique by `(program_assignment_id, scheduled_for_date)`.
- `workouts` must not have a unique key on `(user_id, scheduled_for_date)`.
- `workout_exercises` snapshot copied instance program/progression/routine data.

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
  Progress is assignment-scoped, so two active programs can advance independently even when they copy the same source progression.
  Source edits never alter an existing user's copied instance rows.
- Calendar generation:
  The calendar is a projection, not a store of pre-generated future rows.
  Future training days are derived from instance program entries and assignment revisions for the requested date range.
  Persisted workouts overlay that derived schedule to show completed, in-progress, and definitely-missed workouts.
- Progress scope:
  Progress is tracked per program assignment and copied instance progression.
- Source and instance separation:
  Source rows are reusable catalog/publishing rows.
  Instance rows are frozen user-owned copies used for training.
  Runtime rows track mutable state and logs.
- Sharing visibility in v1:
  Personal training data stays in the unscoped authenticated app surface and is owned by the current user.
  Shared adherence, milestone, or leaderboard views are deferred until a specific collaboration slice exists.
- Future scoring principle:
  Competition later should weight adherence first and progression second.
  The primary signals are completed scheduled days, weekly adherence percentage, and streaks.
  Progression milestones and step advancement are secondary bonuses.

## CRUD Planning

| CRUD | Operations | List Fields | View Form Shape | Edit/New Form Shape | Notes |
| --- | --- | --- | --- | --- | --- |
| Source catalog CRUDs | generated server CRUD | id, name/slug/status where present | JSON REST only for now | No app UI in this slice | Public/system data |
| Instance structure CRUDs | generated server CRUD | id, user, source ids | JSON REST only for now | Created by workflow copy service | User-owned frozen copies |
| Runtime state CRUDs | generated server CRUD | id, user, assignment/status/date | JSON REST plus custom workflow UI | Mutated by Today/workout/progress flows | User-owned mutable state |

## Delivery Plan

| Chunk | Goal | Type | Depends on | Done when |
| --- | --- | --- | --- | --- |
| 1 | Rebuild live DB model | direct DB | current source data | New tables exist with source data preserved and user runtime rows reset |
| 2 | Regenerate server CRUD packages | generator | 1 | Every app-owned table has generated server CRUD ownership |
| 3 | Rewire workflow services | custom server code | 2 | Program selection, Today, Progress, History, and workout flows use new JSON REST resources |
| 4 | Rewire app UI | custom UI code | 3 | Program picker is collection-first and supports multiple active programs |
| 5 | Verify end to end | tests/browser | 4 | Full suite, real smoke, and DB invariant checks pass |

## Verification

- Commands to run:
  `npm install`, `npm run devlinks`, `npm run lint`, `npm test`, `npm run build:all`, targeted and full Playwright, `npx jskit app verify-ui ...`, `npx jskit doctor`, and DB invariant queries.
- Playwright coverage plan:
  Cover collection-first program selection, two active programs, Today grouping, set logging, workout finish, Progress, History, and app route smoke.
- Test auth strategy:
  Use JSKIT dev auth bypass for automated browser tests and `tonymobily@gmail.com` / `2.ccns.2` for the final real smoke when needed.
- UI review expectations:
  Mobile-first day logging flow with explicit step/unit/target visibility
- Known open questions:
  Collaboration/visibility, custom program authoring UI, and exercise/program creation UI remain deferred.
