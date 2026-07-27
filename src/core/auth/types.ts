export type AuthUser = Readonly<{
  userId: string;
  email: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}>;

export type AuthSessionStatus =
  | "unauthenticated"
  | "authenticating"
  | "authenticated"
  | "refreshing"
  | "error";

export type AuthSession = Readonly<{
  status: AuthSessionStatus;
  user: AuthUser | null;
  expiresAt?: string;
  provider: string;
  detail?: string;
}>;

export type AuthLoginInput = Readonly<{
  email?: string;
  password?: string;
  redirectTo?: string;
  metadata?: Record<string, unknown>;
}>;

export type AuthLoginResult = Readonly<{
  session: AuthSession;
  requiresVerification?: boolean;
}>;

export type AuthStateListener = (session: AuthSession) => void;

export type AuthStateSubscription = Readonly<{
  unsubscribe: () => void;
}>;

/**
 * Future auth adapters must stay outside feature code and preserve AliOS'
 * local-first behavior until the user explicitly enables an account flow.
 */
export interface AuthProvider {
  readonly name: string;
  getCurrentUser(): Promise<AuthUser | null>;
  getCurrentSession(): Promise<AuthSession>;
  login(input: AuthLoginInput): Promise<AuthLoginResult>;
  logout(): Promise<void>;
  refreshSession(): Promise<AuthSession>;
  subscribe(listener: AuthStateListener): AuthStateSubscription;
}
