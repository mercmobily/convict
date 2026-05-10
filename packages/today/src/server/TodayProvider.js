import { withActionDefaults } from "@jskit-ai/kernel/shared/actions";
import { INTERNAL_JSON_REST_API } from "@jskit-ai/json-rest-api-core/server/jsonRestApiHost";
import { createRepository } from "./repository.js";
import { createService } from "./service.js";
import { featureActions } from "./actions.js";
import { registerRoutes } from "./registerRoutes.js";

class TodayProvider {
  static id = "feature.today";

  static dependsOn = [
    "runtime.actions",
    "json-rest-api.core",
    "auth.policy.fastify",
    "crud.instance_programs",
    "crud.instance_program_entries",
    "crud.instance_program_routines",
    "crud.instance_routine_entries",
    "crud.exercises",
    "crud.instance_progressions",
    "crud.instance_progression_entries",
    "crud.program_assignments",
    "crud.program_assignment_revisions",
    "crud.user_progressions",
    "crud.workouts",
    "crud.workout_exercises",
    "crud.workout_sets"
  ];

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
        api: scope.make(INTERNAL_JSON_REST_API),
        userProgressionsRepository: scope.make("repository.user_progressions"),
        workoutsRepository: scope.make("repository.workouts"),
        workoutExercisesRepository: scope.make("repository.workout_exercises")
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
      routeSurface: "app"
    });
  }
}

export { TodayProvider };
