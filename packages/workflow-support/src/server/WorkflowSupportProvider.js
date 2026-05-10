import { INTERNAL_JSON_REST_API } from "@jskit-ai/json-rest-api-core/server/jsonRestApiHost";
import { createRepository } from "./repository.js";

class WorkflowSupportProvider {
  static id = "feature.workflow-support";

  static dependsOn = ["json-rest-api.core"];

  register(app) {
    if (
      !app ||
      typeof app.singleton !== "function"
    ) {
      throw new Error("WorkflowSupportProvider requires application singleton().");
    }

    app.singleton("feature.workflow-support.repository", (scope) => {
      return createRepository({
        api: scope.make(INTERNAL_JSON_REST_API)
      });
    });
  }
}

export { WorkflowSupportProvider };
