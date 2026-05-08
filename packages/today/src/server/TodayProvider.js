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
    "crud.programs",
    "crud.program_schedule_entries",
    "crud.exercises",
    "crud.exercise_steps",
    "crud.user_program_assignments",
    "crud.user_program_assignment_revisions",
    "crud.personal_step_variations",
    "crud.user_exercise_progress",
    "crud.workout_occurrences",
    "crud.workout_occurrence_exercises",
    "crud.workout_set_logs"
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
        userExerciseProgressRepository: scope.make("repository.user_exercise_progress"),
        workoutOccurrencesRepository: scope.make("repository.workout_occurrences"),
        workoutOccurrenceExercisesRepository: scope.make("repository.workout_occurrence_exercises")
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
