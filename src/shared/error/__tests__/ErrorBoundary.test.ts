import React from "react";
import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { ErrorBoundary, ErrorFallback } from "../ErrorBoundary";
import { LOCAL_ERROR_LOG_STORAGE_KEY } from "../localErrorLog";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, String(value));
  }
}

const previousWindow = globalThis.window;

function installWindow(storage: Storage) {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: storage,
      location: {
        hash: "#/finance",
        pathname: "/finance",
        reload: () => undefined,
      },
    },
  });
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    installWindow(new MemoryStorage());
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: previousWindow,
    });
  });

  it("renders children normally when no error has occurred", () => {
    const child = React.createElement("div", { id: "child" }, "child");
    const boundary = new ErrorBoundary({ children: child });

    expect(boundary.render()).toBe(child);
  });

  it("records a local error summary and exposes a calm fallback", () => {
    const boundary = new ErrorBoundary({
      children: React.createElement("div", null, "child"),
      resetKey: "/finance",
    });
    const error = new Error("Boom");

    boundary.componentDidCatch(error, {
      componentStack: "\n    at BuggyChild",
    } as React.ErrorInfo);

    const stored = JSON.parse(
      globalThis.window.localStorage.getItem(LOCAL_ERROR_LOG_STORAGE_KEY) ?? "[]"
    ) as Array<Record<string, unknown>>;

    expect(stored).toHaveLength(1);
    expect(stored[0]?.message).toBe("Boom");
    expect(stored[0]?.route).toBe("/finance");
    expect(stored[0]?.hash).toBe("#/finance");
    expect(stored[0]?.source).toBe("at BuggyChild");

    boundary.state = { error };
    boundary.setState = ((updater: unknown) => {
      if (updater && typeof updater === "object") {
        boundary.state = {
          ...boundary.state,
          ...(updater as Partial<{ error: Error | null }>),
        };
      }
    }) as typeof boundary.setState;

    const fallback = boundary.render() as React.ReactElement<{
      onReset: () => void;
      onReload: () => void;
    }>;

    expect(fallback.type).toBe(ErrorFallback);
    fallback.props.onReset();
    expect(boundary.state.error).toBeNull();
  });
});
