export default {
  moduleFileExtensions: ["js", "ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  preset: "ts-jest",
  moduleNameMapper: {
    "^@test/(.*)$": ["<rootDir>/test-bench/$1"],
    "^@lib/(.*)$": ["<rootDir>/tslox/$1"],
  },
};
