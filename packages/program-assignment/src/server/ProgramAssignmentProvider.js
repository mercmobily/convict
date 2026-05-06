import { withActionDefaults } from "@jskit-ai/kernel/shared/actions";
import { INTERNAL_JSON_REST_API } from "@jskit-ai/json-rest-api-core/server/jsonRestApiHost";
import { createRepository } from "./repository.js";
import { createService } from "./service.js";
import { featureActions } from "./actions.js";
import { registerRoutes } from "./registerRoutes.js";

class ProgramAssignmentProvider {
  static id = "feature.program-assignment";

  static dependsOn = [
    "runtime.actions",
    "json-rest-api.core",
    "auth.policy.fastify",
    "workspaces.core",
    "local.main",
    "crud.program_templates",
    "crud.program_template_schedule_entries",
    "crud.programs",
    "crud.program_schedule_entries",
    "crud.exercises",
    "crud.user_program_assignments",
    "crud.user_program_assignment_revisions"
  ];

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
        api: scope.make(INTERNAL_JSON_REST_API),
        programsRepository: scope.make("repository.programs"),
        programScheduleEntriesRepository: scope.make("repository.program_schedule_entries"),
        userProgramAssignmentsRepository: scope.make("repository.user_program_assignments"),
        userProgramAssignmentRevisionsRepository: scope.make("repository.user_program_assignment_revisions")
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
