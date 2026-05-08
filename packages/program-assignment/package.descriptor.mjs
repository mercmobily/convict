export default Object.freeze({
  packageVersion: 1,
  packageId: "@local/program-assignment",
  version: "0.1.0",
  kind: "runtime",
  description: "App-local non-CRUD feature package (program-assignment).",
  dependsOn: [
    "@jskit-ai/kernel",
    "@jskit-ai/json-rest-api-core",
    "@local/program-templates",
    "@local/program-template-schedule-entries",
    "@local/programs",
    "@local/program-schedule-entries",
    "@local/exercises",
    "@local/user-program-assignments",
    "@local/user-program-assignment-revisions"
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
      scaffoldMode: "json-rest",
      lane: "default"
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
