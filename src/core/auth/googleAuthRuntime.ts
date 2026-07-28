import {
  GOOGLE_ACCOUNT_PROVIDER_ID,
  type GoogleAccountIdentityMetadata,
} from "@/core/account/types";

import type {
  AuthLoginInput,
  AuthLoginResult,
  AuthSession,
  AuthStateListener,
  AuthStateSubscription,
  AuthUser,
} from "./types";

export const GOOGLE_AUTH_STORAGE_KEY = "alios.auth.google.session";

type GoogleAuthRuntimeConfiguration = Readonly<{
  clientId?: string;
  locale?: string;
}>;

type GoogleCredentialPayload = Readonly<{
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  iat?: number;
  exp?: number;
}>;

type StoredGoogleSession = Readonly<{
  provider: typeof GOOGLE_ACCOUNT_PROVIDER_ID;
  userId: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  issuedAt?: string;
  expiresAt?: string;
  lastAuthenticatedAt: string;
}>;

type GoogleCredentialResponse = Readonly<{
  credential?: string;
}>;

type GooglePromptMomentNotification = Readonly<{
  isNotDisplayed?: () => boolean;
  getNotDisplayedReason?: () => string;
  isSkippedMoment?: () => boolean;
  getSkippedReason?: () => string;
  isDismissedMoment?: () => boolean;
  getDismissedReason?: () => string;
}>;

type GoogleButtonOptions = Readonly<{
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?:
    | "signin_with"
    | "signup_with"
    | "continue_with"
    | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: string | number;
  locale?: string;
}>;

type GoogleIdentitySdk = Readonly<{
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    context?: "signin" | "signup" | "use";
    ux_mode?: "popup" | "redirect";
    locale?: string;
  }) => void;
  prompt: (listener?: (notification: GooglePromptMomentNotification) => void) => void;
  renderButton: (
    parent: HTMLElement,
    options: GoogleButtonOptions
  ) => void;
  disableAutoSelect: () => void;
  revoke: (hint: string, callback?: () => void) => void;
}>;

type RuntimeDependencies = Readonly<{
  loadSdk?: () => Promise<GoogleIdentitySdk>;
  now?: () => Date;
  getStorage?: () => Storage | null;
}>;

function toIsoString(date: Date) {
  return date.toISOString();
}

function parseStoredGoogleSession(
  value: string | null,
  now: Date
): StoredGoogleSession | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<StoredGoogleSession>;

    if (
      parsed.provider !== GOOGLE_ACCOUNT_PROVIDER_ID ||
      typeof parsed.userId !== "string" ||
      typeof parsed.lastAuthenticatedAt !== "string"
    ) {
      return null;
    }

    if (
      parsed.expiresAt &&
      Number.isNaN(Date.parse(parsed.expiresAt))
    ) {
      return null;
    }

    if (
      parsed.expiresAt &&
      Date.parse(parsed.expiresAt) <= now.getTime()
    ) {
      return null;
    }

    return {
      provider: GOOGLE_ACCOUNT_PROVIDER_ID,
      userId: parsed.userId,
      email: parsed.email,
      displayName: parsed.displayName,
      avatarUrl: parsed.avatarUrl,
      issuedAt: parsed.issuedAt,
      expiresAt: parsed.expiresAt,
      lastAuthenticatedAt: parsed.lastAuthenticatedAt,
    };
  } catch {
    return null;
  }
}

function decodeBase64UrlSegment(segment: string): string {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const encoded = `${normalized}${padding}`;

  if (typeof atob === "function") {
    return atob(encoded);
  }

  return Buffer.from(encoded, "base64").toString("binary");
}

export function decodeGoogleIdToken(credential: string): GoogleCredentialPayload {
  const segments = credential.split(".");

  if (segments.length < 2) {
    throw new Error("Google credential response was malformed.");
  }

  try {
    const payload = JSON.parse(
      decodeBase64UrlSegment(segments[1])
    ) as GoogleCredentialPayload;

    if (typeof payload.sub !== "string" || payload.sub.trim().length === 0) {
      throw new Error("Google credential payload did not include a subject.");
    }

    return payload;
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Google credential payload could not be decoded."
    );
  }
}

