import { withActionDefaults } from "@jskit-ai/kernel/shared/actions";
import { createRepository } from "./repository.js";
import { createService } from "./service.js";
import { featureActions } from "./actions.js";
import { registerRoutes } from "./registerRoutes.js";

class TodayProvider {
  static id = "feature.today";

  static dependsOn = ["runtime.actions", "runtime.database", "auth.policy.fastify", "workspaces.core", "local.main"];

  register(app) {
    if (
      !app ||
      typeof app.singleton !== "function" ||
      typeof app.service !== "function" ||
      typeof app.actions !== "function"
    ) {
      throw new Error("TodayProvider requires application singleton()/service()/actions().");
    }

    app.singleton("feature.today.repository", (scope) => {
      return createRepository({
        knex: scope.make("jskit.database.knex")
      });
    });

    app.service(
      "feature.today.service",
      (scope) => {
        return createService({ todayRepository: scope.make("feature.today.repository") });
      }
    );

    app.actions(
      withActionDefaults(featureActions, {
        domain: "feature",
        dependencies: {
          todayService: "feature.today.service"
        }
      })
    );
  }

  boot(app) {
    registerRoutes(app, {
      routeRelativePath: "today",
      routeSurface: "app",
      routeSurfaceRequiresWorkspace: true
    });
  }
}

export { TodayProvider };
