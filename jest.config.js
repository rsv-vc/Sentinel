/** @type {import('jest').Config} */
module.exports = {
  projects: [
    "<rootDir>/packages/db",
    "<rootDir>/packages/connectors",
    "<rootDir>/packages/core",
    "<rootDir>/packages/api",
  ],
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/.next/"],
};
