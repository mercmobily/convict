import { withActionDefaults } from "@jskit-ai/kernel/shared/actions";
import { INTERNAL_JSON_REST_API } from "@jskit-ai/json-rest-api-core/server/jsonRestApiHost";
import { createRepository } from "./repository.js";
import { createService } from "./service.js";
import { featureActions } from "./actions.js";
import { registerRoutes } from "./registerRoutes.js";

class ProgressProvider {
  static id = "feature.progress";

  static dependsOn = [
    "runtime.actions",
    "json-rest-api.core",
    "auth.policy.fastify",
    "crud.exercises",
    "crud.progression_tracks",
    "crud.progression_track_steps",
    "crud.user_progression_track_progress",
    "crud.workout_occurrences"
  ];

  register(app) {
    if (
      !app ||
      typeof app.singleton !== "function" ||
      typeof app.service !== "function" ||
      typeof app.actions !== "function"
    ) {
      throw new Error("ProgressProvider requires application singleton()/service()/actions().");
    }

    app.singleton("feature.progress.repository", (scope) => {
      return createRepository({
        api: scope.make(INTERNAL_JSON_REST_API)
      });
    });

    app.service(
      "feature.progress.service",
      (scope) => {
        return createService({ progressRepository: scope.make("feature.progress.repository") });
      }
    );

    app.actions(
      withActionDefaults(featureActions, {
        domain: "feature",
        dependencies: {
          progressService: "feature.progress.service"
        }
      })
    );
  }

  boot(app) {
    registerRoutes(app, {
      routeRelativePath: "progress",
      routeSurface: "app"
    });
  }
}

export { ProgressProvider };
