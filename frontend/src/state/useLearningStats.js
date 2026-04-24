import { useEffect, useState } from "react";

const STORAGE_KEY = "linguistai_learning_stats";

const defaultStats = {
  completedSessions: 0,
  lastScore: null,
  averageScore: null,
  weakPoints: [],
  recentPracticeHistory: [],
  recommendedNextPractice: "Generate a personalized pronunciation sentence."
};

export function useLearningStatsState() {
  const [stats, setStats] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultStats, ...JSON.parse(raw) } : defaultStats;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  }, [stats]);

  const resetStats = () => setStats(defaultStats);

  const updateFromPractice = (result, context = {}) => {
    setStats((current) => {
      const nextCompleted = current.completedSessions + 1;
      const nextAverage = current.averageScore == null
        ? result.score
        : Math.round(((current.averageScore * current.completedSessions) + result.score) / nextCompleted);
      const mergedWeakPoints = Array.from(
        new Set([...(current.weakPoints || []), ...(result.weak_points || [])])
      ).slice(0, 8);

      return {
        ...current,
        completedSessions: nextCompleted,
        lastScore: result.score,
        averageScore: nextAverage,
        weakPoints: mergedWeakPoints,
        recommendedNextPractice: result.next_recommended_exercise || current.recommendedNextPractice,
        recentPracticeHistory: [
          {
            timestamp: new Date().toISOString(),
            scenario: context.scenario || "General Practice",
            sentence: context.sentence || "",
            score: result.score,
            weakPoints: result.weak_points || []
          },
          ...(current.recentPracticeHistory || [])
        ].slice(0, 10)
      };
    });
  };

  return {
    stats,
    setStats,
    resetStats,
    updateFromPractice
  };
}
