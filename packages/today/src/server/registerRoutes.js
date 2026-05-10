import { resolveScopedApiBasePath, normalizeSurfaceId } from "@jskit-ai/kernel/shared/surface";
import { ROUTE_VISIBILITY_USER } from "@jskit-ai/kernel/shared/support/visibility";
import {
  READ_TODAY_PROJECTION,
  READ_HISTORY_PROJECTION,
  READ_WORKOUT_DETAIL,
  START_WORKOUT_OCCURRENCE,
  SUBMIT_WORKOUT_OCCURRENCE,
  APPLY_EXERCISE_ADVANCEMENT,
  MARK_WORKOUT_DEFINITELY_MISSED
} from "./actions.js";
import {
  historyProjectionQueryRouteValidator,
  workoutDetailQueryInputValidator,
  assignmentQueryRouteValidator,
  startWorkoutBodyInputValidator,
  markWorkoutDefinitelyMissedBodyInputValidator,
  applyAdvancementBodyInputValidator
} from "./inputSchemas.js";

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
        summary: "Read today and overdue workout projection for the current user."
      }
    },
    async function (request, reply) {
      const response = await request.executeAction({
        actionId: READ_TODAY_PROJECTION,
        input: {}
      });

      reply.code(200).send(response);
    }
  );

  router.register(
    "GET",
    `${routeBase}/history`,
    {
      auth: "required",
      surface: normalizedRouteSurface,
      visibility: ROUTE_VISIBILITY_USER,
      meta: {
        tags: ["feature"],
        summary: "Read a month history projection for the current user's active program assignment."
      },
      query: historyProjectionQueryRouteValidator
    },
    async function (request, reply) {
      const response = await request.executeAction({
        actionId: READ_HISTORY_PROJECTION,
        input: request.input.query || {}
      });

      reply.code(200).send(response);
    }
  );

  router.register(
    "GET",
    `${routeBase}/workouts/:scheduledForDate`,
    {
      auth: "required",
      surface: normalizedRouteSurface,
      visibility: ROUTE_VISIBILITY_USER,
      meta: {
        tags: ["feature"],
        summary: "Read the workout detail projection and saved set logs for a scheduled date."
      },
      params: workoutDetailQueryInputValidator,
      query: assignmentQueryRouteValidator
    },
    async function (request, reply) {
      const response = await request.executeAction({
        actionId: READ_WORKOUT_DETAIL,
        input: {
          ...(request.input.params || {}),
          ...(request.input.query || {})
        }
      });

      reply.code(200).send(response);
    }
  );

  router.register(
    "POST",
    `${routeBase}/start`,
    {
      auth: "required",
      surface: normalizedRouteSurface,
      visibility: ROUTE_VISIBILITY_USER,
      meta: {
        tags: ["feature"],
        summary: "Create or resume an in-progress workout occurrence for today or an overdue date."
      },
      body: startWorkoutBodyInputValidator
    },
    async function (request, reply) {
      const response = await request.executeAction({
        actionId: START_WORKOUT_OCCURRENCE,
        input: request.input.body || {}
      });

      reply.code(200).send(response);
    }
  );

  router.register(
    "POST",
    `${routeBase}/workouts/:scheduledForDate/submit`,
    {
      auth: "required",
      surface: normalizedRouteSurface,
      visibility: ROUTE_VISIBILITY_USER,
      meta: {
        tags: ["feature"],
        summary: "Finish an in-progress workout occurrence and evaluate earned advancement."
      },
      params: workoutDetailQueryInputValidator,
      query: assignmentQueryRouteValidator
    },
    async function (request, reply) {
      const response = await request.executeAction({
        actionId: SUBMIT_WORKOUT_OCCURRENCE,
        input: {
          ...(request.input.params || {}),
          ...(request.input.query || {})
        }
      });

      reply.code(200).send(response);
    }
  );

  router.register(
    "POST",
    `${routeBase}/progress/apply-advancement`,
    {
      auth: "required",
      surface: normalizedRouteSurface,
      visibility: ROUTE_VISIBILITY_USER,
      meta: {
        tags: ["feature"],
        summary: "Apply an earned exercise advancement without changing workout history."
      },
      body: applyAdvancementBodyInputValidator
    },
    async function (request, reply) {
      const response = await request.executeAction({
        actionId: APPLY_EXERCISE_ADVANCEMENT,
        input: request.input.body || {}
      });

      reply.code(200).send(response);
    }
  );

  router.register(
    "POST",
    `${routeBase}/mark-definitely-missed`,
    {
      auth: "required",
      surface: normalizedRouteSurface,
      visibility: ROUTE_VISIBILITY_USER,
      meta: {
        tags: ["feature"],
        summary: "Mark an overdue workout as definitely missed."
      },
      body: markWorkoutDefinitelyMissedBodyInputValidator
    },
    async function (request, reply) {
      const response = await request.executeAction({
        actionId: MARK_WORKOUT_DEFINITELY_MISSED,
        input: request.input.body || {}
      });

      reply.code(200).send(response);
    }
  );
}

export { registerRoutes };
