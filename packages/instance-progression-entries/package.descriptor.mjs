export default Object.freeze({
  packageVersion: 1,
  packageId: "@local/instance-progression-entries",
  version: "0.1.0",
  kind: "runtime",
  description: "App-local CRUD package (instance-progression-entries).",
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
      "crud.instance-progression-entries"
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
          entrypoint: "src/server/InstanceProgressionEntriesProvider.js",
          export: "InstanceProgressionEntriesProvider"
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
            tableName: "instance_progression_entries",
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
          "repository.instance_progression_entries",
          "crud.instance_progression_entries"
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
