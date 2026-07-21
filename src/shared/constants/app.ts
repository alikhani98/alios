import packageJson from "../../../package.json";

export const appConfig = {
  name: "AliOS",
  description: "Local-first personal life management system.",
  version: packageJson.version,
} as const;
