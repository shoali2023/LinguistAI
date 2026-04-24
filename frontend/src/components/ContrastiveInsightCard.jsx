import { Card, CardDescription, CardTitle } from "./ui/card";
import { useLearning } from "../state/LearningProvider";

export default function ContrastiveInsightCard({ title, insight }) {
  const { t } = useLearning();
  if (!insight) {
    return null;
  }

  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <div className="mt-4 space-y-3 text-sm text-slate-200">
        <p><span className="font-semibold text-white">{t("common.issue", "Issue")}:</span> {insight.issue}</p>
        <p><span className="font-semibold text-white">{t("common.why", "Why")}:</span> {insight.why_it_happens}</p>
        <p><span className="font-semibold text-white">{t("common.howToPractice", "How to practice")}:</span> {insight.how_to_practice}</p>
        <p><span className="font-semibold text-white">{t("common.example", "Example")}:</span> {insight.example}</p>
      </div>
      <CardDescription className="mt-4">
        {t("practice.coachNote", "This card connects the learner's native-language habits to the target-language pronunciation challenge.")}
      </CardDescription>
    </Card>
  );
}
