/** @type {import('jest').Config} */
module.exports = {
  displayName: "connectors",
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: "src",
  testMatch: ["**/__tests__/**/*.test.ts"],
};
