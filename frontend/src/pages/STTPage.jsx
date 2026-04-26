import { useState } from "react";

import AudioRecorder from "../components/AudioRecorder";
import InlineNotice from "../components/InlineNotice";
import PageHeader from "../components/PageHeader";
import SmartTranslationAssistant from "../components/SmartTranslationAssistant";
import TechnicalMetadataPanel from "../components/TechnicalMetadataPanel";
import { Button } from "../components/ui/button";
import { Card, CardDescription, CardTitle } from "../components/ui/card";
import { requestSTT } from "../services/api";
import { useSessionApiKey } from "../state/ApiKeyProvider";
import { useLearning } from "../state/LearningProvider";

export default function STTPage() {
  const { apiKey } = useSessionApiKey();
  const { profile, t } = useLearning();
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fileFromBlob = (blob, prefix) => {
    const mimeType = blob.type || "audio/ogg";
    const extension =
      mimeType.includes("webm") ? "webm" :
      mimeType.includes("ogg") ? "ogg" :
      mimeType.includes("wav") ? "wav" :
      mimeType.includes("mpeg") || mimeType.includes("mp3") ? "mp3" :
      "bin";
    return new File([blob], `${prefix}-${Date.now()}.${extension}`, { type: mimeType });
  };

  const handleAnalyze = async () => {
    if (!file) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await requestSTT(apiKey, file, {
        native_language: profile.nativeLanguage,
        target_language: profile.targetLanguage,
        interface_language: profile.interfaceLanguage,
        level: profile.level,
        learning_goal: profile.learningGoal,
        feedback_style: profile.feedbackStyle,
        preferred_voice_style: profile.preferredVoiceStyle,
        weak_points: []
      });
      setResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <div className="space-y-4">
            <PageHeader
              eyebrow="Speech Workspace"
              title={t("pages.stt", "Speech-to-Text Study Workspace")}
              description={t("stt.description", "Upload audio or record your voice to turn speech into text, then review learner-aware summaries, vocabulary, and study support.")}
            />
            <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-cyan-400/30 bg-cyan-400/5 p-6 text-center">
              <input
                type="file"
                accept=".mp3,.wav,.ogg,audio/*"
                className="hidden"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
              <p className="text-lg font-semibold">{t("stt.dropzoneTitle", "Drop audio here or browse")}</p>
              <p className="mt-2 text-sm text-slate-300">{t("stt.dropzoneHelp", "Supported formats: MP3, WAV, OGG")}</p>
              {file && <p className="mt-4 text-sm text-cyan-200">{file.name}</p>}
            </label>
            <Button type="button" onClick={handleAnalyze} disabled={!apiKey || !file || loading}>
              {loading ? t("stt.analyzing", "Analyzing...") : t("stt.analyzeAudio", "Analyze Audio")}
            </Button>
            {error && <InlineNotice tone="error" title="We couldn't analyze your speech." description={error} />}
            {!apiKey && (
              <InlineNotice
                tone="warning"
                title="Add your Gemini API key first"
                description="Open Settings, add your key, and then come back to convert speech to text."
              />
            )}
          </div>
        </Card>
        <AudioRecorder
          onRecorded={(blob) => {
            const recordedFile = fileFromBlob(blob, "recording");
            setFile(recordedFile);
          }}
        />
      </div>

      {loading && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="skeleton h-40" />
          <div className="skeleton h-40" />
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <SmartTranslationAssistant
            apiKey={apiKey}
            text={result.transcript}
            nativeLanguage={profile.nativeLanguage}
            targetLanguage={profile.targetLanguage}
            difficultWords={result.difficult_words}
            title="Understand this speech (translation and learning support)"
            description="Open this layer when you want a full translation, key vocabulary, a word-by-word view, or spoken translation audio."
          />
          <Card>
            <CardTitle>Evaluation Metrics</CardTitle>
            <CardDescription className="mt-2">
              Quick evaluation signals for this STT result.
            </CardDescription>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Confidence</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {result.metadata?.confidence != null ? `${result.metadata.confidence}/100` : "--"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Processing Time</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {result.metadata?.processing_time_seconds != null ? `${Number(result.metadata.processing_time_seconds).toFixed(3)}s` : "--"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Model</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {result.metadata?.model_display || "--"}
                </p>
              </div>
            </div>
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardTitle>{t("common.transcript", "Transcript")}</CardTitle>
              <p className="mt-4 whitespace-pre-wrap text-sm text-slate-200">{result.transcript}</p>
            </Card>
            <Card>
              <CardTitle>{t("stt.summaryNotes", "Summary & Notes")}</CardTitle>
              <div className="mt-4 space-y-3 text-sm text-slate-200">
                <p><span className="font-semibold text-white">{t("common.summary", "Summary")}:</span> {result.summary}</p>
                <p><span className="font-semibold text-white">{t("common.tone", "Tone")}:</span> {result.tone}</p>
                <p><span className="font-semibold text-white">{t("common.keywords", "Keywords")}:</span> {result.keywords.join(", ")}</p>
                <div>
                  <p className="font-semibold text-white">{t("common.studyNotes", "Study Notes")}</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
                    {result.study_notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
            <TechnicalMetadataPanel
              title="Metadata de la API"
              description="Operational metrics returned with the Gemini STT workflow."
              processingTime={result.metadata?.processing_time_seconds}
              model={result.metadata?.model_display}
              metricLabel="Confidence"
              metricValue={result.metadata?.confidence != null ? `${result.metadata.confidence}/100` : "--"}
            />
            <Card>
              <CardTitle>{t("common.vocabulary", "Vocabulary")}</CardTitle>
              <div className="mt-4 space-y-3 text-sm text-slate-200">
                {(result.vocabulary || []).map((item, index) => (
                  <div key={`${item.term}-${index}`} className="rounded-2xl bg-slate-950/40 p-3">
                    <p className="font-semibold text-white">{item.term}</p>
                    <p className="mt-1 text-slate-300">{item.translation}</p>
                    <p className="mt-1 text-slate-400">{item.explanation}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardTitle>{t("common.suggestedPractice", "Suggested Practice")}</CardTitle>
              <div className="mt-4 space-y-3 text-sm text-slate-200">
                {(result.suggested_practice || []).map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-950/40 p-3">{item}</div>
                ))}
                {(result.difficult_words || []).length > 0 && (
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
                    <p className="font-semibold text-white">{t("stt.difficultWords", "Difficult Words")}</p>
                    <div className="mt-2 space-y-2">
                      {result.difficult_words.map((item, index) => (
                        <p key={`${item.word}-${index}`}><span className="text-white">{item.word}:</span> {item.explanation}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
