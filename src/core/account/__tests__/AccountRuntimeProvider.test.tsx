import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  AccountRuntimeProvider,
  useAccountRuntime,
  useAccountRuntimeState,
} from "../AccountRuntimeProvider";
import { LOCAL_ONLY_ACCOUNT_RUNTIME_STATE } from "../runtimeBoundary";

function AccountRuntimeProbe() {
  const runtime = useAccountRuntime();
  const state = useAccountRuntimeState();

  return (
    <div
      data-account-status={state.accountStatus}
      data-auth-status={state.authStatus}
      data-local-only={String(state.localOnly)}
      data-has-account={String(state.hasActiveAccount)}
      data-provider-id={state.session.providerId}
      data-boundary-type={runtime.boundary.constructor.name}
    >
      {state.detail}
    </div>
  );
}

describe("AccountRuntimeProvider", () => {
  it("exposes the local-only runtime through hooks by default", () => {
    const html = renderToStaticMarkup(
      <AccountRuntimeProvider>
        <AccountRuntimeProbe />
      </AccountRuntimeProvider>
    );

    expect(html).toContain('data-account-status="local-only"');
    expect(html).toContain('data-auth-status="unauthenticated"');
    expect(html).toContain('data-local-only="true"');
    expect(html).toContain('data-has-account="false"');
    expect(html).toContain('data-provider-id="local-only"');
    expect(html).toContain(LOCAL_ONLY_ACCOUNT_RUNTIME_STATE.detail);
  });

  it("throws a clear error when runtime hooks are used without the provider", () => {
    expect(() => renderToStaticMarkup(<AccountRuntimeProbe />)).toThrow(
      "AccountRuntimeProvider is missing from the application tree."
    );
  });
});
