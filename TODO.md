# Convict Tracker TODO

This is the working delivery checklist for the Convict Conditioning tracker.
It is ordered to be worked top-to-bottom and updated as decisions are locked and chunks are completed.

## Product Lock

- [x] Confirm `personal` tenancy stays as the app mode.
- [x] Confirm each JSKIT workspace is treated as a `cell`.
- [x] Confirm training data is `user-owned`, not `workspace-owned`.
- [x] Confirm canonical programs are `system-owned`.
- [x] Confirm users can `fork` canonical programs into private copies.
- [x] Confirm the v1 promise: `track progress, show today's work, log sessions, update progression`.
- [x] Confirm the non-v1 scope: `public publishing`, `global leaderboards`, `anti-cheat`, `AI coaching`, `video review`.

## Rules And Product Decisions

- [x] Define what counts as a completed workout.
- [x] Define what counts as a completed scheduled day.
- [x] Define what counts as ready to advance to the next step.
- [x] Define what happens when the user misses a day.
- [x] Define what happens when the user changes program mid-stream.
- [x] Define whether progress is shared across programs or tracked globally by exercise family.
- [x] Define what cell members can see about each other in v1.
- [x] Define the future scoring principle: `consistency first, progression second`.

## Data Model

- [x] Finalize `exercises` as the canonical exercise-family table.
- [x] Finalize `exercise_steps` as the canonical step/progression table.
- [x] Keep `measurement_unit` on `exercise_steps`, not on `exercises`.
- [x] Finalize `programs` for system programs and user forks.
- [x] Finalize `program_schedule_entries` for weekday exercise prescriptions.
- [x] Add `user_program_assignments`.
- [x] Add `user_program_assignment_revisions`.
- [x] Add `personal_step_variations`.
- [x] Add `user_exercise_progress`.
- [x] Add `workout_occurrences`.
- [x] Add `workout_occurrence_exercises`.
- [x] Add `workout_set_logs`.
- [x] Add `scheduled_for_date` and `performed_on_date` to the workout occurrence model.
- [x] Add status fields for `in_progress`, `completed`, and `definitely_missed`.
- [x] Decide whether `scheduled` and `overdue` stay fully derived instead of persisted.
- [x] Separate earned advancement from active current step in user progress.
- [x] Decide whether to snapshot step, variation, and program names into log rows for historical accuracy.
- [x] Decide that used program sources are immutable and schedule edits create a new source row plus assignment revision.
- [x] Decide whether to support one active program per user or multiple concurrent assignments.

## Delivery Strategy

- [x] Switch execution strategy to very vertical slices.
- [x] Require every new service or query to ship with the smallest usable UI in the same chunk.
- [x] Make `Program Selection` the first runtime slice.
- [x] Make `Today` the second runtime slice.
- [x] Make `Workout Logging` the third runtime slice.
- [x] Make `Submit And Advancement` the fourth runtime slice.
- [x] Make `Progress And History` the fifth runtime slice.
- [x] Build Slice 1: program assignment service plus `Choose Program` UI.
- [x] Build Slice 2: derived today projection plus `Today` UI.
- [x] Build Slice 3: workout occurrence creation and set logging plus workout detail UI.
- [x] Build Slice 4: workout submission plus `ready to advance` prompt and manual advancement UI.
- [ ] Build Slice 5: progress and history UI on top of progress services.

## Canonical Content

- [ ] Verify all Big 6 exercise families are present and correct.
- [ ] Verify every step row has correct thresholds.
- [ ] Verify every step row has correct `measurement_unit`.
- [ ] Verify `New Blood` exactly matches the book.
- [ ] Verify `Good Behavior` exactly matches the book.
- [ ] Verify `Veterano` exactly matches the book.
- [ ] Verify `Supermax` exactly matches the book.
- [ ] Add program summaries and difficulty labels for display.
- [ ] Decide whether off days are represented by empty schedule days only.

## Progression Engine

