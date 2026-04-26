import { useMemo, useState } from "react";

import AdvancedPanel from "../components/AdvancedPanel";
import AudioPlayer from "../components/AudioPlayer";
import AudioRecorder from "../components/AudioRecorder";
import InlineNotice from "../components/InlineNotice";
import PageHeader from "../components/PageHeader";
import PracticeStepper from "../components/PracticeStepper";
import PronunciationResult from "../components/PronunciationResult";
import ScenarioSelector from "../components/ScenarioSelector";
import SmartTranslationAssistant from "../components/SmartTranslationAssistant";
import TechnicalMetadataPanel from "../components/TechnicalMetadataPanel";
import { Button } from "../components/ui/button";
import { Card, CardDescription, CardTitle } from "../components/ui/card";
import { requestAudioFeedback, requestPracticeSentence, requestPracticeSentenceExplanation, requestPronunciationAnalysisWithRetry, requestTTS } from "../services/api";
import { useSessionApiKey } from "../state/ApiKeyProvider";
import { useLearning } from "../state/LearningProvider";

export default function PracticePage() {
  const { apiKey } = useSessionApiKey();
  const { profile, stats, updateFromPractice, t } = useLearning();
  const [scenario, setScenario] = useState("Daily Conversation");
  const [targetText, setTargetText] = useState("");
  const [translation, setTranslation] = useState("");
  const [practiceMeta, setPracticeMeta] = useState(null);
  const [recordedFile, setRecordedFile] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [modelAudio, setModelAudio] = useState(null);
  const [feedbackAudio, setFeedbackAudio] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [analysisStatus, setAnalysisStatus] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

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

  const modelAudioUrl = useMemo(() => {
    if (!modelAudio) {
      return null;
    }
    return `data:${modelAudio.mime_type};base64,${modelAudio.audio_base64}`;
  }, [modelAudio]);
  const feedbackAudioUrl = useMemo(() => {
    if (!feedbackAudio) {
      return null;
    }
    return `data:${feedbackAudio.mime_type};base64,${feedbackAudio.audio_base64}`;
  }, [feedbackAudio]);

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

  const steps = [
    t("practice.step1", "Generate sentence"),
    t("practice.step2", "Listen to model"),
    t("practice.step3", "Record yourself"),
    t("practice.step4", "Analyze pronunciation"),
    t("practice.step5", "Listen to audio feedback"),
    t("practice.step6", "Next recommendation")
  ];

  const resetSentenceDependentState = () => {
    setTranslation("");
    setPracticeMeta(null);
    setRecordedFile(null);
    setFeedback(null);
    setModelAudio(null);
    setFeedbackAudio(null);
    setAnalysisStatus("");
    setCurrentStep(0);
  };

  const refreshSentenceGuidance = async () => {
    if (!targetText.trim()) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await requestPracticeSentenceExplanation(apiKey, profilePayload, targetText.trim(), scenario);
      setTargetText(response.sentence || targetText.trim());
      setTranslation(response.translation);
      setPracticeMeta(response);
    } catch (err) {
      setError(err.message || "We couldn't update the sentence guidance.");
    } finally {
      setBusy(false);
    }
  };

  const generateSentence = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await requestPracticeSentence(apiKey, profilePayload, scenario);
      setTargetText(response.sentence);
      setTranslation(response.translation);
      setPracticeMeta(response);
      setRecordedFile(null);
      setFeedback(null);
      setModelAudio(null);
      setFeedbackAudio(null);
      setCurrentStep(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const generateModelAudio = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await requestTTS(apiKey, {
        text: targetText,
        voice: "Puck",
        style: profile.preferredVoiceStyle || "Professional",
        learning_mode: "Slow pronunciation",
        generation_type: "model_pronunciation",
        profile: profilePayload
      });
      setModelAudio(response);
      setCurrentStep(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const analyze = async () => {
    if (!recordedFile) {
      return;
    }
    setBusy(true);
    setError("");
    setAnalysisStatus(t("practice.uploadStatus", "Uploading your recording to Gemini..."));
    try {
      const response = await requestPronunciationAnalysisWithRetry(apiKey, targetText, recordedFile, {
        attempts: 3,
        profile: profilePayload,
        onRetry: ({ attempt, attempts }) => {
          setAnalysisStatus(`${t("practice.retrying", "Gemini is busy. Retrying pronunciation analysis")} (${attempt + 1}/${attempts})...`);
        }
      });
      setFeedback(response);
      updateFromPractice(response, { scenario, sentence: targetText });
      const audioResponse = await requestAudioFeedback(apiKey, {
        text: `${response.native_language_feedback} ${response.target_language_tip} ${response.encouragement}`,
        voice: "Kore",
        style: profile.preferredVoiceStyle || "Friendly",
        profile: profilePayload
      });
      setFeedbackAudio(audioResponse);
      setAnalysisStatus(t("practice.analysisDone", "Pronunciation analysis completed."));
      setCurrentStep(5);
    } catch (err) {
      const message = err.message || "Practice analysis failed.";
      if (err.errorType === "service_busy" || message.toLowerCase().includes("busy on the ai side") || message.toLowerCase().includes("overloaded") || message.includes("503")) {
        setError(t("practice.overloaded", "Gemini is overloaded right now. Please wait a little and try Practice again."));
      } else {
        setError(message);
      }
      setAnalysisStatus("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PracticeStepper steps={steps} currentStep={currentStep} />
      <Card>
        <PageHeader
          eyebrow="Guided Practice"
          title={t("pages.practice", "Adaptive Pronunciation Tutor")}
          description="Move through the practice loop step by step: create a sentence, listen, record, review, and then continue with the next recommendation."
        />
        <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_auto_auto_auto]">
          <textarea
            className="min-h-28 rounded-2xl border border-border bg-slate-950/60 p-4 text-sm"
            value={targetText}
            onChange={(event) => {
              const nextValue = event.target.value;
              setTargetText(nextValue);
              if (practiceMeta && nextValue.trim() !== (practiceMeta.sentence || "").trim()) {
                resetSentenceDependentState();
              }
            }}
            placeholder="Your practice sentence will appear here. You can adjust it before listening or recording."
          />
          <Button type="button" onClick={generateSentence} disabled={!apiKey || busy}>Generate a practice sentence</Button>
          <Button type="button" variant="secondary" onClick={refreshSentenceGuidance} disabled={!apiKey || busy || !targetText.trim()}>
            Update sentence guidance
          </Button>
          <Button type="button" variant="secondary" onClick={generateModelAudio} disabled={!apiKey || busy || !targetText.trim()}>
            Listen to the model voice
          </Button>
          <Button type="button" onClick={analyze} disabled={!apiKey || busy || !recordedFile}>
            Analyze your pronunciation
          </Button>
        </div>
        <AdvancedPanel title="Advanced practice options">
          <p className="mb-3 text-sm text-slate-300">Choose a scenario when you want more realistic sentence generation for travel, study, meetings, or daily conversation.</p>
          <ScenarioSelector value={scenario} onChange={setScenario} />
        </AdvancedPanel>
        {practiceMeta && (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <Card className="bg-slate-950/30">
              <CardTitle>{t("practice.translation", "Translation")}</CardTitle>
              <p className="mt-3 text-sm text-slate-200">{translation}</p>
              <p className="mt-4 text-sm text-slate-300"><span className="font-semibold text-white">{t("practice.explanation", "Explanation")}:</span> {practiceMeta.short_explanation}</p>
            </Card>
            <Card className="bg-slate-950/30">
              <CardTitle>{t("practice.focusPoints", "Focus Points")}</CardTitle>
              <div className="mt-3 flex flex-wrap gap-2">
                {(practiceMeta.focus_points || []).map((item) => (
                  <span key={item} className="rounded-full bg-cyan-400/10 px-3 py-1 text-sm text-cyan-100">{item}</span>
                ))}
              </div>
              <p className="mt-4 text-sm text-slate-300"><span className="font-semibold text-white">{t("practice.challenges", "Expected Challenges")}:</span> {(practiceMeta.expected_pronunciation_challenges || []).join(", ")}</p>
            </Card>
          </div>
        )}
        {!practiceMeta && targetText.trim() && (
          <InlineNotice
            tone="info"
            title="Update the sentence guidance next"
            description="You changed the practice sentence manually. Click Update sentence guidance to generate a fresh translation, explanation, focus points, and expected challenges for the new text."
            className="mt-4"
          />
        )}
        {analysisStatus && <InlineNotice tone="info" title="Working on your speech" description={analysisStatus} className="mt-4" />}
        {error && <InlineNotice tone="error" title="We couldn’t finish the pronunciation review." description={error} className="mt-4" />}
        {!recordedFile && <InlineNotice tone="warning" title="Record a short sample next" description={t("practice.recordHint", "Record a sample before running analysis.")} className="mt-4" />}
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <AudioRecorder
          onRecorded={(blob) => {
            const file = fileFromBlob(blob, "practice");
            setRecordedFile(file);
            setCurrentStep(2);
          }}
        />
        <div className="space-y-6">
          <AudioPlayer audioUrl={modelAudioUrl} title={t("practice.modelAudio", "Model Audio")} description="Listen to a calm reference reading before you record your own voice." />
          <AudioPlayer audioUrl={feedbackAudioUrl} title={t("practice.audioFeedback", "Audio Feedback")} description="Listen to spoken coaching after the analysis is complete." />
        </div>
      </div>

      {busy && <div className="skeleton h-48" />}

      <PronunciationResult result={feedback} contrastiveTitle={t("practice.contrastiveInsight", "Contrastive Pronunciation Insight")} />

      {feedback?.metadata && (
        <TechnicalMetadataPanel
          title="Metadata de la API"
          description="Real-time backend metrics for pronunciation analysis."
          processingTime={feedback.metadata.processing_time_seconds}
          model={feedback.metadata.model_display}
          metricLabel="Intelligibility"
          metricValue={feedback.metadata.intelligibility != null ? `${feedback.metadata.intelligibility}/100` : "--"}
        />
      )}

      {feedback && (
        <Card className="border border-emerald-400/15 bg-slate-950/40">
          <CardTitle>Inteligibilidad</CardTitle>
          <CardDescription className="mt-2">
            Comparative intelligibility based on Gemini pronunciation analysis for the sentence you recorded.
          </CardDescription>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200">
              Score: {feedback.score}/100
            </span>
            <span className="rounded-full border border-white/10 bg-slate-900 px-4 py-2 text-sm text-slate-200">
              {feedback.score >= 85 ? "High intelligibility" : feedback.score >= 65 ? "Developing intelligibility" : "Needs reinforcement"}
            </span>
          </div>
          <p className="mt-4 text-sm text-slate-300">
            Target: <span className="text-white">{targetText}</span>
          </p>
          <p className="mt-2 text-sm text-slate-300">
            Gemini heard: <span className="text-white">{feedback.transcription || "[unclear]"}</span>
          </p>
        </Card>
      )}

      {feedback && (
        <SmartTranslationAssistant
          apiKey={apiKey}
          text={feedback.transcription || targetText}
          nativeLanguage={profile.nativeLanguage}
          targetLanguage={profile.targetLanguage}
          difficultWords={feedback.weak_points}
          title="Understand this practice result (translation and learning support)"
          description="Open this layer when you want a native-language translation, key vocabulary, word-by-word meaning, or spoken translation audio for the sentence you practiced."
        />
      )}

      {feedback?.next_recommended_exercise && (
        <Card>
          <CardTitle>Recommended next step</CardTitle>
          <p className="mt-4 text-sm text-slate-200">{feedback.next_recommended_exercise}</p>
        </Card>
      )}
    </div>
  );
}
