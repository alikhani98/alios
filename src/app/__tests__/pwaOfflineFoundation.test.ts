import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

function readRepositoryFile(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("PWA offline foundation", () => {
  it("keeps the registration script wired to the static app shell", () => {
    const index = readRepositoryFile("index.html");
    const registration = readRepositoryFile("public/service-worker-registration.js");

    expect(index).toContain("service-worker-registration.js");
    expect(registration).toContain("navigator.serviceWorker.register");
    expect(registration).toContain("window.addEventListener(\"load\"");
    expect(registration).toContain("localDevelopmentHosts");
  });

  it("uses a conservative static-shell cache without forced activation", () => {
    const worker = readRepositoryFile("public/service-worker.js");

    expect(worker).toContain("alios-shell-v1");
    expect(worker).toContain("self.addEventListener(\"install\"");
    expect(worker).toContain("self.addEventListener(\"activate\"");
    expect(worker).toContain("request.mode === \"navigate\"");
    expect(worker).toContain("caches.match(indexUrl)");
    expect(worker).not.toContain("skipWaiting");
  });
});
