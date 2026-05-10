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
    "crud.program_collections",
    "crud.programs",
    "crud.program_versions",
    "crud.program_entries",
    "crud.program_routines",
    "crud.exercises",
    "crud.routine_entries",
    "crud.progressions",
    "crud.progression_entries",
    "crud.instance_programs",
    "crud.instance_program_entries",
    "crud.instance_program_routines",
    "crud.instance_routine_entries",
    "crud.instance_progressions",
    "crud.instance_progression_entries",
    "crud.program_assignments",
    "crud.program_assignment_revisions",
    "crud.user_progressions"
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
        instanceProgramsRepository: scope.make("repository.instance_programs"),
        instanceProgramEntriesRepository: scope.make("repository.instance_program_entries"),
        instanceProgramRoutinesRepository: scope.make("repository.instance_program_routines"),
        instanceRoutineEntriesRepository: scope.make("repository.instance_routine_entries"),
        instanceProgressionsRepository: scope.make("repository.instance_progressions"),
        instanceProgressionEntriesRepository: scope.make("repository.instance_progression_entries"),
        programAssignmentsRepository: scope.make("repository.program_assignments"),
        programAssignmentRevisionsRepository: scope.make("repository.program_assignment_revisions"),
        userProgressionsRepository: scope.make("repository.user_progressions")
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
      routeSurface: "app"
    });
  }
}

export { ProgramAssignmentProvider };
