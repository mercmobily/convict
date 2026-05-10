import { defineCrudResource } from "@jskit-ai/resource-crud-core/shared/crudResource";

const resource = defineCrudResource({
  namespace: "workout_occurrence_exercises",
  tableName: "workout_occurrence_exercises",
  schema: {
    workoutOccurrenceId: {
      type: "id",
      required: true,
      search: true,
      relation: { kind: "lookup", namespace: "workout-occurrences", valueKey: "id" },
      belongsTo: "workoutOccurrences",
      as: "workoutOccurrence",
      ui: { formControl: "autocomplete" },
      operations: {
        output: { required: true },
        create: { required: true },
        patch: { required: false }
      }
    },
    userId: {
      type: "id",
      required: true,
      search: true,
      hidden: true,
      operations: {}
    },
    slotNumber: {
      type: "integer",
      min: 0,
      required: true,
      search: true,
      operations: {
        output: { required: true },
        create: { required: true },
        patch: { required: false }
      }
    },
    section: {
      type: "string",
      maxLength: 32,
      required: true,
      search: true,
      operations: {
        output: { required: true },
        create: { required: false },
        patch: { required: false }
      }
    },
    sourceKind: {
      type: "string",
      maxLength: 32,
      required: true,
      search: true,
      operations: {
        output: { required: true },
        create: { required: false },
        patch: { required: false }
      }
    },
    programScheduleEntryId: {
      type: "id",
      nullable: true,
      search: true,
      relation: { kind: "lookup", namespace: "program-schedule-entries", valueKey: "id" },
      belongsTo: "programScheduleEntries",
      as: "programScheduleEntry",
      ui: { formControl: "autocomplete" },
      operations: {
        output: { required: true },
        create: { required: false },
        patch: { required: false }
      }
    },
    programRoutineEntryId: {
      type: "id",
      nullable: true,
      search: true,
      relation: { kind: "lookup", namespace: "program-routine-entries", valueKey: "id" },
      belongsTo: "programRoutineEntries",
      as: "programRoutineEntry",
      ui: { formControl: "autocomplete" },
      operations: {
        output: { required: true },
        create: { required: false },
        patch: { required: false }
      }
    },
    progressionTrackId: {
      type: "id",
      nullable: true,
      search: true,
      relation: { kind: "lookup", namespace: "progression-tracks", valueKey: "id" },
      belongsTo: "progressionTracks",
      as: "progressionTrack",
      ui: { formControl: "autocomplete" },
      operations: {
        output: { required: true },
        create: { required: false },
        patch: { required: false }
      }
    },
    progressionTrackStepId: {
      type: "id",
      nullable: true,
      search: true,
      relation: { kind: "lookup", namespace: "progression-track-steps", valueKey: "id" },
      belongsTo: "progressionTrackSteps",
      as: "progressionTrackStep",
      ui: { formControl: "autocomplete" },
      operations: {
        output: { required: true },
        create: { required: false },
        patch: { required: false }
      }
    },
    exerciseId: {
      type: "id",
      required: true,
      search: true,
      relation: { kind: "lookup", namespace: "exercises", valueKey: "id" },
      belongsTo: "exercises",
      as: "exercise",
      ui: { formControl: "autocomplete" },
      operations: {
        output: { required: true },
        create: { required: true },
        patch: { required: false }
      }
    },
    exerciseNameSnapshot: {
      type: "string",
      maxLength: 160,
      required: true,
      search: true,
      operations: {
        output: { required: true },
        create: { required: true },
        patch: { required: false }
      }
    },
    progressionTrackNameSnapshot: {
      type: "string",
      maxLength: 160,
      nullable: true,
      search: true,
      operations: {
        output: { required: true },
        create: { required: false },
        patch: { required: false }
      }
    },
    progressionStepLabelSnapshot: {
      type: "string",
      maxLength: 160,
      nullable: true,
      search: true,
      operations: {
        output: { required: true },
        create: { required: false },
        patch: { required: false }
      }
    },
    measurementUnitSnapshot: {
      type: "string",
      maxLength: 16,
      required: true,
      search: true,
      operations: {
        output: { required: true },
        create: { required: true },
        patch: { required: false }
      }
    },
    plannedSetsMin: {
      type: "integer",
      min: 0,
      required: true,
      search: true,
      operations: {
        output: { required: true },
        create: { required: false },
        patch: { required: false }
      }
    },
    plannedSetsMax: {
      type: "integer",
      min: 0,
      required: true,
      search: true,
      operations: {
        output: { required: true },
        create: { required: false },
        patch: { required: false }
      }
    },
    targetRepsMinSnapshot: {
      type: "integer",
      min: 0,
      nullable: true,
      search: true,
      operations: {
        output: { required: true },
        create: { required: false },
        patch: { required: false }
      }
    },
    targetRepsMaxSnapshot: {
      type: "integer",
      min: 0,
      nullable: true,
      search: true,
      operations: {
        output: { required: true },
        create: { required: false },
        patch: { required: false }
      }
    },
    targetSecondsSnapshot: {
      type: "integer",
      min: 0,
      nullable: true,
      search: true,
      operations: {
        output: { required: true },
        create: { required: false },
        patch: { required: false }
      }
    },
    progressionSetsSnapshot: {
      type: "integer",
      min: 0,
      nullable: true,
      search: true,
      operations: {
        output: { required: true },
        create: { required: false },
        patch: { required: false }
      }
    },
    progressionRepsMinSnapshot: {
      type: "integer",
      min: 0,
      nullable: true,
      search: true,
      operations: {
        output: { required: true },
        create: { required: false },
        patch: { required: false }
      }
    },
    progressionRepsMaxSnapshot: {
      type: "integer",
      min: 0,
      nullable: true,
      search: true,
      operations: {
        output: { required: true },
        create: { required: false },
        patch: { required: false }
      }
    },
    progressionSecondsSnapshot: {
      type: "integer",
      min: 0,
      nullable: true,
      search: true,
      operations: {
        output: { required: true },
        create: { required: false },
        patch: { required: false }
      }
    },
    restSecondsSnapshot: {
      type: "integer",
      min: 0,
      nullable: true,
      search: true,
      operations: {
        output: { required: true },
        create: { required: false },
        patch: { required: false }
      }
    },
    notesSnapshot: {
      type: "string",
      maxLength: 65535,
      nullable: true,
      search: true,
      operations: {
        output: { required: true },
        create: { required: false },
        patch: { required: false }
      }
    },
    status: {
      type: "string",
      maxLength: 32,
      search: true,
      operations: {
        output: { required: true },
        create: { required: false },
        patch: { required: false }
      }
    },
    notes: {
      type: "string",
      maxLength: 65535,
      nullable: true,
      search: true,
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
    }
  },
  searchSchema: {
    id: { type: "id", actualField: "id" },
    workoutOccurrenceIds: { type: "array", actualField: "workout_occurrence_id", filterOperator: "in" },
    programScheduleEntryIds: { type: "array", actualField: "program_schedule_entry_id", filterOperator: "in" },
    programRoutineEntryIds: { type: "array", actualField: "program_routine_entry_id", filterOperator: "in" },
    progressionTrackIds: { type: "array", actualField: "progression_track_id", filterOperator: "in" },
    progressionTrackStepIds: { type: "array", actualField: "progression_track_step_id", filterOperator: "in" },
    exerciseIds: { type: "array", actualField: "exercise_id", filterOperator: "in" },
    section: { type: "string", actualField: "section", filterOperator: "=" },
    sourceKind: { type: "string", actualField: "source_kind", filterOperator: "=" },
    q: {
      type: "string",
      oneOf: [
        "exerciseNameSnapshot",
        "progressionTrackNameSnapshot",
        "progressionStepLabelSnapshot",
        "measurementUnitSnapshot",
        "section",
        "status",
        "notes"
      ],
      filterOperator: "like",
      splitBy: " ",
      matchAll: true
    }
  },
  defaultSort: ["workoutOccurrenceId", "slotNumber"],
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
