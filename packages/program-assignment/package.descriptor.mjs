export default Object.freeze({
  packageVersion: 1,
  packageId: "@local/program-assignment",
  version: "0.1.0",
  kind: "runtime",
  description: "App-local non-CRUD feature package (program-assignment).",
  dependsOn: [
    "@jskit-ai/kernel",
    "@jskit-ai/database-runtime",
    "@jskit-ai/workspaces-core"
  ],
  capabilities: {
    provides: [
      "feature.program-assignment"
    ],
    requires: [
      "runtime.actions"
    ]
  },
  runtime: {
    server: {
      providers: [
        {
          entrypoint: "src/server/ProgramAssignmentProvider.js",
          export: "ProgramAssignmentProvider"
        }
      ]
    },
    client: {
      providers: []
    }
  },
  metadata: {
    apiSummary: {
      surfaces: [
        {
          subpath: "./server/actions",
          summary: "Exports program assignment action definitions for choosing and reading the active training program."
        }
      ],
      containerTokens: {
        server: [
          "feature.program-assignment.service",
          "feature.program-assignment.repository"
        ],
        client: []
      }
    },
    jskit: {
      scaffoldShape: "feature-server-v1",
      scaffoldMode: "custom-knex",
      lane: "weird-custom"
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
    files: [],
    text: []
  }
});
