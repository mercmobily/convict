export default Object.freeze({
  packageVersion: 1,
  packageId: "@local/today",
  version: "0.1.0",
  kind: "runtime",
  description: "App-local non-CRUD feature package (today).",
  dependsOn: [
    "@jskit-ai/kernel",
    "@jskit-ai/json-rest-api-core",
    "@local/instance-programs",
    "@local/instance-program-entries",
    "@local/instance-program-routines",
    "@local/instance-routine-entries",
    "@local/exercises",
    "@local/instance-progressions",
    "@local/instance-progression-entries",
    "@local/program-assignments",
    "@local/program-assignment-revisions",
    "@local/user-progressions",
    "@local/workouts",
    "@local/workout-exercises",
    "@local/workout-sets"
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