function createSignedOutSession(detail: string): AuthSession {
  return {
    status: "unauthenticated",
    user: null,
    provider: GOOGLE_ACCOUNT_PROVIDER_ID,
    detail,
  };
}

function createAuthenticatedSession(
  storedSession: StoredGoogleSession
): AuthSession {
  return {
    status: "authenticated",
    provider: GOOGLE_ACCOUNT_PROVIDER_ID,
    expiresAt: storedSession.expiresAt,
    detail: "Google account connected on this device.",
      user: {
        userId: storedSession.userId,
        email: storedSession.email ?? "",
        displayName:
          storedSession.displayName ??
        storedSession.email ??
        storedSession.userId,
        avatarUrl: storedSession.avatarUrl,
        createdAt: storedSession.issuedAt ?? storedSession.lastAuthenticatedAt,
        updatedAt: storedSession.lastAuthenticatedAt,
        metadata: {
          googleSubject: storedSession.userId,
          avatarUrl: storedSession.avatarUrl,
        } satisfies GoogleAccountIdentityMetadata,
      },
    };
}

async function loadGoogleIdentitySdkFromWindow(): Promise<GoogleIdentitySdk> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Google sign-in is available only in a browser runtime.");
  }

  const globalWindow = window as Window & {
    google?: {
      accounts?: {
        id?: GoogleIdentitySdk;
      };
    };
    __aliosGoogleSdkPromise__?: Promise<GoogleIdentitySdk>;
  };

  const sdk = globalWindow.google?.accounts?.id;
  if (sdk) {
    return sdk;
  }

  if (globalWindow.__aliosGoogleSdkPromise__) {
    return globalWindow.__aliosGoogleSdkPromise__;
  }

  globalWindow.__aliosGoogleSdkPromise__ = new Promise<GoogleIdentitySdk>(
    (resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[data-alios-google-auth="true"]'
      );

      const handleReady = () => {
        const readySdk = globalWindow.google?.accounts?.id;
        if (readySdk) {
          resolve(readySdk);
          return;
        }

        reject(new Error("Google Identity Services loaded without an ID SDK."));
      };

      if (existingScript) {
        existingScript.addEventListener("load", handleReady, { once: true });
        existingScript.addEventListener(
          "error",
          () => {
            reject(new Error("Google Identity Services could not be loaded."));
          },
          { once: true }
        );
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.dataset.aliosGoogleAuth = "true";
      script.addEventListener("load", handleReady, { once: true });
      script.addEventListener(
        "error",
        () => {
          reject(new Error("Google Identity Services could not be loaded."));
        },
        { once: true }
      );
      document.head.appendChild(script);
    }
  );

  return globalWindow.__aliosGoogleSdkPromise__;
}

type PendingLogin = {
  resolve: (result: AuthLoginResult) => void;
  reject: (error: Error) => void;
};

export class GoogleAuthRuntime {
  private readonly listeners = new Set<AuthStateListener>();
  private readonly now: () => Date;
  private readonly getStorage: () => Storage | null;
  private readonly loadSdk: () => Promise<GoogleIdentitySdk>;
  private sdkPromise: Promise<GoogleIdentitySdk> | null = null;
  private initialized = false;
  private pendingLogin: PendingLogin | null = null;
  private currentSession: AuthSession;
  private currentStoredSession: StoredGoogleSession | null;
  private currentCredentialToken: string | null = null;

  constructor(
    private readonly configuration: GoogleAuthRuntimeConfiguration,
    dependencies: RuntimeDependencies = {}
  ) {
    this.now = dependencies.now ?? (() => new Date());
    this.getStorage =
      dependencies.getStorage ??
      (() => {
        if (typeof window === "undefined") {
          return null;
        }

        return window.localStorage;
      });
    this.loadSdk = dependencies.loadSdk ?? loadGoogleIdentitySdkFromWindow;

    this.currentStoredSession = this.readStoredSession();
    this.currentSession = this.currentStoredSession
      ? createAuthenticatedSession(this.currentStoredSession)
      : this.isConfigured()
        ? createSignedOutSession("No Google account is signed in on this device.")
        : createSignedOutSession(
            "Google sign-in is unavailable until a Google client ID is configured."
          );
  }

