import { createContext, useContext } from "react";

import { useLearningProfileState } from "./useLearningProfile";
import { useLearningStatsState } from "./useLearningStats";

const LearningContext = createContext(null);

export function LearningProvider({ children }) {
  const profileState = useLearningProfileState();
  const statsState = useLearningStatsState();

  return (
    <LearningContext.Provider value={{ ...profileState, ...statsState }}>
      {children}
    </LearningContext.Provider>
  );
}

export function useLearning() {
  const context = useContext(LearningContext);
  if (!context) {
    throw new Error("useLearning must be used within LearningProvider.");
  }
  return context;
}
