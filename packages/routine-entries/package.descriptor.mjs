export default Object.freeze({
  packageVersion: 1,
  packageId: "@local/routine-entries",
  version: "0.1.0",
  kind: "runtime",
  description: "App-local CRUD package (routine-entries).",
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
      "crud.routine-entries"
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
          entrypoint: "src/server/RoutineEntriesProvider.js",
          export: "RoutineEntriesProvider"
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
            tableName: "routine_entries",
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
          "repository.routine_entries",
          "crud.routine_entries"
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
