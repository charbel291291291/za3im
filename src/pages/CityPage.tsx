import { useState } from "react";
import { DistrictMap } from "@/components/game/DistrictMap";
import { OfflineModal } from "@/components/game/OfflineModal";
import { DailyRewardModal } from "@/components/game/DailyRewardModal";
import { ChallengeModal } from "@/components/game/ChallengeModal";
import { PrestigeModal } from "@/components/game/PrestigeModal";
import { LuckySpinModal } from "@/components/game/LuckySpinModal";
import { TreasureHuntModal } from "@/components/game/TreasureHuntModal";
import { useGame } from "@/game/GameContext";
import { DISTRICTS, getRandomChallenge, Challenge } from "@/game/gameData";
import { formatNumber } from "@/components/game/TopBar";
import { motion } from "framer-motion";
import { getLevelXP } from "@/game/gameData";
import { useAuth } from "@/auth/AuthContext";
import { getOrGenerateServerChallenge } from "@/game/aiChallenge";
import { rpcAnswerQuestion, loadProfile } from "@/lib/supabaseGameApi";
import { supabase } from "@/lib/supabaseClient";
import type { QuestionCategory } from "@/game/questionBank";
import { useI18n } from "@/i18n/I18nContext";

export default function CityPage() {
  const { state, dispatch, incomePerMinute } = useGame();
  const { user } = useAuth();
  const { t, isRTL } = useI18n();
  const [showOffline, setShowOffline] = useState(true);
  const [showDaily, setShowDaily] = useState(true);
  const [challenge, setChallenge] = useState<{
    challenge: Challenge;
    districtId: string;
  } | null>(null);
  const [showPrestige, setShowPrestige] = useState(false);
  const [showSpin, setShowSpin] = useState(false);
  const [showTreasure, setShowTreasure] = useState(false);

  const handleAttack = async (districtId: string) => {
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
        difficulty: state.challengeStats.currentDifficulty,
        category,
        avoidIds: state.challengeStats.recentQuestionIds,
      });
      setChallenge({ challenge: ch, districtId });
      return;
    }

    const ch = getRandomChallenge({
      difficulty: state.challengeStats.currentDifficulty,
      avoidIds: state.challengeStats.recentQuestionIds,
    });
    setChallenge({ challenge: ch, districtId });
  };

  const handleChallengeComplete = ({
    won,
    responseTimeMs,
    selectedAnswer,
  }: {
    won: boolean;
    responseTimeMs: number;
    selectedAnswer: number | null;
  }) => {
    if (!challenge) return;
    const dist = DISTRICTS.find((d) => d.id === challenge.districtId);
    if (user?.id) {
      void (async () => {
        await rpcAnswerQuestion({
          playerId: user.id,
          questionId: challenge.challenge.id,
          selectedAnswer: selectedAnswer ?? -1,
          responseTimeMs,
        });

        if (won) {
          await supabase
            .from("player_districts")
            .upsert(
              { player_id: user.id, district_id: challenge.districtId },
              { onConflict: "player_id,district_id" },
            );
        }

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
              capturedDistricts: won
                ? Array.from(
                    new Set([...state.capturedDistricts, challenge.districtId]),
                  )
                : state.capturedDistricts,
            },
          });
        }

        if (won) {
          dispatch({
            type: "CHALLENGE_WIN",
            reward: 0,
            xp: 0,
            challengeId: challenge.challenge.id,
            difficulty: challenge.challenge.difficulty,
            category: challenge.challenge.category,
            responseTimeMs,
          });
        } else {
          dispatch({
            type: "CHALLENGE_LOSE",
            penalty: 0,
            challengeId: challenge.challenge.id,
            difficulty: challenge.challenge.difficulty,
            category: challenge.challenge.category,
            responseTimeMs,
          });
        }

        setChallenge(null);
      })();
      return;
    }
    if (won && dist) {
      dispatch({
        type: "CHALLENGE_WIN",
        reward: challenge.challenge.reward,
        xp: 50,
        challengeId: challenge.challenge.id,
        difficulty: challenge.challenge.difficulty,
        category: challenge.challenge.category,
        responseTimeMs,
      });
      dispatch({
        type: "CAPTURE_DISTRICT",
        districtId: challenge.districtId,
        reward: dist.captureReward,
      });
    } else {
      dispatch({
        type: "CHALLENGE_LOSE",
        penalty: 50,
        challengeId: challenge.challenge.id,
        difficulty: challenge.challenge.difficulty,
        category: challenge.challenge.category,
        responseTimeMs,
      });
    }
    setChallenge(null);
  };

  const xpNeeded = getLevelXP(state.level);
  const xpProgress = Math.min(100, (state.xp / xpNeeded) * 100);
  const activeEvent =
    state.globalEvent && state.globalEvent.endsAt > Date.now()
      ? state.globalEvent
      : null;

  return (
    <div className={`pb-4 space-y-4 ${isRTL ? "text-right" : "text-left"}`}>
      {/* Hero */}
      <div className="px-4 pt-2">
        <motion.div
          className="bg-surface rounded-2xl p-5 shadow-card border border-border"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-3">
            <h1 className="font-display text-2xl font-black text-foreground">
              {t("pages.gameTitle")} <span className="text-gold">🇱🇧</span>
            </h1>
            <p className="text-xs text-muted-foreground font-body">
              {t("pages.gameSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-muted rounded-xl p-2">
              <div className="text-lg font-display font-bold text-gold">
                {formatNumber(state.coins)}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {t("profile.coins")}
              </div>
            </div>
            <div className="bg-muted rounded-xl p-2">
              <div className="text-lg font-display font-bold text-cedar">
                {state.capturedDistricts.length}/{DISTRICTS.length}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {t("stats.districtsControlled")}
              </div>
            </div>
            <div className="bg-muted rounded-xl p-2">
              <div className="text-lg font-display font-bold text-foreground">
                {state.reputation}
              </div>
              <div className="text-[10px] text-muted-foreground">Rep</div>
            </div>
          </div>

          {/* XP Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Level {state.level}</span>
              <span>
                {state.xp}/{xpNeeded} XP
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-gold rounded-full"
                animate={{ width: `${xpProgress}%` }}
                transition={{ type: "spring" }}
              />
            </div>
          </div>

          <div className="text-center mt-2 text-xs text-cedar">
            💰 Earning {formatNumber(incomePerMinute)} coins/min
          </div>

          {activeEvent && (
            <div className="mt-3 bg-gold/10 border border-gold/30 rounded-xl p-3 text-center">
              <div className="text-[10px] text-muted-foreground font-display">
                Limited-time event
              </div>
              <div className="mt-1 text-xs text-gold font-display font-bold">
                {activeEvent.type === "double_income"
                  ? "💥 Double Income"
                  : activeEvent.type === "challenge_frenzy"
                    ? "⚡ Challenge Frenzy"
                    : "🗝️ Treasure Rush"}
              </div>
            </div>
          )}

          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              onClick={() => setShowPrestige(true)}
              className="px-4 py-2 rounded-lg bg-muted text-foreground font-display text-xs font-bold active:scale-95 transition-transform"
            >
              🌟 Prestige
              <span className="text-muted-foreground font-body ml-2">
                P{state.prestigeLevel}
              </span>
            </button>
            <button
              onClick={() => setShowSpin(true)}
              className="px-4 py-2 rounded-lg bg-muted text-foreground font-display text-xs font-bold active:scale-95 transition-transform"
            >
              🎡 Spin
              <span className="text-muted-foreground font-body ml-2">
                {state.lastSpinDate === new Date().toDateString() &&
                state.spinsToday === 0
                  ? "Free"
                  : ""}
              </span>
            </button>
          </div>

          <div className="mt-2 flex items-center justify-center gap-2">
            <button
              onClick={() => setShowTreasure(true)}
              className="px-4 py-2 rounded-lg bg-muted text-foreground font-display text-xs font-bold active:scale-95 transition-transform"
            >
              🗝️ Hunt
              <span className="text-muted-foreground font-body ml-2">
                {state.treasureHunt.claimedAt ? "Claimed" : ""}
              </span>
            </button>
            <button
              disabled={state.rareChests < 1}
              onClick={() => dispatch({ type: "OPEN_RARE_CHEST" })}
              className={`px-4 py-2 rounded-lg font-display text-xs font-bold transition-all
                ${
                  state.rareChests > 0
                    ? "bg-gradient-gold text-primary-foreground active:scale-95"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
            >
              🧰 Open ({state.rareChests})
            </button>
          </div>

          {state.lastLoot?.kind === "rare_chest" && (
            <div className="mt-3 bg-muted rounded-xl p-3">
              <div className="text-[10px] text-muted-foreground font-display">
                Rare Chest opened
              </div>
              <div className="mt-1 text-xs text-foreground font-display">
                +🪙 {formatNumber(state.lastLoot.coins)} · +💎{" "}
                {state.lastLoot.diamonds} · +🧰 {state.lastLoot.rareChests}
              </div>
              <button
                onClick={() => dispatch({ type: "CLEAR_LAST_LOOT" })}
                className="mt-2 w-full py-2 rounded-lg bg-background text-muted-foreground font-display text-xs font-bold active:scale-95 transition-transform"
              >
                Dismiss
              </button>
            </div>
          )}
        </motion.div>
      </div>

      <DistrictMap onAttack={handleAttack} />

      {/* Modals */}
      {showOffline && <OfflineModal onClose={() => setShowOffline(false)} />}
      {!showOffline && showDaily && (
        <DailyRewardModal onClose={() => setShowDaily(false)} />
      )}
      {challenge && (
        <ChallengeModal
          challenge={challenge.challenge}
          onComplete={handleChallengeComplete}
          onClose={() => setChallenge(null)}
        />
      )}
      <PrestigeModal
        open={showPrestige}
        onClose={() => setShowPrestige(false)}
      />
      <LuckySpinModal open={showSpin} onClose={() => setShowSpin(false)} />
      <TreasureHuntModal
        open={showTreasure}
        onClose={() => setShowTreasure(false)}
      />
    </div>
  );
}