  isConfigured() {
    return Boolean(this.configuration.clientId?.trim());
  }

  getSession(): AuthSession {
    this.reconcileExpiredSession();
    return this.currentSession;
  }

  getUser(): AuthUser | null {
    return this.getSession().user;
  }

  getIdToken(): string | null {
    return this.currentCredentialToken;
  }

  async login(_input: AuthLoginInput = {}): Promise<AuthLoginResult> {
    if (!this.isConfigured()) {
      throw new Error(
        "Google sign-in is unavailable until VITE_GOOGLE_CLIENT_ID is configured."
      );
    }

    this.setSession({
      status: "authenticating",
      provider: GOOGLE_ACCOUNT_PROVIDER_ID,
      user: this.currentSession.user,
      detail: "AliOS is opening Google sign-in.",
    });

    const sdk = await this.ensureSdk();

    return new Promise<AuthLoginResult>((resolve, reject) => {
      this.pendingLogin?.reject(
        new Error("A new Google sign-in replaced the previous request.")
      );
      this.pendingLogin = { resolve, reject };

      sdk.prompt((notification) => {
        if (notification.isNotDisplayed?.()) {
          this.failPendingLogin(
            new Error(
              notification.getNotDisplayedReason?.() ??
                "Google sign-in could not be displayed."
            )
          );
          return;
        }

        if (notification.isSkippedMoment?.()) {
          this.failPendingLogin(
            new Error(
              notification.getSkippedReason?.() ??
                "Google sign-in was skipped."
            )
          );
          return;
        }

        if (notification.isDismissedMoment?.() && !this.currentStoredSession) {
          this.failPendingLogin(
            new Error(
              notification.getDismissedReason?.() ??
                "Google sign-in was dismissed."
            )
          );
        }
      });
    });
  }

  async logout(): Promise<void> {
    const email = this.currentStoredSession?.email;
    this.clearStoredSession();
    this.setSession(
      this.isConfigured()
        ? createSignedOutSession("Google account signed out on this device.")
        : createSignedOutSession(
            "Google sign-in is unavailable until a Google client ID is configured."
          )
    );

    if (!this.sdkPromise) {
      return;
    }

    const sdk = await this.sdkPromise.catch(() => null);
    if (!sdk) {
      return;
    }

    sdk.disableAutoSelect();

    if (email) {
      await new Promise<void>((resolve) => {
        sdk.revoke(email, () => resolve());
      });
    }
  }

  async refreshSession(): Promise<AuthSession> {
    this.reconcileExpiredSession();
    return this.currentSession;
  }

  subscribe(listener: AuthStateListener): AuthStateSubscription {
    this.listeners.add(listener);
    listener(this.getSession());

    return {
      unsubscribe: () => {
        this.listeners.delete(listener);
      },
    };
  }

