import { Navigate, Route, Routes } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import OnboardingFlow from "./components/OnboardingFlow";
import Dashboard from "./pages/Dashboard";
import PracticePage from "./pages/PracticePage";
import ScenarioPage from "./pages/ScenarioPage";
import SettingsPage from "./pages/SettingsPage";
import STTPage from "./pages/STTPage";
import TTSPage from "./pages/TTSPage";
import { ApiKeyProvider } from "./state/ApiKeyProvider";
import { LearningProvider, useLearning } from "./state/LearningProvider";

function AppShell() {
  const { isOnboarded, dir } = useLearning();

  if (!isOnboarded) {
    return <OnboardingFlow />;
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]" dir={dir}>
      <Sidebar />
      <main className="p-4 md:p-6 lg:p-8">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tts" element={<TTSPage />} />
          <Route path="/stt" element={<STTPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/scenario" element={<ScenarioPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ApiKeyProvider>
      <LearningProvider>
        <AppShell />
      </LearningProvider>
    </ApiKeyProvider>
  );
}
