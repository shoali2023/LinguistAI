import { AudioLines, LayoutDashboard, Mic2, Settings2, Speech, Theater } from "lucide-react";
import { NavLink } from "react-router-dom";

import BrandLogo from "./BrandLogo";
import { useSessionApiKey } from "../state/ApiKeyProvider";
import { useLearning } from "../state/LearningProvider";

export default function Sidebar() {
  const { apiKeyStatus, apiKeyMessage } = useSessionApiKey();
  const { t } = useLearning();
  const items = [
    { to: "/dashboard", label: t("sidebar.dashboard", "Dashboard"), icon: LayoutDashboard },
    { to: "/tts", label: t("sidebar.tts", "TTS"), icon: Speech },
    { to: "/stt", label: t("sidebar.stt", "STT"), icon: AudioLines },
    { to: "/practice", label: t("sidebar.practice", "Practice"), icon: Mic2 },
    { to: "/scenario", label: t("sidebar.scenario", "Scenario Practice"), icon: Theater },
    { to: "/settings", label: t("sidebar.settings", "Settings"), icon: Settings2 }
  ];
  const badgeClass =
    apiKeyStatus === "approved"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/30"
      : apiKeyStatus === "checking"
        ? "bg-amber-500/15 text-amber-300 border-amber-400/30"
        : apiKeyStatus === "invalid"
          ? "bg-red-500/15 text-red-300 border-red-400/30"
          : "bg-slate-500/15 text-slate-300 border-slate-400/20";
  const statusLabel =
    apiKeyStatus === "approved"
      ? t("common.approved", "API Key Approved")
      : apiKeyStatus === "checking"
        ? t("common.checking", "Checking Key")
        : apiKeyStatus === "invalid"
          ? t("common.rejected", "Key Rejected")
          : t("common.notLoaded", "Key Not Loaded");

  return (
    <aside className="border-b border-white/10 bg-slate-950/70 p-4 backdrop-blur lg:min-h-screen lg:border-b-0 lg:border-r">
      <div className="panel flex h-full flex-col gap-6 p-5">
        <div>
          <BrandLogo compact className="mx-auto w-full max-w-none" imageClassName="max-h-[88px]" />
          <div className="mt-4 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Speech Intelligence Lab</p>
          </div>
          <p className="mt-3 text-sm text-center text-slate-300">
            Voice interaction and language learning for Tecnologias del Habla.
          </p>
          <div className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass}`}>
            {statusLabel}
          </div>
        </div>
        <nav className="flex flex-col gap-2">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  isActive ? "bg-cyan-400/15 text-cyan-200" : "text-slate-300 hover:bg-white/5 hover:text-white"
                ].join(" ")
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
          <p className="text-sm font-semibold text-cyan-100">{t("sidebar.sessionSecurity", "Session Security")}</p>
          <p className="mt-2 text-sm text-cyan-50/80">
            {apiKeyMessage}
          </p>
          <p className="mt-3 text-xs text-cyan-50/70">
            {t("sidebar.sessionSecurityHelp", "The Gemini key is supplied per request through the X-Gemini-API-Key header and is never persisted by the backend.")}
          </p>
        </div>
      </div>
    </aside>
  );
}
