import { withActionDefaults } from "@jskit-ai/kernel/shared/actions";
import { createRepository } from "./repository.js";
import { createService } from "./service.js";
import { featureActions } from "./actions.js";
import { registerRoutes } from "./registerRoutes.js";

class ProgramAssignmentProvider {
  static id = "feature.program-assignment";

  static dependsOn = ["runtime.actions", "runtime.database", "auth.policy.fastify", "workspaces.core", "local.main"];

  register(app) {
    if (
      !app ||
      typeof app.singleton !== "function" ||
      typeof app.service !== "function" ||
      typeof app.actions !== "function"
    ) {
      throw new Error("ProgramAssignmentProvider requires application singleton()/service()/actions().");
    }

    app.singleton("feature.program-assignment.repository", (scope) => {
      return createRepository({
        knex: scope.make("jskit.database.knex")
      });
    });

    app.service(
      "feature.program-assignment.service",
      (scope) => {
        return createService({ programAssignmentRepository: scope.make("feature.program-assignment.repository") });
      }
    );

    app.actions(
      withActionDefaults(featureActions, {
        domain: "feature",
        dependencies: {
          programAssignmentService: "feature.program-assignment.service"
        }
      })
    );
  }

  boot(app) {
    registerRoutes(app, {
      routeRelativePath: "program-assignment",
      routeSurface: "app",
      routeSurfaceRequiresWorkspace: true
    });
  }
}

export { ProgramAssignmentProvider };
