import { defineCrudResource } from "@jskit-ai/resource-crud-core/shared/crudResource";

const resource = defineCrudResource({
  namespace: "program_schedule_entries",
  tableName: "program_schedule_entries",
  schema: {
    userId: {
      type: "id",
      required: true,
      search: true,
      hidden: true,
      operations: {}
    },
    programId: {
      type: "id",
      required: true,
      search: true,
      relation: { kind: "lookup", namespace: "programs", valueKey: "id" },
      belongsTo: "programs",
      as: "program",
      ui: { formControl: "autocomplete" },
      operations: {
        output: { required: true },
        create: { required: true },
        patch: { required: false }
      }
    },
    dayOfWeek: {
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
    slotNumber: {
      type: "integer",
      min: 0,
      search: true,
      operations: {
        output: { required: true },
        create: { required: false },
        patch: { required: false }
      }
    },
    entryKind: {
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
    exerciseId: {
      type: "id",
      nullable: true,
      search: true,
      relation: { kind: "lookup", namespace: "exercises", valueKey: "id" },
      belongsTo: "exercises",
      as: "exercise",
      ui: { formControl: "autocomplete" },
      operations: {
        output: { required: true },
        create: { required: false },
        patch: { required: false }
      }
    },
    workSetsMin: {
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
    workSetsMax: {
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
    measurementUnit: {
      type: "string",
      maxLength: 16,
      nullable: true,
      search: true,
      operations: {
        output: { required: true },
        create: { required: false },
        patch: { required: false }
      }
    },
    targetRepsMin: {
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
    targetRepsMax: {
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
    targetSeconds: {
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
    restSeconds: {
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
    programId: { type: "id", actualField: "program_id", filterOperator: "=" },
    programIds: { type: "array", actualField: "program_id", filterOperator: "in" },
    progressionTrackId: { type: "id", actualField: "progression_track_id", filterOperator: "=" },
    progressionTrackIds: { type: "array", actualField: "progression_track_id", filterOperator: "in" },
    exerciseId: { type: "id", actualField: "exercise_id", filterOperator: "=" },
    exerciseIds: { type: "array", actualField: "exercise_id", filterOperator: "in" },
    entryKind: { type: "string", actualField: "entry_kind", filterOperator: "=" },
    dayOfWeek: { type: "integer", actualField: "day_of_week", filterOperator: "=" }
  },
  defaultSort: ["programId", "dayOfWeek", "slotNumber"],
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
