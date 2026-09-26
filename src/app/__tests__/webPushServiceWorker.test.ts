import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

function readServiceWorker() {
  return readFileSync(resolve(process.cwd(), "public/service-worker.js"), "utf8");
}

describe("Web Push Service Worker foundation", () => {
  it("keeps push handling in the existing worker without changing registration", () => {
    const worker = readServiceWorker();

    expect(worker).toContain('self.addEventListener("push"');
    expect(worker).toContain('self.addEventListener("notificationclick"');
    expect(worker).toContain("showNotification");
    expect(worker).toContain("event.data.json()");
    expect(worker).toContain("payload.taskId");
    expect(worker).toContain("payload.focusId");
    expect(worker).toContain("payload.url");
    expect(worker).toContain("request.mode === \"navigate\"");
    expect(worker).not.toContain("skipWaiting");
  });
});
