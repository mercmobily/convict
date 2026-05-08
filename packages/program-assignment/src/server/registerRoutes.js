import { resolveScopedApiBasePath, normalizeSurfaceId } from "@jskit-ai/kernel/shared/surface";
import { ROUTE_VISIBILITY_USER } from "@jskit-ai/kernel/shared/support/visibility";
import {
  startProgramBodyInputValidator
} from "./inputSchemas.js";

const READ_PROGRAM_SELECTION_STATE = "feature.program-assignment.selection.read";
const START_PROGRAM_ASSIGNMENT = "feature.program-assignment.assignment.start";

function registerRoutes(
  app,
  {
    routeSurface = "",
    routeRelativePath = ""
  } = {}
) {
  if (!app || typeof app.make !== "function") {
    throw new Error("registerRoutes requires application make().");
  }

  const router = app.make("jskit.http.router");
  const normalizedRouteSurface = normalizeSurfaceId(routeSurface);
  const routeBase = resolveScopedApiBasePath({
    routeBase: "/",
    relativePath: routeRelativePath,
    strictParams: false
  });

  router.register(
    "GET",
    routeBase,
    {
      auth: "required",
      surface: normalizedRouteSurface,
      visibility: ROUTE_VISIBILITY_USER,
      meta: {
        tags: ["feature"],
        summary: "Read program selection state for the current user."
      }
    },
    async function (request, reply) {
      const response = await request.executeAction({
        actionId: READ_PROGRAM_SELECTION_STATE,
        input: {}
      });

      reply.code(200).send(response);
    }
  );

  router.register(
    "POST",
    routeBase,
    {
      auth: "required",
      surface: normalizedRouteSurface,
      visibility: ROUTE_VISIBILITY_USER,
      meta: {
        tags: ["feature"],
        summary: "Start the first active program assignment for the current user."
      },
      body: startProgramBodyInputValidator
    },
    async function (request, reply) {
      const response = await request.executeAction({
        actionId: START_PROGRAM_ASSIGNMENT,
        input: request.input.body || {}
      });

      reply.code(201).send(response);
    }
  );
}

export { registerRoutes };
