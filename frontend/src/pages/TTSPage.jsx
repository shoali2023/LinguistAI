import { useMemo, useState } from "react";

import AdvancedPanel from "../components/AdvancedPanel";
import AudioPlayer from "../components/AudioPlayer";
import InlineNotice from "../components/InlineNotice";
import PageHeader from "../components/PageHeader";
import { Button } from "../components/ui/button";
import { Card, CardDescription, CardTitle } from "../components/ui/card";
import { requestTTS } from "../services/api";
import { useSessionApiKey } from "../state/ApiKeyProvider";
import { useLearning } from "../state/LearningProvider";

const voices = ["Zephyr", "Puck", "Charon", "Kore", "Fenrir", "Leda"];
const styles = ["Neutral", "Professional", "Friendly", "Slow", "Energetic"];
const learningModes = ["Normal speed", "Slow pronunciation", "Word-by-word", "Friendly tutor", "Professional narrator"];
const generationTypes = [
  { value: "model_pronunciation", label: "Model pronunciation audio" },
  { value: "explanation_audio", label: "Explanation audio in native language" },
  { value: "minimal_pairs", label: "Minimal pair examples" }
];

export default function TTSPage() {
  const { apiKey } = useSessionApiKey();
  const { profile, t } = useLearning();
  const [text, setText] = useState("Welcome to LinguistAI. Let us practice speech with energy and clarity!");
  const [voice, setVoice] = useState("Kore");
  const [style, setStyle] = useState("Friendly");
  const [learningMode, setLearningMode] = useState("Friendly tutor");
  const [generationType, setGenerationType] = useState("model_pronunciation");
  const [audioData, setAudioData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const audioUrl = useMemo(() => {
    if (!audioData) {
      return null;
    }
    return `data:${audioData.mime_type};base64,${audioData.audio_base64}`;
  }, [audioData]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await requestTTS(apiKey, {
        text,
        voice,
        style,
        learning_mode: learningMode,
        generation_type: generationType,
        profile: {
          native_language: profile.nativeLanguage,
          target_language: profile.targetLanguage,
          interface_language: profile.interfaceLanguage,
          level: profile.level,
          learning_goal: profile.learningGoal,
          feedback_style: profile.feedbackStyle,
          preferred_voice_style: profile.preferredVoiceStyle,
          weak_points: []
        }
      });
      setAudioData(result);
    } catch (err) {
      if (err.errorType === "tts_quota_reached" && err.retryAfterSeconds) {
        setError(`TTS quota reached. Please wait ${err.retryAfterSeconds} seconds and try again.`);
      } else if (err.errorType === "tts_quota_reached") {
        setError("TTS quota reached. Please wait a moment and try again.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <PageHeader
            eyebrow="Voice Studio"
            title={t("pages.tts", "Personalized TTS Studio")}
            description="Start with the text you want to hear. Open the advanced voice options only when you need slower speech, tutor mode, or special pronunciation output."
          />
          <div className="space-y-2">
            <p className="text-sm font-medium text-white">What should the voice say?</p>
            <CardDescription>
              Write the sentence, explanation, or practice line you want LinguistAI to read aloud.
            </CardDescription>
          </div>
          <textarea
            className="min-h-40 w-full rounded-2xl border border-border bg-slate-950/60 p-4 text-sm text-white"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t("tts.textPlaceholder", "Type the script you want to hear...")}
          />
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <label className="space-y-2 text-sm">
              <span className="text-slate-300">{t("tts.voice", "Voice")}</span>
              <select className="w-full rounded-2xl border border-border bg-slate-950/60" value={voice} onChange={(event) => setVoice(event.target.value)}>
                {voices.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" disabled={!apiKey || loading || !text.trim()}>
              {loading ? "Creating voice sample..." : t("tts.speak", "Create voice sample")}
            </Button>
          </div>
          <AdvancedPanel title="Advanced voice options">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="text-slate-300">{t("tts.style", "Style")}</span>
                <select className="w-full rounded-2xl border border-border bg-slate-950/60" value={style} onChange={(event) => setStyle(event.target.value)}>
                  {styles.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-slate-300">{t("tts.learningMode", "Learning mode")}</span>
                <select className="w-full rounded-2xl border border-border bg-slate-950/60" value={learningMode} onChange={(event) => setLearningMode(event.target.value)}>
                  {learningModes.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm md:col-span-2">
                <span className="text-slate-300">{t("tts.generationType", "Generation type")}</span>
                <select className="w-full rounded-2xl border border-border bg-slate-950/60" value={generationType} onChange={(event) => setGenerationType(event.target.value)}>
                  {generationTypes.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.value === "model_pronunciation" ? "Model pronunciation audio" : item.value === "explanation_audio" ? "Explanation audio in the learner's language" : "Minimal pair practice examples"}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </AdvancedPanel>
          {error && <InlineNotice tone="error" title="We couldn’t generate the voice sample." description={error} />}
          {!apiKey && <InlineNotice tone="warning" title="Add your Gemini API key first" description={t("tts.addApiKey", "Add your Gemini API key in Settings before using text to voice (TTS).")} />}
        </form>
      </Card>

      <div className="space-y-6">
        <AudioPlayer audioUrl={audioUrl} title="Listen and review" description="Play the generated audio, check pacing, and regenerate only if you need a different style or learning mode." />
        {loading && <div className="skeleton h-64 w-full" />}
      </div>
    </div>
  );
}
