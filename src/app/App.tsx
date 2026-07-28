import { AppProviders } from "@/app/providers";
import type { AccountProvider } from "@/core/account";
import type { AuthProvider } from "@/core/auth";
import { AppRouter } from "@/app/router";

type AppProps = {
  accountProvider?: AccountProvider;
  authProvider?: AuthProvider;
};

export function App({ accountProvider, authProvider }: AppProps) {
  return (
    <AppProviders
      accountProvider={accountProvider}
      authProvider={authProvider}
    >
      <AppRouter />
    </AppProviders>
  );
}
