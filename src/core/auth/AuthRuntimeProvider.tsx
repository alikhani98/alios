import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { localOnlyAuthProvider } from "./LocalOnlyAuthProvider";
import type { AuthSessionSource } from "./authSessionStore";
import type { AuthProvider, AuthSession } from "./types";

type AuthContextValue = Readonly<{
  provider: AuthProvider;
  session: AuthSession;
}>;

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthRuntimeProviderProps = {
  provider?: AuthProvider;
  sessionSource?: AuthSessionSource;
  children: ReactNode;
};

function createBootstrapSession(provider: AuthProvider): AuthSession {
  return {
    status: "authenticating",
    user: null,
    provider: provider.name,
    detail: "AliOS is preparing the authentication runtime.",
  };
}

export function AuthRuntimeProvider({
  provider = localOnlyAuthProvider,
  sessionSource = provider,
  children,
}: AuthRuntimeProviderProps) {
  const [session, setSession] = useState<AuthSession>(() =>
    createBootstrapSession(provider)
  );

  useEffect(() => {
    let isActive = true;

    setSession(createBootstrapSession(provider));

    void sessionSource
      .getCurrentSession()
      .then((currentSession) => {
        if (isActive) {
          setSession(currentSession);
        }
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setSession({
          status: "error",
          user: null,
          provider: provider.name,
          detail:
            error instanceof Error
              ? error.message
              : "AliOS could not prepare the authentication runtime.",
        });
      });

    const subscription = sessionSource.subscribe((nextSession) => {
      if (isActive) {
        setSession(nextSession);
      }
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [provider, sessionSource]);

  const value = useMemo<AuthContextValue>(
    () => ({
      provider,
      session,
    }),
    [provider, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error("AuthRuntimeProvider is missing from the application tree.");
  }

  return context;
}

export function useAuthSession(): AuthSession {
  return useAuth().session;
}
