import ContrastiveInsightCard from "./ContrastiveInsightCard";
import MetricCard from "./MetricCard";
import { Card, CardDescription, CardTitle } from "./ui/card";
import { useLearning } from "../state/LearningProvider";

const statusClassMap = {
  correct: "bg-emerald-500/15 text-emerald-300",
  wrong: "bg-red-500/15 text-red-300",
  missing: "bg-slate-500/20 text-slate-300"
};

export default function PronunciationResult({ result, contrastiveTitle }) {
  const { t } = useLearning();
  if (!result) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label={t("common.score", "Score")} value={result.score} />
        <MetricCard label={t("common.fluency", "Fluency")} value={result.fluency} />
        <MetricCard label={t("common.accuracy", "Accuracy")} value={result.accuracy} />
        <MetricCard label={t("common.rhythm", "Rhythm")} value={result.rhythm} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardTitle>{t("pronunciation.wordLevel", "Word-Level Feedback")}</CardTitle>
          <div className="mt-4 flex flex-wrap gap-2">
            {result.overlay_tokens?.map((item, index) => (
              <span key={`${item.token}-${index}`} className={`rounded-full px-3 py-1 text-sm ${statusClassMap[item.status] || statusClassMap.missing}`}>
                {item.token}
              </span>
            ))}
          </div>
          <div className="mt-5 space-y-2 text-sm text-slate-300">
            <p><span className="font-semibold text-white">{t("pronunciation.transcription", "Transcription")}:</span> {result.transcription}</p>
            <p><span className="font-semibold text-white">{t("pronunciation.nativeFeedback", "Native-language feedback")}:</span> {result.native_language_feedback}</p>
            <p><span className="font-semibold text-white">{t("pronunciation.targetTip", "Target-language tip")}:</span> {result.target_language_tip}</p>
            <p><span className="font-semibold text-white">{t("pronunciation.contrastiveTip", "Contrastive tip")}:</span> {result.contrastive_tip}</p>
            <p><span className="font-semibold text-white">{t("pronunciation.encouragement", "Encouragement")}:</span> {result.encouragement}</p>
          </div>
          <CardDescription className="mt-4">
            {t("pronunciation.missingWords", "Missing words")}: {result.missing_words?.join(", ") || "None"} | {t("pronunciation.weakPoints", "Weak points")}: {result.weak_points?.join(", ") || "None"}
          </CardDescription>
        </Card>
        <ContrastiveInsightCard title={contrastiveTitle} insight={result.contrastive_insight} />
      </div>
    </div>
  );
}
