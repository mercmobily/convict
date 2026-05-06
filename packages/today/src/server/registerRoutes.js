import { resolveScopedApiBasePath, normalizeSurfaceId } from "@jskit-ai/kernel/shared/surface";
import { ROUTE_VISIBILITY_WORKSPACE_USER } from "@jskit-ai/kernel/shared/support/visibility";
import { workspaceSlugParamsValidator } from "@jskit-ai/workspaces-core/server/validators/routeParamsValidator";
import { buildWorkspaceInputFromRouteParams } from "@jskit-ai/workspaces-core/server/support/workspaceRouteInput";
import {
  READ_TODAY_PROJECTION,
  READ_WORKOUT_DETAIL,
  START_WORKOUT_OCCURRENCE,
  SAVE_WORKOUT_SET_LOGS,
  SUBMIT_WORKOUT_OCCURRENCE,
  APPLY_EXERCISE_ADVANCEMENT,
  MARK_WORKOUT_DEFINITELY_MISSED
} from "./actions.js";
import {
  workoutDetailQueryInputValidator,
  startWorkoutBodyInputValidator,
  markWorkoutDefinitelyMissedBodyInputValidator,
  applyAdvancementBodyInputValidator,
  saveWorkoutSetLogsBodyInputValidator
} from "./inputSchemas.js";

function registerRoutes(
  app,
  {
    routeSurface = "",
    routeRelativePath = "",
    routeSurfaceRequiresWorkspace = false
  } = {}
) {
  if (!app || typeof app.make !== "function") {
    throw new Error("registerRoutes requires application make().");
  }

  const router = app.make("jskit.http.router");
  const normalizedRouteSurface = normalizeSurfaceId(routeSurface);
  const routeBase = resolveScopedApiBasePath({
    routeBase: routeSurfaceRequiresWorkspace === true ? "/w/:workspaceSlug" : "/",
    relativePath: routeRelativePath,
    strictParams: false
  });

  router.register(
    "GET",
    routeBase,
    {
      auth: "required",
      surface: normalizedRouteSurface,
      visibility: ROUTE_VISIBILITY_WORKSPACE_USER,
      meta: {
        tags: ["feature"],
        summary: "Read today and overdue workout projection for the current user."
      },
      params: workspaceSlugParamsValidator
    },
    async function (request, reply) {
      const response = await request.executeAction({
        actionId: READ_TODAY_PROJECTION,
        input: {
          ...buildWorkspaceInputFromRouteParams(request.input.params)
        }
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
      visibility: ROUTE_VISIBILITY_WORKSPACE_USER,
      meta: {
        tags: ["feature"],
        summary: "Read the workout detail projection and saved set logs for a scheduled date."
      },
      params: workoutDetailQueryInputValidator
    },
    async function (request, reply) {
      const response = await request.executeAction({
        actionId: READ_WORKOUT_DETAIL,
        input: {
          ...buildWorkspaceInputFromRouteParams(request.input.params),
          ...(request.input.params || {})
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
      visibility: ROUTE_VISIBILITY_WORKSPACE_USER,
      meta: {
        tags: ["feature"],
        summary: "Create or resume an in-progress workout occurrence for today or an overdue date."
      },
      params: workspaceSlugParamsValidator,
      body: startWorkoutBodyInputValidator
    },
    async function (request, reply) {
      const response = await request.executeAction({
        actionId: START_WORKOUT_OCCURRENCE,
        input: {
          ...buildWorkspaceInputFromRouteParams(request.input.params),
          ...(request.input.body || {})
        }
      });

      reply.code(200).send(response);
    }
  );

  router.register(
    "POST",
    `${routeBase}/workouts/:scheduledForDate/log-sets`,
    {
      auth: "required",
      surface: normalizedRouteSurface,
      visibility: ROUTE_VISIBILITY_WORKSPACE_USER,
      meta: {
        tags: ["feature"],
        summary: "Replace the saved set logs for a workout exercise inside an open occurrence."
      },
      params: workoutDetailQueryInputValidator,
      body: saveWorkoutSetLogsBodyInputValidator
    },
    async function (request, reply) {
      const response = await request.executeAction({
        actionId: SAVE_WORKOUT_SET_LOGS,
        input: {
          ...buildWorkspaceInputFromRouteParams(request.input.params),
          ...(request.input.params || {}),
          ...(request.input.body || {})
        }
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
      visibility: ROUTE_VISIBILITY_WORKSPACE_USER,
      meta: {
        tags: ["feature"],
        summary: "Finish an in-progress workout occurrence and evaluate earned advancement."
      },
      params: workoutDetailQueryInputValidator
    },
    async function (request, reply) {
      const response = await request.executeAction({
        actionId: SUBMIT_WORKOUT_OCCURRENCE,
        input: {
          ...buildWorkspaceInputFromRouteParams(request.input.params),
          ...(request.input.params || {})
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
      visibility: ROUTE_VISIBILITY_WORKSPACE_USER,
      meta: {
        tags: ["feature"],
        summary: "Apply an earned exercise advancement without changing workout history."
      },
      params: workspaceSlugParamsValidator,
      body: applyAdvancementBodyInputValidator
    },
    async function (request, reply) {
      const response = await request.executeAction({
        actionId: APPLY_EXERCISE_ADVANCEMENT,
        input: {
          ...buildWorkspaceInputFromRouteParams(request.input.params),
          ...(request.input.body || {})
        }
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
      visibility: ROUTE_VISIBILITY_WORKSPACE_USER,
      meta: {
        tags: ["feature"],
        summary: "Mark an overdue workout as definitely missed."
      },
      params: workspaceSlugParamsValidator,
      body: markWorkoutDefinitelyMissedBodyInputValidator
    },
    async function (request, reply) {
      const response = await request.executeAction({
        actionId: MARK_WORKOUT_DEFINITELY_MISSED,
        input: {
          ...buildWorkspaceInputFromRouteParams(request.input.params),
          ...(request.input.body || {})
        }
      });

      reply.code(200).send(response);
    }
  );
}

export { registerRoutes };
