export default Object.freeze({
  packageVersion: 1,
  packageId: "@local/program-template-schedule-entries",
  version: "0.1.0",
  kind: "runtime",
  description: "App-local CRUD package (program-template-schedule-entries).",
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
      "crud.program-template-schedule-entries"
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
          entrypoint: "src/server/ProgramTemplateScheduleEntriesProvider.js",
          export: "ProgramTemplateScheduleEntriesProvider"
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
            tableName: "program_template_schedule_entries",
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
          "repository.program_template_schedule_entries",
          "crud.program_template_schedule_entries"
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
