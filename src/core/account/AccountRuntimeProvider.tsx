import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

import {
  accountRuntimeStateStore,
  createAccountRuntimeStateStore,
  type AccountRuntimeStateStore,
  useAccountRuntimeState as useAccountRuntimeStateSnapshot,
} from "./runtimeStateStore";
import {
  localOnlyAccountRuntimeBoundary,
  type AccountRuntimeBoundary,
} from "./runtimeBoundary";

type AccountRuntimeContextValue = Readonly<{
  boundary: AccountRuntimeBoundary;
  store: AccountRuntimeStateStore;
}>;

const AccountRuntimeContext = createContext<AccountRuntimeContextValue | null>(
  null
);

type AccountRuntimeProviderProps = Readonly<{
  boundary?: AccountRuntimeBoundary;
  store?: AccountRuntimeStateStore;
  children: ReactNode;
}>;

export function AccountRuntimeProvider({
  boundary = localOnlyAccountRuntimeBoundary,
  store,
  children,
}: AccountRuntimeProviderProps) {
  const runtimeStore = useMemo(
    () => store ?? createAccountRuntimeStateStore(boundary),
    [boundary, store]
  );

  useEffect(() => {
    void runtimeStore.refresh();
  }, [runtimeStore]);

  const value = useMemo<AccountRuntimeContextValue>(
    () => ({
      boundary,
      store: runtimeStore,
    }),
    [boundary, runtimeStore]
  );

  return (
    <AccountRuntimeContext.Provider value={value}>
      {children}
    </AccountRuntimeContext.Provider>
  );
}

export function useAccountRuntime(): AccountRuntimeContextValue {
  const context = useContext(AccountRuntimeContext);

  if (context === null) {
    throw new Error(
      "AccountRuntimeProvider is missing from the application tree."
    );
  }

  return context;
}

export function useAccountRuntimeState() {
  return useAccountRuntimeStateSnapshot(useAccountRuntime().store);
}

export { accountRuntimeStateStore };
