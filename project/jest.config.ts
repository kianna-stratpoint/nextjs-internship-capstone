import type { Config } from "jest"
import nextJest from "next/jest"

const createJestConfig = nextJest({
  dir: "./",
})

const config: Config = {
  displayName: "floe",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
  transformIgnorePatterns: ["/node_modules/(?!(pusher-js|@dnd-kit)/)"],

  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
}

export default createJestConfig(config)
