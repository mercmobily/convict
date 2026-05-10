import { defineCrudResource } from "@jskit-ai/resource-crud-core/shared/crudResource";

const resource = defineCrudResource({
  namespace: "user_progressions",
  tableName: "user_progressions",
  schema: {
  userId: {
    type: "id",
    required: true,
    search: true,
    hidden: true,
    operations: {}
  },
  programAssignmentId: {
    type: "id",
    required: true,
    search: true,
    relation: { kind: "lookup", namespace: "program-assignments", valueKey: "id" },
    belongsTo: "programAssignments",
    as: "programAssignment",
    ui: { formControl: "autocomplete" },
    operations: {
      output: { required: true },
      create: { required: true },
      patch: { required: false }
    }
  },
  instanceProgressionId: {
    type: "id",
    required: true,
    search: true,
    relation: { kind: "lookup", namespace: "instance-progressions", valueKey: "id" },
    belongsTo: "instanceProgressions",
    as: "instanceProgression",
    ui: { formControl: "autocomplete" },
    operations: {
      output: { required: true },
      create: { required: true },
      patch: { required: false }
    }
  },
  currentInstanceProgressionEntryId: {
    type: "id",
    required: true,
    search: true,
    relation: { kind: "lookup", namespace: "instance-progression-entries", valueKey: "id" },
    belongsTo: "instanceProgressionEntries",
    as: "currentInstanceProgressionEntry",
    ui: { formControl: "autocomplete" },
    operations: {
      output: { required: true },
      create: { required: true },
      patch: { required: false }
    }
  },
  readyToAdvanceInstanceProgressionEntryId: {
    type: "id",
    nullable: true,
    search: true,
    relation: { kind: "lookup", namespace: "instance-progression-entries", valueKey: "id" },
    belongsTo: "instanceProgressionEntries",
    as: "readyToAdvanceInstanceProgressionEntry",
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
  lastCompletedWorkoutId: {
    type: "id",
    nullable: true,
    search: true,
    relation: { kind: "lookup", namespace: "workouts", valueKey: "id" },
    belongsTo: "workouts",
    as: "lastCompletedWorkout",
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
    ids: { type: "array", actualField: "id", filterOperator: "in" },
    programAssignmentId: { type: "id", actualField: "program_assignment_id", filterOperator: "=" },
    programAssignmentIds: { type: "array", actualField: "program_assignment_id", filterOperator: "in" },
    instanceProgressionId: { type: "id", actualField: "instance_progression_id", filterOperator: "=" },
    instanceProgressionIds: { type: "array", actualField: "instance_progression_id", filterOperator: "in" },
    currentInstanceProgressionEntryId: { type: "id", actualField: "current_instance_progression_entry_id", filterOperator: "=" },
    currentInstanceProgressionEntryIds: { type: "array", actualField: "current_instance_progression_entry_id", filterOperator: "in" },
    readyToAdvanceInstanceProgressionEntryId: { type: "id", actualField: "ready_to_advance_instance_progression_entry_id", filterOperator: "=" },
    readyToAdvanceInstanceProgressionEntryIds: { type: "array", actualField: "ready_to_advance_instance_progression_entry_id", filterOperator: "in" },
    lastCompletedWorkoutId: { type: "id", actualField: "last_completed_workout_id", filterOperator: "=" },
    lastCompletedWorkoutIds: { type: "array", actualField: "last_completed_workout_id", filterOperator: "in" },
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
