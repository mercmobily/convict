import { progressStateQueryInputValidator } from "./inputSchemas.js";

const READ_PROGRESS_STATE = "feature.progress.state.read";

const featureActions = Object.freeze([
  {
    id: READ_PROGRESS_STATE,
    version: 1,
    kind: "query",
    channels: ["api", "automation", "internal"],
    surfaces: ["app"],
    input: progressStateQueryInputValidator,
    output: null,
    idempotency: "none",
    audit: {
      actionName: READ_PROGRESS_STATE
    },
    observability: {},
    async execute(input, context, deps) {
      return deps.progressService.getProgressState(input, {
        context
      });
    }
  }
]);

export {
  READ_PROGRESS_STATE,
  featureActions
};
