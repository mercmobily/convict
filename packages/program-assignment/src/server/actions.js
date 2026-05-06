import {
  selectionStateQueryInputValidator,
  startProgramCommandInputValidator
} from "./inputSchemas.js";

const READ_PROGRAM_SELECTION_STATE = "feature.program-assignment.selection.read";
const START_PROGRAM_ASSIGNMENT = "feature.program-assignment.assignment.start";
const authenticatedPermission = Object.freeze({
  require: "authenticated"
});

const featureActions = Object.freeze([
  {
    id: READ_PROGRAM_SELECTION_STATE,
    version: 1,
    kind: "query",
    channels: ["api", "automation", "internal"],
    surfaces: ["app"],
    permission: authenticatedPermission,
    input: selectionStateQueryInputValidator,
    output: null,
    idempotency: "none",
    audit: {
      actionName: READ_PROGRAM_SELECTION_STATE
    },
    observability: {},
    async execute(input, context, deps) {
      return deps.programAssignmentService.readSelectionState(input, {
        context
      });
    }
  },
  {
    id: START_PROGRAM_ASSIGNMENT,
    version: 1,
    kind: "command",
    channels: ["api", "automation", "internal"],
    surfaces: ["app"],
    permission: authenticatedPermission,
    input: startProgramCommandInputValidator,
    output: null,
    idempotency: "optional",
    audit: {
      actionName: START_PROGRAM_ASSIGNMENT
    },
    observability: {},
    async execute(input, context, deps) {
      return deps.programAssignmentService.startProgram(input, {
        context
      });
    }
  }
]);

export { featureActions };
