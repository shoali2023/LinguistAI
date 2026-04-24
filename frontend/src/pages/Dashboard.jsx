import { AudioLines, Mic2, Speech, Theater } from "lucide-react";
import { Link } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import MetricCard from "../components/MetricCard";
import ProfileSummaryCard from "../components/ProfileSummaryCard";
import { Button } from "../components/ui/button";
import { Card, CardDescription, CardTitle } from "../components/ui/card";
import { useLearning } from "../state/LearningProvider";

export default function Dashboard() {
  const { profile, stats, t } = useLearning();
  const quickActions = [
    { to: "/practice", label: t("dashboard.startPractice", "Start Pronunciation Practice"), icon: Mic2 },
    { to: "/scenario", label: t("dashboard.generateScenario", "Generate Scenario Practice"), icon: Theater },
    { to: "/tts", label: t("dashboard.openTts", "Open TTS Studio"), icon: Speech },
    { to: "/stt", label: t("dashboard.analyzeSpeech", "Analyze Speech"), icon: AudioLines }
  ];

  return (
    <div className="space-y-6">
      <section className="panel overflow-hidden p-6 md:p-8">
        <PageHeader
          eyebrow="Learning Overview"
          title={t("dashboard.heading", "Adaptive Learning Command Center")}
          description="See your current setup, recent speaking progress, and the next best action in one clear overview."
        />
      </section>
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label={t("dashboard.lastScore", "Last Fluency Score")} value={stats.lastScore ?? "--"} />
        <MetricCard label={t("dashboard.completedSessions", "Completed Sessions")} value={stats.completedSessions} />
        <MetricCard label={t("dashboard.averageScore", "Average Score")} value={stats.averageScore ?? "--"} />
        <MetricCard label={t("dashboard.recommendedNext", "Recommended Next Practice")} value={stats.recommendedNextPractice || "--"} />
      </section>
      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ProfileSummaryCard
          title={t("dashboard.learnerProfile", "Learner Profile")}
          rows={[
            { label: t("dashboard.nativeLanguage", "Native / Interface Language"), value: `${profile.nativeLanguage || "--"} / ${profile.interfaceLanguage || "--"}` },
            { label: t("dashboard.targetLanguage", "Target Language"), value: profile.targetLanguage || "--" },
            { label: t("dashboard.level", "Level"), value: profile.level || "--" },
            { label: t("dashboard.goal", "Learning Goal"), value: profile.learningGoal || "--" }
          ]}
        />
        <Card>
          <CardTitle>{t("dashboard.quickStart", "Quick Actions")}</CardTitle>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {quickActions.map(({ to, label, icon: Icon }) => (
              <Button key={to} asChild variant="secondary" className="justify-start">
                <Link to={to}>
                  <Icon className="mr-2 h-4 w-4" />
                  {label}
                </Link>
              </Button>
            ))}
          </div>
          <div className="mt-5">
            <p className="text-sm font-semibold text-white">{t("dashboard.weakPoints", "Main Weak Points")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(stats.weakPoints || []).length > 0 ? (
                stats.weakPoints.map((point) => (
                  <span key={point} className="rounded-full bg-red-500/15 px-3 py-1 text-sm text-red-200">
                    {point}
                  </span>
                ))
              ) : (
                <CardDescription>{t("common.emptyState", "No data yet. Start a learning activity to populate this workspace.")}</CardDescription>
              )}
            </div>
          </div>
          <div className="mt-5">
            <p className="text-sm font-semibold text-white">{t("dashboard.recentPractice", "Recent Practice")}</p>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              {(stats.recentPracticeHistory || []).slice(0, 3).map((item) => (
                <div key={item.timestamp} className="rounded-2xl bg-slate-950/50 p-3">
                  <p className="font-medium text-white">{item.scenario}</p>
                  <p className="mt-1">{item.sentence}</p>
                  <p className="mt-1 text-cyan-200">{t("dashboard.scoreLabel", "Score")}: {item.score}</p>
                </div>
              ))}
              {(stats.recentPracticeHistory || []).length === 0 && (
                <CardDescription>{t("common.emptyState", "No data yet. Start a learning activity to populate this workspace.")}</CardDescription>
              )}
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
