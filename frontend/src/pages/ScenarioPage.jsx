import { useMemo, useState } from "react";

import AudioPlayer from "../components/AudioPlayer";
import AudioRecorder from "../components/AudioRecorder";
import InlineNotice from "../components/InlineNotice";
import PageHeader from "../components/PageHeader";
import PronunciationResult from "../components/PronunciationResult";
import ScenarioSelector from "../components/ScenarioSelector";
import { Button } from "../components/ui/button";
import { Card, CardDescription, CardTitle } from "../components/ui/card";
import {
  requestPronunciationAnalysisWithRetry,
  requestScenarioGenerate,
  requestTTS
} from "../services/api";
import { useSessionApiKey } from "../state/ApiKeyProvider";
import { useLearning } from "../state/LearningProvider";

export default function ScenarioPage() {
  const { apiKey } = useSessionApiKey();
  const { profile, stats, updateFromPractice, t } = useLearning();
  const [scenario, setScenario] = useState("Airport");
  const [dialogueData, setDialogueData] = useState(null);
  const [selectedLineIndex, setSelectedLineIndex] = useState(0);
  const [recordedFile, setRecordedFile] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [dialogueAudio, setDialogueAudio] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const profilePayload = {
    native_language: profile.nativeLanguage,
    target_language: profile.targetLanguage,
    interface_language: profile.interfaceLanguage,
    level: profile.level,
    learning_goal: profile.learningGoal,
    feedback_style: profile.feedbackStyle,
    preferred_voice_style: profile.preferredVoiceStyle,
    weak_points: stats.weakPoints || []
  };

  const selectedLine = dialogueData?.dialogue?.[selectedLineIndex]?.line || "";
  const dialogueAudioUrl = useMemo(() => {
    if (!dialogueAudio) {
      return null;
    }
    return `data:${dialogueAudio.mime_type};base64,${dialogueAudio.audio_base64}`;
  }, [dialogueAudio]);

  const generateScenario = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await requestScenarioGenerate(apiKey, profilePayload, scenario);
      setDialogueData(response);
      setSelectedLineIndex(response.practice_line_indices?.[0] || 0);
      setFeedback(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const playDialogue = async () => {
    if (!dialogueData) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const joinedDialogue = dialogueData.dialogue.map((line) => `${line.speaker}: ${line.line}`).join("\n");
      const response = await requestTTS(apiKey, {
        text: joinedDialogue,
        voice: "Kore",
        style: profile.preferredVoiceStyle || "Professional",
        learning_mode: "Friendly tutor",
        generation_type: "model_pronunciation",
        profile: profilePayload
      });
      setDialogueAudio(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const analyzeLine = async () => {
    if (!recordedFile || !selectedLine) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await requestPronunciationAnalysisWithRetry(apiKey, selectedLine, recordedFile, {
        attempts: 3,
        profile: profilePayload
      });
      setFeedback(response);
      updateFromPractice(response, { scenario, sentence: selectedLine });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <PageHeader
          eyebrow="Scenario Practice"
          title={t("pages.scenario", "Scenario Practice Lab")}
          description="Create a realistic mini-dialogue, listen to it, choose one line, and then practice that line with pronunciation analysis."
        />
        <div className="mt-5">
          <ScenarioSelector value={scenario} onChange={setScenario} />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button type="button" onClick={generateScenario} disabled={!apiKey || busy}>Create a dialogue</Button>
          <Button type="button" variant="secondary" onClick={playDialogue} disabled={!apiKey || busy || !dialogueData}>Listen to the full dialogue</Button>
        </div>
        {error && <InlineNotice tone="error" title="We couldn’t prepare the scenario." description={error} className="mt-4" />}
      </Card>

      <AudioPlayer audioUrl={dialogueAudioUrl} title={t("scenario.dialogueAudio", "Scenario Dialogue Audio")} description={t("scenario.dialogueAudioDescription", "TTS playback of the generated mini-dialogue.")} />

      {dialogueData && (
        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <CardTitle>{dialogueData.title}</CardTitle>
            <CardDescription className="mt-2">{dialogueData.context}</CardDescription>
            <div className="mt-5 space-y-3">
              {dialogueData.dialogue.map((line, index) => (
                <button
                  key={`${line.speaker}-${index}`}
                  type="button"
                  className={`w-full rounded-2xl border p-4 text-left transition ${index === selectedLineIndex ? "border-cyan-400/40 bg-cyan-400/10" : "border-white/10 bg-slate-950/40"}`}
                  onClick={() => setSelectedLineIndex(index)}
                >
                  <p className="font-semibold text-white">{line.speaker}</p>
                  <p className="mt-2 text-slate-200">{line.line}</p>
                  <p className="mt-2 text-sm text-slate-400">{line.translation}</p>
                </button>
              ))}
            </div>
          </Card>
          <Card>
            <CardTitle>{t("scenario.practiceSelectedLine", "Practice Selected Line")}</CardTitle>
            <CardDescription className="mt-2">{selectedLine || t("scenario.selectLine", "Select a line from the scenario dialogue.")}</CardDescription>
            <div className="mt-5">
              <AudioRecorder
                onRecorded={(blob) => {
                  const mimeType = blob.type || "audio/ogg";
                  const extension = mimeType.includes("ogg") ? "ogg" : mimeType.includes("wav") ? "wav" : "mp3";
                  setRecordedFile(new File([blob], `scenario-${Date.now()}.${extension}`, { type: mimeType }));
                }}
              />
            </div>
            <div className="mt-5">
              <Button type="button" onClick={analyzeLine} disabled={!apiKey || busy || !recordedFile || !selectedLine}>
                Review this line
              </Button>
            </div>
            <div className="mt-5 space-y-2 text-sm text-slate-300">
              <p><span className="font-semibold text-white">{t("scenario.pronunciationFocus", "Pronunciation focus")}:</span> {(dialogueData.pronunciation_focus || []).join(", ")}</p>
              <p><span className="font-semibold text-white">{t("scenario.coachNote", "Coach note")}:</span> {dialogueData.coach_note}</p>
            </div>
            {!recordedFile && (
              <InlineNotice
                tone="warning"
                title="Record your voice when you are ready"
                description="Pick one line from the dialogue, record it once, and then run the pronunciation review."
                className="mt-5"
              />
            )}
          </Card>
        </div>
      )}

      <PronunciationResult result={feedback} contrastiveTitle={t("practice.contrastiveInsight", "Contrastive Pronunciation Insight")} />
    </div>
  );
}
