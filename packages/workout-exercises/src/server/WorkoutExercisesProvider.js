import { resolveAppConfig } from "@jskit-ai/kernel/server/support";
import { resolveCrudSurfacePolicyFromAppConfig } from "@jskit-ai/crud-core/server/crudModuleConfig";
import { createCrudJsonApiServiceEvents } from "@jskit-ai/crud-core/server/serviceEvents";
import {
  INTERNAL_JSON_REST_API,
  addResourceIfMissing,
  createJsonRestResourceScopeOptions
} from "@jskit-ai/json-rest-api-core/server/jsonRestApiHost";
import { withActionDefaults } from "@jskit-ai/kernel/shared/actions";
import { toDatabaseDateTimeUtc } from "@jskit-ai/database-runtime/shared";
import { createRepository } from "./repository.js";
import { createService } from "./service.js";
import { createActions } from "./actions.js";
import { registerRoutes } from "./registerRoutes.js";
import { resource } from "../shared/workoutExerciseResource.js";
const CRUD_MODULE_CONFIG = Object.freeze({
  namespace: "workout_exercises",
  surface: "app",
  ownershipFilter: "user",
  relativePath: "/workout-exercises"
});
const baseServiceEvents = createCrudJsonApiServiceEvents(CRUD_MODULE_CONFIG.namespace);
const serviceEvents = {
  ...baseServiceEvents
};

function resolveCrudPolicyFromApp(app) {
  return resolveCrudSurfacePolicyFromAppConfig(CRUD_MODULE_CONFIG, resolveAppConfig(app), {
    context: "WorkoutExercisesProvider"
  });
}

class WorkoutExercisesProvider {
  static id = "crud.workout_exercises";

  static dependsOn = ["runtime.actions", "runtime.database", "auth.policy.fastify", "local.main", "json-rest-api.core"];

  register(app) {
    const crudPolicy = resolveCrudPolicyFromApp(app);

    app.singleton("repository.workout_exercises", (scope) => {
      const api = scope.make(INTERNAL_JSON_REST_API);
      const knex = scope.make("jskit.database.knex");
      return createRepository({
        api,
        knex
      });
    });

    app.service(
      "crud.workout_exercises",
      (scope) => {
        return createService({
          workoutExercisesRepository: scope.make("repository.workout_exercises")
        });
      },
      {
        events: serviceEvents
      }
    );

    app.actions(
      withActionDefaults(
        createActions({
          surface: crudPolicy.surfaceId
        }),
        {
          domain: "crud",
          dependencies: {
            workoutExercisesService: "crud.workout_exercises"
          }
        }
      )
    );
  }

  async boot(app) {
    const crudPolicy = resolveCrudPolicyFromApp(app);
    const api = app.make(INTERNAL_JSON_REST_API);
    await addResourceIfMissing(
      api,
      "workoutExercises",
      createJsonRestResourceScopeOptions(resource, {
        writeSerializers: {
          "datetime-utc": toDatabaseDateTimeUtc
        }
      })
    );
    registerRoutes(app, {
      routeOwnershipFilter: crudPolicy.ownershipFilter,
      routeSurface: crudPolicy.surfaceId,
      routeSurfaceRequiresWorkspace: crudPolicy.surfaceDefinition.requiresWorkspace === true,
      routeRelativePath: crudPolicy.relativePath
    });
  }
}

export { WorkoutExercisesProvider };
