/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.{ts,tsx}"],
  setupFiles: ["<rootDir>/src/utilities/test/jestEnv.cjs"],
  setupFilesAfterEnv: ["<rootDir>/src/utilities/test/setupTests.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  moduleNameMapper: {
    "^../lib/api$": "<rootDir>/src/utilities/test/testMocks/api.ts",
    "^../../lib/api$": "<rootDir>/src/utilities/test/testMocks/api.ts",
    "^./lib/api$": "<rootDir>/src/utilities/test/testMocks/api.ts",
    "^../utilities/constants$": "<rootDir>/src/utilities/test/testMocks/constants.ts",
    "^../../utilities/constants$": "<rootDir>/src/utilities/test/testMocks/constants.ts",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      { tsconfig: "<rootDir>/tsconfig.jest.json" },
    ],
  },
};
