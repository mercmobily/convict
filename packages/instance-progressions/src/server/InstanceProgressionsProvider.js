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
import { resource } from "../shared/instanceProgressionResource.js";
const CRUD_MODULE_CONFIG = Object.freeze({
  namespace: "instance_progressions",
  surface: "app",
  ownershipFilter: "user",
  relativePath: "/instance-progressions"
});
const baseServiceEvents = createCrudJsonApiServiceEvents(CRUD_MODULE_CONFIG.namespace);
const serviceEvents = {
  ...baseServiceEvents
};

function resolveCrudPolicyFromApp(app) {
  return resolveCrudSurfacePolicyFromAppConfig(CRUD_MODULE_CONFIG, resolveAppConfig(app), {
    context: "InstanceProgressionsProvider"
  });
}

class InstanceProgressionsProvider {
  static id = "crud.instance_progressions";

  static dependsOn = ["runtime.actions", "runtime.database", "auth.policy.fastify", "local.main", "json-rest-api.core"];

  register(app) {
    const crudPolicy = resolveCrudPolicyFromApp(app);

    app.singleton("repository.instance_progressions", (scope) => {
      const api = scope.make(INTERNAL_JSON_REST_API);
      const knex = scope.make("jskit.database.knex");
      return createRepository({
        api,
        knex
      });
    });

    app.service(
      "crud.instance_progressions",
      (scope) => {
        return createService({
          instanceProgressionsRepository: scope.make("repository.instance_progressions")
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
            instanceProgressionsService: "crud.instance_progressions"
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
      "instanceProgressions",
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

export { InstanceProgressionsProvider };
