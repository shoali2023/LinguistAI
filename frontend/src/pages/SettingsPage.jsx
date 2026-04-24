import { useEffect, useState } from "react";

import AdvancedPanel from "../components/AdvancedPanel";
import PageHeader from "../components/PageHeader";
import { useSessionApiKey } from "../state/ApiKeyProvider";
import { useLearning } from "../state/LearningProvider";
import { feedbackStyles, interfaceLanguages, learningGoals, levels, targetLanguages, voiceStyles } from "../state/learningOptions";
import { Button } from "../components/ui/button";
import { Card, CardDescription, CardTitle } from "../components/ui/card";

export default function SettingsPage() {
  const { apiKey, setApiKey, apiKeyStatus, apiKeyMessage } = useSessionApiKey();
  const { profile, setProfile, resetProfile, resetStats, t } = useLearning();
  const [form, setForm] = useState(profile);
  const helperClass =
    apiKeyStatus === "approved"
      ? "text-emerald-300"
      : apiKeyStatus === "checking"
        ? "text-amber-300"
        : apiKeyStatus === "invalid"
          ? "text-red-300"
          : "text-slate-300";

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  useEffect(() => {
    setForm(profile);
  }, [profile]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <div className="space-y-4">
          <PageHeader
            eyebrow="Access and Privacy"
            title={t("pages.settings", "Settings")}
            description="Manage your Gemini access, personal learning profile, and local session data."
          />
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/8 p-4">
            <p className="text-sm font-semibold text-cyan-100">Gemini API key guide</p>
            <p className="mt-2 text-sm text-cyan-50/85">
              If you do not have an API key yet, create one in Google AI Studio:
            </p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex text-sm font-medium text-cyan-200 underline decoration-cyan-400/40 underline-offset-4"
            >
              Open the Gemini API key page
            </a>
            <p className="mt-3 text-xs leading-6 text-cyan-50/75">
              Privacy note: your key is used only for requests you start inside this app. LinguistAI runs locally on your machine, and the backend does not permanently store your API key in a database or file.
            </p>
          </div>
          <label className="space-y-2 text-sm">
            <span className="text-slate-300">{t("settings.apiKey", "Gemini API Key")}</span>
            <input
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              className="w-full rounded-2xl border border-border bg-slate-950/60 px-4 py-3"
              placeholder="AIza..."
            />
          </label>
          <p className={`text-sm ${helperClass}`}>{apiKeyMessage}</p>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => setApiKey("")}>
              {t("settings.clearKey", "Clear Key")}
            </Button>
            <Button type="button" variant="secondary" onClick={() => { sessionStorage.clear(); setApiKey(""); window.location.reload(); }}>
              {t("settings.clearSession", "Clear Session Data")}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="space-y-4">
          <div>
            <CardTitle>{t("settings.profileTitle", "Learning Profile")}</CardTitle>
            <CardDescription>{t("settings.profileDescription", "Edit your adaptive learner profile and reset statistics without creating a database.")}</CardDescription>
          </div>
          <AdvancedPanel title="Edit full learning profile" defaultOpen>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="text-slate-300">{t("settings.nativeLanguage", "Native language")}</span>
                <select className="w-full rounded-2xl border border-border bg-slate-950/60" value={form.nativeLanguage} onChange={update("nativeLanguage")}>
                  {interfaceLanguages.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-slate-300">{t("settings.interfaceLanguage", "UI language")}</span>
                <select className="w-full rounded-2xl border border-border bg-slate-950/60" value={form.interfaceLanguage} onChange={update("interfaceLanguage")}>
                  {interfaceLanguages.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-slate-300">{t("settings.targetLanguage", "Target language")}</span>
                <select className="w-full rounded-2xl border border-border bg-slate-950/60" value={form.targetLanguage} onChange={update("targetLanguage")}>
                  {targetLanguages.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-slate-300">{t("settings.level", "Level")}</span>
                <select className="w-full rounded-2xl border border-border bg-slate-950/60" value={form.level} onChange={update("level")}>
                  {levels.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-slate-300">{t("settings.goal", "Goal")}</span>
                <select className="w-full rounded-2xl border border-border bg-slate-950/60" value={form.learningGoal} onChange={update("learningGoal")}>
                  {learningGoals.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-slate-300">{t("settings.feedbackStyle", "Feedback style")}</span>
                <select className="w-full rounded-2xl border border-border bg-slate-950/60" value={form.feedbackStyle} onChange={update("feedbackStyle")}>
                  {feedbackStyles.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm md:col-span-2">
                <span className="text-slate-300">{t("settings.preferredVoiceStyle", "Preferred voice style")}</span>
                <select className="w-full rounded-2xl border border-border bg-slate-950/60" value={form.preferredVoiceStyle} onChange={update("preferredVoiceStyle")}>
                  {voiceStyles.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            </div>
          </AdvancedPanel>
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => setProfile({ ...form, completed: true })}>
              Save profile changes
            </Button>
            <Button type="button" variant="secondary" onClick={resetStats}>
              Reset learning statistics
            </Button>
            <Button type="button" variant="secondary" onClick={() => { resetProfile(); }}>
              Reset profile
            </Button>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
            <CardTitle className="text-base">Project and contact</CardTitle>
            <CardDescription className="mt-2">
              LinguistAI is presented as a professional speech-learning platform for academic and product demonstration use.
            </CardDescription>
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <p><span className="font-semibold text-white">GitHub:</span> <a href="https://github.com/shoali2023" target="_blank" rel="noreferrer" className="text-cyan-200 underline underline-offset-4">github.com/shoali2023</a></p>
              <p><span className="font-semibold text-white">Email:</span> <a href="mailto:ali.shoeibi1@gmail.com" className="text-cyan-200 underline underline-offset-4">ali.shoeibi1@gmail.com</a></p>
              <p><span className="font-semibold text-white">LinkedIn:</span> <a href="https://www.linkedin.com/in/ali-shoeibi01/" target="_blank" rel="noreferrer" className="text-cyan-200 underline underline-offset-4">linkedin.com/in/ali-shoeibi01</a></p>
              <p><span className="font-semibold text-white">Location:</span> Salamanca, Spain</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
