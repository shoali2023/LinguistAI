import { useEffect, useState } from "react";

import { resolveLanguageCode, translate } from "../i18n/translations";

const STORAGE_KEY = "linguistai_learning_profile";

const defaultProfile = {
  nativeLanguage: "",
  interfaceLanguage: "English",
  targetLanguage: "English",
  level: "Beginner",
  learningGoal: "Daily Conversation",
  feedbackStyle: "Encouraging",
  preferredVoiceStyle: "Friendly",
  completed: false
};

export function useLearningProfileState() {
  const [profile, setProfile] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultProfile, ...JSON.parse(raw) } : defaultProfile;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  const interfaceLanguage = profile.interfaceLanguage || profile.nativeLanguage || "English";
  const languageCode = resolveLanguageCode(interfaceLanguage);
  const dir = languageCode === "fa" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = languageCode;
  }, [dir, languageCode]);

  return {
    profile,
    setProfile,
    resetProfile: () => setProfile(defaultProfile),
    isOnboarded: Boolean(profile.completed && profile.nativeLanguage && profile.targetLanguage),
    languageCode,
    dir,
    t: (key, fallback) => translate(interfaceLanguage, key, fallback)
  };
}
