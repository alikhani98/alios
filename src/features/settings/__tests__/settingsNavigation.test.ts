import { describe, expect, it } from "vitest";

import { resolveSettingsTab, settingsHashDestinations, settingsTabs } from "../settingsNavigation";

describe("Settings information architecture compatibility", () => {
  it("keeps the six approved categories in reading order", () => {
    expect(settingsTabs).toEqual(["general", "appearance", "workspace", "notifications", "account", "data"]);
  });

  it.each(Object.entries(settingsHashDestinations))("resolves #%s before a stale tab parameter", (hash, destination) => {
    expect(resolveSettingsTab("?tab=profile&safe=1", `#${hash}`)).toBe(destination);
  });

  it.each([
    ["profile", "general"], ["general", "general"], ["appearance", "appearance"],
    ["workspace", "workspace"], ["notifications", "notifications"], ["account", "account"],
    ["data", "data"], ["help", "help"], ["diagnostics", "diagnostics"], ["about", "about"],
    ["invalid", "general"], ["toString", "general"], ["__proto__", "general"],
  ])("resolves tab=%s without changing unrelated parameters", (tab, destination) => {
    expect(resolveSettingsTab(`?tab=${tab}&safe=1`, "")).toBe(destination);
  });

  it("ignores unknown hashes and retains a valid explicit category", () => {
    expect(resolveSettingsTab("?tab=workspace", "#settings-unknown")).toBe("workspace");
    expect(resolveSettingsTab("?tab=appearance", "#toString")).toBe("appearance");
    expect(resolveSettingsTab("", "")).toBe("general");
    expect(resolveSettingsTab("?tab=data", "#settings-help-planning-loop-guide")).toBe("help");
  });
});
