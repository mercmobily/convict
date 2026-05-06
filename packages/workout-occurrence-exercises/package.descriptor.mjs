export default Object.freeze({
  packageVersion: 1,
  packageId: "@local/workout-occurrence-exercises",
  version: "0.1.0",
  kind: "runtime",
  description: "App-local CRUD package (workout-occurrence-exercises).",
  dependsOn: [
    "@jskit-ai/auth-core",
    "@jskit-ai/crud-core",
    "@jskit-ai/database-runtime",
    "@jskit-ai/http-runtime",
    "@jskit-ai/json-rest-api-core",
    "@jskit-ai/realtime",
    "@jskit-ai/resource-crud-core",
  ],
  capabilities: {
    provides: [
      "crud.workout-occurrence-exercises"
    ],
    requires: [
      "runtime.actions",
      "runtime.database",
      "auth.policy",
      "json-rest-api.core"
    ]
  },
  runtime: {
    server: {
      providers: [
        {
          entrypoint: "src/server/WorkoutOccurrenceExercisesProvider.js",
          export: "WorkoutOccurrenceExercisesProvider"
        }
      ]
    }
  },
  metadata: {
    jskit: {
      scaffoldShape: "crud-server-v1",
      tableOwnership: {
        tables: [
          {
            tableName: "workout_occurrence_exercises",
            provenance: "crud-server-generator",
            ownerKind: "crud-package"
          }
        ]
      }
    },
    apiSummary: {
      surfaces: [
        {
          subpath: "./shared",
          summary: "App-local CRUD shared resource."
        }
      ],
      containerTokens: {
        server: [
          "repository.workout_occurrence_exercises",
          "crud.workout_occurrence_exercises"
        ]
      }
    }
  },
  mutations: {
    dependencies: {
      runtime: {},
      dev: {}
    },
    packageJson: {
      scripts: {}
    },
    procfile: {},
    files: []
  }
});
