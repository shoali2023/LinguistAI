import { createContext, useContext } from "react";

import { useSessionApiKeyState } from "./useSessionApiKey";

const ApiKeyContext = createContext(null);

export function ApiKeyProvider({ children }) {
  const value = useSessionApiKeyState();
  return <ApiKeyContext.Provider value={value}>{children}</ApiKeyContext.Provider>;
}

export function useSessionApiKey() {
  const context = useContext(ApiKeyContext);
  if (!context) {
    throw new Error("useSessionApiKey must be used within ApiKeyProvider.");
  }
  return context;
}
