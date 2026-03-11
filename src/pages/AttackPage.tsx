import { useState } from "react";
import { useGame } from "@/game/GameContext";
import { getRandomChallenge, Challenge, DifficultyTier } from "@/game/gameData";
import { ChallengeModal } from "@/components/game/ChallengeModal";
import { motion } from "framer-motion";
import { useAuth } from "@/auth/AuthContext";
import { getOrGenerateServerChallenge } from "@/game/aiChallenge";
import { loadProfile, rpcAnswerQuestion } from "@/lib/supabaseGameApi";
import type { QuestionCategory } from "@/game/questionBank";
import { useI18n } from "@/i18n/I18nContext";

export default function AttackPage() {
  const { state, dispatch } = useGame();
  const { user } = useAuth();
  const { t, isRTL } = useI18n();
  const [challenge, setChallenge] = useState<Challenge | null>(null);

  const startChallenge = async (difficulty: DifficultyTier) => {
    const baseDifficulty = difficulty;
    const adjustedDifficulty =
      state.challengeStats.totalAnswered >= 5 &&
      state.challengeStats.successRate > 0.8
        ? baseDifficulty === "expert"
          ? "expert"
          : baseDifficulty === "hard"
            ? "expert"
            : baseDifficulty === "medium"
              ? "hard"
              : "medium"
        : state.challengeStats.totalAnswered >= 5 &&
            state.challengeStats.successRate < 0.5
          ? baseDifficulty === "easy"
            ? "easy"
            : baseDifficulty === "medium"
              ? "easy"
              : baseDifficulty === "hard"
                ? "medium"
                : "hard"
          : baseDifficulty;

    if (user?.id) {
      const recentCategories = state.challengeStats.recentQuestionCategories;
      const counts = recentCategories.reduce(
        (acc, c) => ({ ...acc, [c]: (acc[c] ?? 0) + 1 }),
        {} as Record<string, number>,
      );
      const pool: QuestionCategory[] = [
        "General Knowledge",
        "Logic",
        "Math",
        "Riddle",
        "Pattern",
        "Quick-thinking",
        "Science",
        "History",
        "Geography",
        "Technology",
        "Pop culture",
      ];
      pool.sort((a, b) => (counts[a] ?? 0) - (counts[b] ?? 0));
      const category = pool[0];
      const ch = await getOrGenerateServerChallenge({
        playerId: user.id,
        difficulty: adjustedDifficulty,
        category,
        avoidIds: state.challengeStats.recentQuestionIds,
      });
      setChallenge(ch);
      return;
    }

    setChallenge(
      getRandomChallenge({
        difficulty: adjustedDifficulty,
        avoidIds: state.challengeStats.recentQuestionIds,
      }),
    );
  };

  const handleComplete = ({
    won,
    responseTimeMs,
    selectedAnswer,
  }: {
    won: boolean;
    responseTimeMs: number;
    selectedAnswer: number | null;
  }) => {
    if (!challenge) return;
    if (user?.id) {
      void (async () => {
        await rpcAnswerQuestion({
          playerId: user.id,
          questionId: challenge.id,
          selectedAnswer: selectedAnswer ?? -1,
          responseTimeMs,
        });

        const prof = await loadProfile(user.id);
        if (prof.data) {
          dispatch({
            type: "LOAD_STATE",
            state: {
              ...state,
              coins: prof.data.coins ?? state.coins,
              diamonds: prof.data.diamonds ?? state.diamonds,
              level: prof.data.level ?? state.level,
              xp: prof.data.xp ?? state.xp,
              reputation: prof.data.reputation ?? state.reputation,
              totalEarned: prof.data.total_earned ?? state.totalEarned,
              dailyStreak: prof.data.daily_streak ?? state.dailyStreak,
              lastDailyClaimDate:
                prof.data.last_daily_claim_date ?? state.lastDailyClaimDate,
            },
          });
        }

        dispatch(
          won
            ? {
                type: "CHALLENGE_WIN",
                reward: 0,
                xp: 0,
                challengeId: challenge.id,
                difficulty: challenge.difficulty,
                category: challenge.category,
                responseTimeMs,
              }
            : {
                type: "CHALLENGE_LOSE",
                penalty: 0,
                challengeId: challenge.id,
                difficulty: challenge.difficulty,
                category: challenge.category,
                responseTimeMs,
              },
        );

        setChallenge(null);
      })();
      return;
    }

    if (won) {
      const xp =
        challenge.difficulty === "easy"
          ? 20
          : challenge.difficulty === "medium"
            ? 40
            : challenge.difficulty === "hard"
              ? 80
              : 150;
      dispatch({
        type: "CHALLENGE_WIN",
        reward: challenge.reward,
        xp,
        challengeId: challenge.id,
        difficulty: challenge.difficulty,
        category: challenge.category,
        responseTimeMs,
      });
    } else {
      const id = challenge?.id ?? "unknown";
      const difficulty = challenge?.difficulty ?? "easy";
      dispatch({
        type: "CHALLENGE_LOSE",
        penalty: 25,
        challengeId: id,
        difficulty,
        category: challenge?.category ?? "General Knowledge",
        responseTimeMs,
      });
    }
    setChallenge(null);
  };

  const difficulties = [
    {
      level: "easy" as const,
      emoji: "🟢",
      label: "Street Hustle",
      desc: "Easy questions, steady rewards",
      reward: "100",
    },
    {
      level: "medium" as const,
      emoji: "🟡",
      label: "District Wars",
      desc: "Medium difficulty, bigger rewards",
      reward: "250",
    },
    {
      level: "hard" as const,
      emoji: "🔴",
      label: "Boss Battle",
      desc: "Hard challenges, massive rewards",
      reward: "600",
      minLevel: 10,
    },
    {
      level: "expert" as const,
      emoji: "🟣",
      label: "Mastermind",
      desc: "Expert puzzles, elite rewards",
      reward: "1200",
      minLevel: 20,
    },
  ];

  return (
    <div
      className={`px-4 pb-4 space-y-4 ${isRTL ? "text-right" : "text-left"}`}
    >
      <h2 className="font-display text-xl text-gold">
        ⚔️ {t("pages.attackTitle")}
      </h2>
      <p className="text-xs text-muted-foreground font-body">
        Answered: {state.challengeStats.totalAnswered} | Success:{" "}
        {Math.round(state.challengeStats.successRate * 100)}% | Avg:{" "}
        {state.challengeStats.totalAnswered > 0
          ? (state.challengeStats.averageResponseTimeMs / 1000).toFixed(1)
          : "0.0"}
        s | Tier: {state.challengeStats.currentDifficulty}
      </p>

      {difficulties.map((d, i) => {
        const locked = d.minLevel ? state.level < d.minLevel : false;
        return (
          <motion.div
            key={d.level}
            className={`rounded-xl p-5 shadow-card border border-border ${locked ? "bg-muted opacity-50" : "bg-surface"}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{d.emoji}</span>
              <div className="flex-1">
                <div className="font-display font-bold text-foreground">
                  {d.label}
                </div>
                <div className="text-xs text-muted-foreground">{d.desc}</div>
                <div className="text-xs text-gold mt-1">
                  🪙 {d.reward} coins
                </div>
              </div>
              <button
                disabled={locked}
                onClick={() => startChallenge(d.level)}
                className={`px-5 py-2.5 rounded-xl font-display font-bold text-sm transition-all
                  ${
                    locked
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-gradient-fire text-foreground active:scale-95 shadow-card"
                  }`}
              >
                {locked ? `Lv.${d.minLevel}` : "Fight!"}
              </button>
            </div>
          </motion.div>
        );
      })}

      {challenge && (
        <ChallengeModal
          challenge={challenge}
          onComplete={handleComplete}
          onClose={() => setChallenge(null)}
        />
      )}
    </div>
  );
}