- [ ] Build logic to determine the user's current step per exercise family.
- [ ] Build revision-aware schedule projection for arbitrary date ranges.
- [x] Build logic to fetch today's prescribed workout from the active program.
- [x] Build logic to show the correct input type: `reps` or `seconds`.
- [x] Build logic to evaluate whether a logged session met the progression standard.
- [ ] Build logic to mark `ready_to_advance`, `stay`, or `review`.
- [x] Build the explicit user action that applies an earned advancement.
- [ ] Add a place to track stalls without implementing full deload rules yet.
- [x] Ensure `Handstand Push-ups` mixed-unit steps are handled correctly.
- [ ] Define how advisory prompts behave when a personal variation is active.

## Program And Forking Flow

- [x] Build the first-time `choose a program` flow.
- [ ] Build the `switch program` flow for existing users.
- [ ] Build the `fork program` action from a system program.
- [ ] Ensure schedule or program changes create a new assignment revision effective from a chosen date.
- [ ] Prevent direct editing of system programs.
- [ ] Allow editing of user-owned forked programs only.
- [ ] Preserve fork lineage back to the original program.
- [ ] Decide whether a fork starts as a draft or active immediately.

## Core User Flows

- [ ] Build onboarding: sign up, pick a program, pick a start date.
- [x] Build the `Today` screen.
- [ ] Build the calendar from derived schedule projection plus workout occurrence overlays.
- [x] Build a fast logging flow for the scheduled workout.
- [x] Allow a workout occurrence to remain open and be logged in parts throughout the day.
- [x] Build the session save flow with minimal friction.
- [x] Build a progress screen per exercise family.
- [ ] Build a history or calendar screen.
- [x] Build a `Missed Workouts` or `Overdue Workouts` screen.
- [x] Allow users to complete overdue workouts on any later date.
- [x] Allow users to mark an overdue workout as `definitely missed`.
- [ ] Allow multiple scheduled workouts to share the same performed date.
- [ ] Build a program details screen showing the weekly schedule.
- [x] Build the rest-day screen behavior.

## Cell And Workspace Features

- [ ] Reuse JSKIT workspace invites as cell invites.
- [ ] Build the cell creation flow.
- [ ] Build the cell invite flow.
- [ ] Build the cell member list.
- [ ] Show each member's basic consistency status.
- [ ] Keep cell views read-only for personal progress in v1.
- [ ] Decide whether users can belong to multiple cells in v1.
- [ ] Decide whether a workout can optionally be associated with a cell context.

## Consistency Layer

- [ ] Define weekly adherence calculation.
- [ ] Define streak calculation.
- [ ] Define how derived overdue workouts affect adherence calculations.
- [ ] Define how `definitely missed` workout occurrences affect adherence calculations.
- [ ] Add a place to store derived consistency stats.
- [ ] Decide which consistency stats are visible to cell members.
- [ ] Defer competitive scoring until core logging is stable.

## UI And UX Quality

- [ ] Keep first-use onboarding simple enough to complete in under 2 minutes.
- [ ] Make workout logging possible in under 15 seconds per exercise.
- [ ] Ensure day views work well on mobile first.
- [ ] Make current step, target, and unit visually obvious.
- [ ] Make progression outcome visually obvious after save.
- [ ] Add empty states for no program, no workout today, and no history.
- [ ] Add error states for failed save and stale progress.

## Testing

- [ ] Add unit tests for progression logic.
- [ ] Add unit tests for mixed-unit step handling.
- [ ] Add integration tests for today's workout generation.
- [ ] Add integration tests for program forking.
- [ ] Add integration tests for session logging and progress updates.
- [x] Add Playwright coverage for onboarding and program selection.
- [x] Add Playwright coverage for logging a scheduled workout.
- [x] Add Playwright coverage for viewing updated progress.
- [ ] Add Playwright coverage for cell invite and member flows.

## Release Readiness

- [ ] Add data export for personal training history.
- [ ] Add reminder preferences.
- [ ] Add privacy defaults for member visibility.
- [ ] Add support and admin notes for common user issues.
- [ ] Review the whole app for scope creep before launch.
- [ ] Freeze v1 and move all social competition work to the next milestone.