  async renderButton(
    parent: HTMLElement,
    options: GoogleButtonOptions = {}
  ): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error(
        "Google sign-in is unavailable until VITE_GOOGLE_CLIENT_ID is configured."
      );
    }

    const sdk = await this.ensureSdk();
    parent.innerHTML = "";
    sdk.renderButton(parent, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "pill",
      logo_alignment: "left",
      width: "280",
      locale: this.configuration.locale,
      ...options,
    });
  }

  private async ensureSdk(): Promise<GoogleIdentitySdk> {
    if (!this.isConfigured()) {
      throw new Error(
        "Google sign-in is unavailable until VITE_GOOGLE_CLIENT_ID is configured."
      );
    }

    if (!this.sdkPromise) {
      this.sdkPromise = this.loadSdk();
    }

    const sdk = await this.sdkPromise;

    if (!this.initialized) {
      sdk.initialize({
        client_id: this.configuration.clientId!.trim(),
        callback: (response) => {
          this.handleCredentialResponse(response);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        context: "signin",
        ux_mode: "popup",
        locale: this.configuration.locale,
      });
      this.initialized = true;
    }

    return sdk;
  }

  private handleCredentialResponse(response: GoogleCredentialResponse) {
    if (!response.credential) {
      this.failPendingLogin(new Error("Google sign-in returned no credential."));
      return;
    }

    try {
      const payload = decodeGoogleIdToken(response.credential);
      const now = this.now();
      const storedSession: StoredGoogleSession = {
        provider: GOOGLE_ACCOUNT_PROVIDER_ID,
        userId: payload.sub,
        email: payload.email,
        displayName: payload.name,
        avatarUrl: payload.picture,
        issuedAt:
          payload.iat !== undefined
            ? toIsoString(new Date(payload.iat * 1000))
            : undefined,
        expiresAt:
          payload.exp !== undefined
            ? toIsoString(new Date(payload.exp * 1000))
            : undefined,
        lastAuthenticatedAt: toIsoString(now),
      };

      this.writeStoredSession(storedSession);
      this.currentStoredSession = storedSession;
      this.currentCredentialToken = response.credential;
      const session = createAuthenticatedSession(storedSession);
      this.setSession(session);
      this.pendingLogin?.resolve({ session });
      this.pendingLogin = null;
    } catch (error) {
      this.failPendingLogin(
        error instanceof Error
          ? error
          : new Error("Google sign-in could not be completed.")
      );
    }
  }

  private failPendingLogin(error: Error) {
    this.clearStoredSession();
    this.setSession(
      this.isConfigured()
        ? createSignedOutSession(error.message)
        : createSignedOutSession(
            "Google sign-in is unavailable until a Google client ID is configured."
          )
    );
    this.pendingLogin?.reject(error);
    this.pendingLogin = null;
  }

  private setSession(nextSession: AuthSession) {
    this.currentSession = nextSession;
    this.listeners.forEach((listener) => {
      listener(this.currentSession);
    });
  }

  private readStoredSession(): StoredGoogleSession | null {
    const storage = this.getStorage();
    if (!storage) {
      return null;
    }

    const parsed = parseStoredGoogleSession(
      storage.getItem(GOOGLE_AUTH_STORAGE_KEY),
      this.now()
    );

    if (!parsed && storage.getItem(GOOGLE_AUTH_STORAGE_KEY) !== null) {
      storage.removeItem(GOOGLE_AUTH_STORAGE_KEY);
    }

    return parsed;
  }

  private writeStoredSession(session: StoredGoogleSession) {
    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(GOOGLE_AUTH_STORAGE_KEY, JSON.stringify(session));
  }

  private clearStoredSession() {
    this.currentStoredSession = null;
    this.currentCredentialToken = null;

    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    storage.removeItem(GOOGLE_AUTH_STORAGE_KEY);
  }

  private reconcileExpiredSession() {
    if (!this.currentStoredSession?.expiresAt) {
      return;
    }

    if (Date.parse(this.currentStoredSession.expiresAt) > this.now().getTime()) {
      return;
    }

    this.clearStoredSession();
    this.currentSession = {
      status: "error",
      user: null,
      provider: GOOGLE_ACCOUNT_PROVIDER_ID,
      detail: "The Google session expired. Sign in again to reconnect this device.",
    };
  }
}

export function createGoogleAuthRuntime(
  configuration: GoogleAuthRuntimeConfiguration,
  dependencies: RuntimeDependencies = {}
) {
  return new GoogleAuthRuntime(configuration, dependencies);
}

export function getDefaultGoogleAuthClientId() {
  const rawClientId =
    typeof import.meta !== "undefined" ? import.meta.env.VITE_GOOGLE_CLIENT_ID : "";

  return typeof rawClientId === "string" ? rawClientId.trim() : "";
}

export const googleAuthRuntime = createGoogleAuthRuntime({
  clientId: getDefaultGoogleAuthClientId(),
});
