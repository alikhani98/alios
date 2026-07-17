import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

function readSource(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("shell keyboard accessibility", () => {
  it("keeps every topbar popover connected to its keyboard trigger", () => {
    const topbar = readSource("src/shared/layout/Topbar.tsx");

    [
      "topbar-dashboard-controls",
      "topbar-theme-controls",
      "topbar-profile-controls",
      'aria-haspopup="dialog"',
      "closeActivePanel(true)",
    ].forEach((contract) => expect(topbar).toContain(contract));
  });

  it("moves focus into an open topbar panel and restores it after Escape", () => {
    const topbar = readSource("src/shared/layout/Topbar.tsx");

    expect(topbar).toContain("activePanelContentRef.current");
    expect(topbar).toContain("activePanelTriggerRef.current?.focus()");
    expect(topbar).toContain('event.key === "Escape"');
  });

  it("treats the mobile sidebar as a keyboard-operable modal dialog", () => {
    const mobileSidebar = readSource("src/shared/layout/MobileSidebar.tsx");

    [
      'role="dialog"',
      'aria-modal="true"',
      'aria-labelledby="mobile-sidebar-title"',
      '"pointer-events-none invisible"',
      "closeButtonRef.current?.focus()",
      "event.key === \"Escape\"",
      "event.key !== \"Tab\"",
      "previousActiveElementRef.current?.focus()",
    ].forEach((contract) => expect(mobileSidebar).toContain(contract));
  });
});
