export default Object.freeze({
  packageVersion: 1,
  packageId: "@local/progress",
  version: "0.1.0",
  kind: "runtime",
  description: "App-local non-CRUD feature package (progress).",
  dependsOn: [
    "@jskit-ai/kernel",
    "@jskit-ai/json-rest-api-core",
    "@jskit-ai/workspaces-core",
    "@local/exercises",
    "@local/exercise-steps",
    "@local/personal-step-variations",
    "@local/user-exercise-progress",
    "@local/workout-occurrences"
  ],
  capabilities: {
    provides: [
      "feature.progress"
    ],
    requires: [
      "runtime.actions"
    ]
  },
  runtime: {
    server: {
      providers: [
        {
          entrypoint: "src/server/ProgressProvider.js",
          export: "ProgressProvider"
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
          summary: "Exports the cross-exercise progress projection action definitions."
        }
      ],
      containerTokens: {
        server: [
          "feature.progress.service",
          "feature.progress.repository"
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
