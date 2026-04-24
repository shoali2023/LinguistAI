import { useState } from "react";

import { useLearning } from "../state/LearningProvider";
import {
  feedbackStyles,
  interfaceLanguages,
  learningGoals,
  levels,
  targetLanguages,
  voiceStyles
} from "../state/learningOptions";
import BrandLogo from "./BrandLogo";
import { Button } from "./ui/button";
import { Card, CardDescription, CardTitle } from "./ui/card";

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="space-y-2 text-sm">
      <span className="text-slate-300">{label}</span>
      <select className="w-full rounded-2xl border border-border bg-slate-950/60" value={value} onChange={onChange}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function OnboardingFlow() {
  const { setProfile, t } = useLearning();
  const [form, setForm] = useState({
    nativeLanguage: "English",
    interfaceLanguage: "English",
    targetLanguage: "English",
    level: "Beginner",
    learningGoal: "Daily Conversation",
    feedbackStyle: "Encouraging",
    preferredVoiceStyle: "Friendly"
  });

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const submit = () => {
    setProfile({
      ...form,
      completed: true
    });
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8">
      <Card className="w-full p-8">
        <div className="grid gap-8 xl:grid-cols-[1fr_1.1fr]">
          <div>
            <BrandLogo className="w-full" imageClassName="max-h-[112px]" />
            <p className="mt-6 text-sm uppercase tracking-[0.3em] text-cyan-300">Adaptive Voice Learning Platform</p>
            <CardTitle className="mt-3 text-4xl">{t("pages.onboarding", "Set up your adaptive learning profile")}</CardTitle>
            <CardDescription className="mt-4 text-base">
              {t("onboarding.intro", "Personalize the platform so Gemini can adapt explanations, pronunciation advice, scenarios, and the interface language to your learner profile.")}
            </CardDescription>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField label={t("onboarding.nativeLanguage", "Native language")} value={form.nativeLanguage} onChange={update("nativeLanguage")} options={interfaceLanguages} />
            <SelectField label={t("onboarding.interfaceLanguage", "Interface language")} value={form.interfaceLanguage} onChange={update("interfaceLanguage")} options={interfaceLanguages} />
            <SelectField label={t("onboarding.targetLanguage", "Target language")} value={form.targetLanguage} onChange={update("targetLanguage")} options={targetLanguages} />
            <SelectField label={t("onboarding.currentLevel", "Current level")} value={form.level} onChange={update("level")} options={levels} />
            <SelectField label={t("onboarding.learningGoal", "Learning goal")} value={form.learningGoal} onChange={update("learningGoal")} options={learningGoals} />
            <SelectField label={t("onboarding.feedbackStyle", "Feedback style")} value={form.feedbackStyle} onChange={update("feedbackStyle")} options={feedbackStyles} />
            <div className="md:col-span-2">
              <SelectField label={t("onboarding.preferredVoiceStyle", "Preferred voice/style")} value={form.preferredVoiceStyle} onChange={update("preferredVoiceStyle")} options={voiceStyles} />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="button" size="lg" onClick={submit}>
                {t("onboarding.enterWorkspace", "Enter Workspace")}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
