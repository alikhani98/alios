import { EMAIL_ACCOUNT_PROVIDER_ID } from "@/core/account/types";

import { emailAuthRuntime, type EmailAuthRuntime } from "./emailAuthRuntime";
import type {
  AuthLoginInput,
  AuthLoginResult,
  AuthProvider,
  AuthSession,
  AuthStateListener,
  AuthStateSubscription,
  AuthUser,
} from "./types";

export class EmailAuthProvider implements AuthProvider {
  readonly name = EMAIL_ACCOUNT_PROVIDER_ID;

  constructor(private readonly runtime: EmailAuthRuntime = emailAuthRuntime) {}

  isConfigured() {
    return this.runtime.isConfigured();
  }

  async createAccount(input: AuthLoginInput): Promise<AuthLoginResult> {
    return this.runtime.createAccount(input);
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

export const emailAuthProvider = new EmailAuthProvider();
