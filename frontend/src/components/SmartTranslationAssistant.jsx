import { useEffect, useMemo, useState } from "react";

import InlineNotice from "./InlineNotice";
import TranslationCard from "./TranslationCard";
import TranslationOptionsPanel from "./TranslationOptionsPanel";
import VocabularyCard from "./VocabularyCard";
import WordByWordTable from "./WordByWordTable";
import { Button } from "./ui/button";
import { Card, CardDescription, CardTitle } from "./ui/card";
import { requestTranslationAnalysis } from "../services/api";

const DEFAULT_OPTIONS = {
  word_by_word: false,
  vocabulary: true,
  explanations: true,
  learning_mode: "Normal speed"
};

function buildCacheKey(text, nativeLanguage, targetLanguage, mode, options) {
  return `linguistai_translation_${JSON.stringify({
    text,
    nativeLanguage,
    targetLanguage,
    mode,
    options
  })}`;
}

export default function SmartTranslationAssistant({
  apiKey,
  text,
  nativeLanguage,
  targetLanguage,
  difficultWords = [],
  title = "Translate your speech (language understanding)",
  description = "Use this layer when you want to understand the meaning, important words, and a spoken translation.",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState("text");
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("translation");

  const cacheKey = useMemo(
    () => buildCacheKey(text, nativeLanguage, targetLanguage, mode, options),
    [text, nativeLanguage, targetLanguage, mode, options]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setResult(JSON.parse(cached));
    } else {
      setResult(null);
    }
  }, [cacheKey, isOpen]);

  const handleAnalyze = async () => {
    if (!text?.trim()) {
      setError("There is no text available to translate yet.");
      return;
    }

    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setResult(JSON.parse(cached));
      setError("");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await requestTranslationAnalysis(apiKey, {
        text,
        native_language: nativeLanguage,
        target_language: targetLanguage,
        mode,
        options
      });
      setResult(response);
      setActiveTab(options.word_by_word ? "word" : "translation");
      sessionStorage.setItem(cacheKey, JSON.stringify(response));
    } catch (err) {
      setError(err.message || "We couldn't translate this audio. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const openWordByWord = () => {
    setIsOpen(true);
    setOptions((current) => ({ ...current, word_by_word: true }));
    setActiveTab("word");
  };

  const highlightWords = difficultWords.map((item) => item.word || item);

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <CardTitle>{title}</CardTitle>
          <CardDescription className="mt-2">{description}</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant={isOpen ? "secondary" : "default"} onClick={() => setIsOpen((value) => !value)}>
            {isOpen ? "Hide understanding tools" : "Understand this content"}
          </Button>
          <Button type="button" variant="secondary" onClick={openWordByWord}>
            Word-by-word translation
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-6 space-y-5">
          <InlineNotice
            tone="info"
            title="Choose how deeply you want to understand this content"
            description="Use the Word-by-word translation button for a closer lexical view, or keep the standard understanding flow for a full translation first."
          />
          <TranslationOptionsPanel
            mode={mode}
            onModeChange={setMode}
            options={options}
            onOptionsChange={setOptions}
            busy={busy}
            onSubmit={handleAnalyze}
          />

          {error && (
            <InlineNotice
              tone="error"
              title="We couldn't translate this content."
              description={error}
            />
          )}

          {result && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "translation", label: "Translation" },
                  { id: "vocabulary", label: "Vocabulary" },
                  { id: "word", label: "Word by word" }
                ].map((tab) => (
                  <Button
                    key={tab.id}
                    type="button"
                    variant={activeTab === tab.id ? "default" : "secondary"}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>

              {activeTab === "translation" && (
                <TranslationCard
                  translation={result.translation}
                  explanations={result.explanations}
                  audioUrl={result.audio_translation_url}
                />
              )}
              {activeTab === "vocabulary" && <VocabularyCard items={result.vocabulary} />}
              {activeTab === "word" && (
                <WordByWordTable items={result.word_by_word} highlightWords={highlightWords} />
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
