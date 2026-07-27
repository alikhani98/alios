import { AppProviders } from "@/app/providers";
import type { AuthProvider } from "@/core/auth";
import { AppRouter } from "@/app/router";

type AppProps = {
  authProvider?: AuthProvider;
};

export function App({ authProvider }: AppProps) {
  return (
    <AppProviders authProvider={authProvider}>
      <AppRouter />
    </AppProviders>
  );
}
