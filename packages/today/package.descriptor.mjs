export default Object.freeze({
  packageVersion: 1,
  packageId: "@local/today",
  version: "0.1.0",
  kind: "runtime",
  description: "App-local non-CRUD feature package (today).",
  dependsOn: [
    "@jskit-ai/kernel",
    "@jskit-ai/json-rest-api-core",
    "@local/programs",
    "@local/program-schedule-entries",
    "@local/program-routines",
    "@local/program-routine-entries",
    "@local/exercises",
    "@local/progression-tracks",
    "@local/progression-track-steps",
    "@local/user-program-assignments",
    "@local/user-program-assignment-revisions",
    "@local/user-progression-track-progress",
    "@local/workout-occurrences",
    "@local/workout-occurrence-exercises",
    "@local/workout-set-logs"
  ],
  capabilities: {
    provides: [
      "feature.today"
    ],
    requires: [
      "runtime.actions"
    ]
  },
  runtime: {
    server: {
      providers: [
        {
          entrypoint: "src/server/TodayProvider.js",
          export: "TodayProvider"
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
          summary: "Exports today projection and workout-occurrence action definitions."
        }
      ],
      containerTokens: {
        server: [
          "feature.today.service",
          "feature.today.repository"
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
