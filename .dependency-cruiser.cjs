/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-react-in-core",
      severity: "error",
      from: {
        path: "^packages/di-core/src",
        pathNot: ["tests", "spec\\.ts$"],
      },
      to: { path: "react" },
    },
    {
      name: "no-react-native-in-core",
      severity: "error",
      from: {
        path: "^packages/di-core/src",
        pathNot: ["tests", "spec\\.ts$"],
      },
      to: { path: "react-native" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
  },
};
