import { defineCrudResource } from "@jskit-ai/resource-crud-core/shared/crudResource";

const resource = defineCrudResource({
  namespace: "user_progression_track_progress",
  tableName: "user_progression_track_progress",
  schema: {
  userId: {
    type: "id",
    required: true,
    search: true,
    hidden: true,
    operations: {}
  },
  progressionTrackId: {
    type: "id",
    required: true,
    search: true,
    relation: { kind: "lookup", namespace: "progression-tracks", valueKey: "id" },
    belongsTo: "progressionTracks",
    as: "progressionTrack",
    ui: { formControl: "autocomplete" },
    operations: {
      output: { required: true },
      create: { required: true },
      patch: { required: false }
    }
  },
  currentProgressionTrackStepId: {
    type: "id",
    required: true,
    search: true,
    relation: { kind: "lookup", namespace: "progression-track-steps", valueKey: "id" },
    belongsTo: "progressionTrackSteps",
    as: "currentProgressionTrackStep",
    ui: { formControl: "autocomplete" },
    operations: {
      output: { required: true },
      create: { required: true },
      patch: { required: false }
    }
  },
  readyToAdvanceProgressionTrackStepId: {
    type: "id",
    nullable: true,
    search: true,
    relation: { kind: "lookup", namespace: "progression-track-steps", valueKey: "id" },
    belongsTo: "progressionTrackSteps",
    as: "readyToAdvanceProgressionTrackStep",
    ui: { formControl: "autocomplete" },
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  readyToAdvanceAt: {
    type: "dateTime",
    nullable: true,
    search: true,
    storage: { writeSerializer: "datetime-utc" },
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  lastCompletedOccurrenceId: {
    type: "id",
    nullable: true,
    search: true,
    relation: { kind: "lookup", namespace: "workout-occurrences", valueKey: "id" },
    belongsTo: "workoutOccurrences",
    as: "lastCompletedOccurrence",
    ui: { formControl: "autocomplete" },
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  lastCompletedAt: {
    type: "dateTime",
    nullable: true,
    search: true,
    storage: { writeSerializer: "datetime-utc" },
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  stallCount: {
    type: "integer",
    min: 0,
    search: true,
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  startedAt: {
    type: "dateTime",
    nullable: true,
    search: true,
    storage: { writeSerializer: "datetime-utc" },
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  createdAt: {
    type: "dateTime",
    default: "now()",
    storage: { writeSerializer: "datetime-utc" },
    operations: {
      output: { required: true }
    }
  },
  updatedAt: {
    type: "dateTime",
    default: "now()",
    storage: { writeSerializer: "datetime-utc" },
    operations: {
      output: { required: true }
    }
  },
  },
  searchSchema: {
    id: { type: "id", actualField: "id" },
    progressionTrackId: { type: "id", actualField: "progression_track_id", filterOperator: "=" },
    progressionTrackIds: { type: "array", actualField: "progression_track_id", filterOperator: "in" },
    currentProgressionTrackStepId: { type: "id", actualField: "current_progression_track_step_id", filterOperator: "=" },
    readyToAdvanceProgressionTrackStepId: { type: "id", actualField: "ready_to_advance_progression_track_step_id", filterOperator: "=" },
    lastCompletedOccurrenceId: { type: "id", actualField: "last_completed_occurrence_id", filterOperator: "=" },
  },
  defaultSort: ["-createdAt"],
  autofilter: "user",
  messages: {
    validation: "Fix invalid values and try again.",
    saveSuccess: "Record saved.",
    saveError: "Unable to save record.",
    deleteSuccess: "Record deleted.",
    deleteError: "Unable to delete record."
  },
  contract: {
    lookup: {
      containerKey: "lookups",
      defaultInclude: "*",
      maxDepth: 3
    }
  }
});

export { resource };
