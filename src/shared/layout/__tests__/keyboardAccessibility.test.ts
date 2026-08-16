import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

function readSource(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("shell keyboard accessibility", () => {
  it("provides a keyboard skip link to the main route content", () => {
    const appShell = readSource("src/shared/layout/AppShell.tsx");

    expect(appShell).toContain('href="#main-content"');
    expect(appShell).toContain('id="main-content"');
    expect(appShell).toContain("tabIndex={-1}");
    expect(appShell).toContain('t("shell.skipToMain")');
  });

  it("keeps audited icon-only controls named with aria-labels", () => {
    const sources = [
      readSource("src/shared/layout/Topbar.tsx"),
      readSource("src/shared/layout/Sidebar.tsx"),
      readSource("src/shared/layout/MobileSidebar.tsx"),
      readSource("src/shared/layout/BottomNav.tsx"),
      readSource("src/features/onboarding/components/OnboardingWizard.tsx"),
    ].join("\n");

    [
      'aria-label={t("shell.openMenu")}',
      'aria-label={collapsed ? t("shell.openSidebar") : t("shell.closeSidebar")}',
      'aria-label={t("shell.closeMenu")}',
      'aria-label={t("command.open")}',
      'aria-label={t("settings.appearance")}',
      'aria-label={t("settings.localProfile")}',
      'aria-label={t("onboarding.close")}',
    ].forEach((contract) => expect(sources).toContain(contract));
  });

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

  it("keeps grouped navigation keyboard-operable and announced", () => {
    const navigationGroupList = readSource("src/shared/layout/NavigationGroupList.tsx");

    [
      "aria-expanded={isOpen}",
      "aria-controls={panelId}",
      "onClick={() => setGroupOpen(group.id, !isOpen)}",
      'aria-label={title}',
    ].forEach((contract) => expect(navigationGroupList).toContain(contract));
  });
});
