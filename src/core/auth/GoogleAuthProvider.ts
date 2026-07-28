import { GOOGLE_ACCOUNT_PROVIDER_ID } from "@/core/account/types";

import { googleAuthRuntime, type GoogleAuthRuntime } from "./googleAuthRuntime";
import type {
  AuthLoginInput,
  AuthLoginResult,
  AuthProvider,
  AuthSession,
  AuthStateListener,
  AuthStateSubscription,
  AuthUser,
} from "./types";

export class GoogleAuthProvider implements AuthProvider {
  readonly name = GOOGLE_ACCOUNT_PROVIDER_ID;

  constructor(private readonly runtime: GoogleAuthRuntime = googleAuthRuntime) {}

  isConfigured() {
    return this.runtime.isConfigured();
  }

  async renderButton(parent: HTMLElement) {
    return this.runtime.renderButton(parent);
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return this.runtime.getUser();
  }

  async getCurrentSession(): Promise<AuthSession> {
    return this.runtime.getSession();
  }

  async login(input: AuthLoginInput): Promise<AuthLoginResult> {
    return this.runtime.login(input);
  }

  async logout(): Promise<void> {
    return this.runtime.logout();
  }

  async refreshSession(): Promise<AuthSession> {
    return this.runtime.refreshSession();
  }

  subscribe(listener: AuthStateListener): AuthStateSubscription {
    return this.runtime.subscribe(listener);
  }
}

export const googleAuthProvider = new GoogleAuthProvider();
