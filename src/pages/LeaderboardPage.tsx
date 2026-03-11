import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BADGES, useGame } from "@/game/GameContext";
import { formatNumber } from "@/components/game/TopBar";
import { motion, AnimatePresence } from "framer-motion";
import { ChallengeModal } from "@/components/game/ChallengeModal";
import { Challenge, DifficultyTier, getRandomChallenge } from "@/game/gameData";
import { useAuth } from "@/auth/AuthContext";
import { loadLeaderboard } from "@/lib/supabaseGameApi";
import { supabase } from "@/lib/supabaseClient";
import { useI18n } from "@/i18n/I18nContext";

// Simulated leaderboard
type Leader = {
  id: string;
  name: string;
  wealth: number;
  districts: number;
  winRate: number;
  emoji: string;
  badges: string[];
};

const FAKE_LEADERS = [
  {
    id: "abu-steif",
    name: "Abu Steif",
    wealth: 2500000,
    districts: 5,
    winRate: 89,
    emoji: "👑",
    badges: ["millionaire", "warlord"],
  },
  {
    id: "nadia-k",
    name: "Nadia K",
    wealth: 1800000,
    districts: 4,
    winRate: 82,
    emoji: "🔥",
    badges: ["brainiac"],
  },
  {
    id: "tony-b",
    name: "Tony B",
    wealth: 1200000,
    districts: 4,
    winRate: 78,
    emoji: "💪",
    badges: ["tycoon"],
  },
  {
    id: "charbel-x",
    name: "Charbel X",
    wealth: 900000,
    districts: 3,
    winRate: 75,
    emoji: "🎯",
    badges: ["starter"],
  },
  {
    id: "rami-z",
    name: "Rami Z",
    wealth: 650000,
    districts: 3,
    winRate: 71,
    emoji: "⭐",
    badges: ["starter"],
  },
  {
    id: "ziad-m",
    name: "Ziad M",
    wealth: 400000,
    districts: 2,
    winRate: 68,
    emoji: "🏆",
    badges: [],
  },
  {
    id: "layla-s",
    name: "Layla S",
    wealth: 350000,
    districts: 2,
    winRate: 65,
    emoji: "💎",
    badges: [],
  },
  {
    id: "hassan-j",
    name: "Hassan J",
    wealth: 200000,
    districts: 1,
    winRate: 60,
    emoji: "🎲",
    badges: [],
  },
] satisfies Leader[];

export default function LeaderboardPage() {
  const { state, dispatch } = useGame();
  const { user } = useAuth();
  const { t, isRTL } = useI18n();
  const [now, setNow] = useState(() => Date.now());
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();
  const [remoteLeaders, setRemoteLeaders] = useState<Leader[] | null>(null);

  const [battle, setBattle] = useState<{
    rival: Leader;
    round: number;
    attackerPoints: number;
    defenderPoints: number;
    challenge: Challenge;
    askedIds: string[];
    difficulty: DifficultyTier;
  } | null>(null);

  const [battleResult, setBattleResult] = useState<{
    rival: Leader;
    won: boolean;
    attackerPoints: number;
    defenderPoints: number;
    coinsDelta: number;
  } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setRemoteLeaders(null);
      return;
    }

    let cancelled = false;

    const refresh = async () => {
      const { data } = await loadLeaderboard(50);
      if (cancelled) return;
      if (!Array.isArray(data)) {
        setRemoteLeaders(null);
        return;
      }
      const mapped: Leader[] = (data as Array<Record<string, unknown>>).map(
        (r) => {
          const idRaw =
            (typeof r.id === "string" && r.id) ||
            (typeof r.player_id === "string" && r.player_id) ||
            (typeof r.playerId === "string" && r.playerId) ||
            crypto.randomUUID();
          const nameRaw =
            (typeof r.name === "string" && r.name) ||
            (typeof r.username === "string" && r.username) ||
            "Player";
          const wealthRaw =
            (typeof r.wealth === "number" && r.wealth) ||
            (typeof r.total_earned === "number" && r.total_earned) ||
            0;
          const districtsRaw =
            (typeof r.districts === "number" && r.districts) ||
            (typeof r.district_count === "number" && r.district_count) ||
            0;
          const winRateRaw =
            (typeof r.win_rate === "number" && r.win_rate) ||
            (typeof r.winRate === "number" && r.winRate) ||
            0;
          const emojiRaw = (typeof r.emoji === "string" && r.emoji) || "🏆";
          const badgesRaw = r.badges ?? r.badge_ids;

          return {
            id: idRaw,
            name: nameRaw,
            wealth: wealthRaw,
            districts: districtsRaw,
            winRate: winRateRaw,
            emoji: emojiRaw,
            badges: Array.isArray(badgesRaw) ? (badgesRaw as string[]) : [],
          };
        },
      );
      setRemoteLeaders(mapped);
    };

    void refresh();

    const channel = supabase
      .channel("leaderboard_page")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leaderboard" },
        () => void refresh(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      channel.unsubscribe();
    };
  }, [user?.id]);

  const winRate =
    state.challengesWon + state.challengesLost > 0
      ? Math.round(
          (state.challengesWon / (state.challengesWon + state.challengesLost)) *
            100,
        )
      : 0;

  const allLeaders: Leader[] = useMemo(() => {
    const you: Leader = {
      id: "you",
      name: "You 🫵",
      wealth: state.totalEarned,
      districts: state.capturedDistricts.length,
      winRate,
      emoji: "🇱🇧",
      badges: state.badgeIds,
    };

    const base = remoteLeaders ?? FAKE_LEADERS;
    return [...base, you].sort((a, b) => b.wealth - a.wealth);
  }, [
    state.totalEarned,
    state.capturedDistricts.length,
    state.badgeIds,
    winRate,
    remoteLeaders,
  ]);

  const badgeEmoji = (badgeId: string) => BADGES[badgeId]?.emoji;
  const badgeRow = (badges: string[]) =>
    badges.map(badgeEmoji).filter(Boolean).join(" ");

  const getCooldownLeftMs = (rivalId: string) => {
    const until = state.pvpCooldowns[rivalId] ?? 0;
    return Math.max(0, until - now);
  };

  const startPvP = (rival: Leader) => {
    if (battle || battleResult) return;
    if (getCooldownLeftMs(rival.id) > 0) return;

    const difficulty = state.challengeStats.currentDifficulty;
    const challenge = getRandomChallenge({
      difficulty,
      avoidIds: state.challengeStats.recentQuestionIds,
    });

    setBattle({
      rival,
      round: 1,
      attackerPoints: 0,
      defenderPoints: 0,
      challenge,
      askedIds: [challenge.id],
      difficulty,
    });
  };

  const handlePvPRoundComplete = ({
    won,
    responseTimeMs,
    selectedAnswer: _selectedAnswer,
  }: {
    won: boolean;
    responseTimeMs: number;
    selectedAnswer: number | null;
  }) => {
    if (!battle) return;

    if (won) {
      dispatch({
        type: "CHALLENGE_WIN",
        reward: 0,
        xp: 0,
        challengeId: battle.challenge.id,
        difficulty: battle.challenge.difficulty,
        category: battle.challenge.category,
        responseTimeMs,
      });
    } else {
      dispatch({
        type: "CHALLENGE_LOSE",
        penalty: 0,
        challengeId: battle.challenge.id,
        difficulty: battle.challenge.difficulty,
        category: battle.challenge.category,
        responseTimeMs,
      });
    }

    const attackerPoints = battle.attackerPoints + (won ? 1 : 0);
    const defenderPoints = battle.defenderPoints + (won ? 0 : 1);

    if (battle.round < 3) {
      const nextChallenge = getRandomChallenge({
        difficulty: battle.difficulty,
        avoidIds: [
          ...state.challengeStats.recentQuestionIds,
          ...battle.askedIds,
        ],
      });

      setBattle({
        ...battle,
        round: battle.round + 1,
        attackerPoints,
        defenderPoints,
        challenge: nextChallenge,
        askedIds: [...battle.askedIds, nextChallenge.id],
      });
      return;
    }

    const cooldownUntil = Date.now() + 5 * 60 * 1000;
    const battleWon = attackerPoints > defenderPoints;

    if (battleWon) {
      const stealPercent = 0.05 + Math.random() * 0.05;
      const coinsStolen = Math.max(
        1,
        Math.floor(battle.rival.wealth * stealPercent),
      );
      dispatch({
        type: "PVP_WIN",
        rivalId: battle.rival.id,
        coinsStolen,
        cooldownUntil,
      });
      setBattleResult({
        rival: battle.rival,
        won: true,
        attackerPoints,
        defenderPoints,
        coinsDelta: coinsStolen,
      });
    } else {
      const penaltyCoins = Math.min(
        5000,
        Math.max(50, Math.floor(state.coins * 0.02)),
      );
      dispatch({
        type: "PVP_LOSE",
        rivalId: battle.rival.id,
        penaltyCoins,
        cooldownUntil,
      });
      setBattleResult({
        rival: battle.rival,
        won: false,
        attackerPoints,
        defenderPoints,
        coinsDelta: -penaltyCoins,
      });
    }

    setBattle(null);
  };

  return (
    <div className={`px-4 pb-4 space-y-3 ${isRTL ? "text-right" : "text-left"}`}>
      <h2 className="font-display text-xl text-gold">🏆 {t("pages.leaderboardTitle")}</h2>
      <p className="text-xs text-muted-foreground font-body">
        Top bosses in Lebanon
      </p>

      {allLeaders.map((leader, i) => {
        const isYou = leader.id === "you";
        const cooldownLeftMs = isYou ? 0 : getCooldownLeftMs(leader.id);
        const canAttack =
          !isYou && cooldownLeftMs <= 0 && !battle && !battleResult;
        return (
          <motion.div
            key={leader.name}
            className={`rounded-xl p-4 flex items-center gap-3 ${isYou ? "bg-gold/10 border border-gold/30" : "bg-surface"} shadow-card`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={isYou ? () => setShowProfile(true) : undefined}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm
              ${
                i === 0
                  ? "bg-gradient-gold text-primary-foreground"
                  : i === 1
                    ? "bg-muted text-foreground"
                    : i === 2
                      ? "bg-terracotta/20 text-terracotta"
                      : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            <span className="text-xl">{leader.emoji}</span>
            <div className="flex-1 min-w-0">
              <div
                className={`font-display font-bold text-sm truncate ${isYou ? "text-gold" : "text-foreground"}`}
              >
                {leader.name}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {leader.districts} districts · {leader.winRate}% wins
              </div>
              {leader.badges.length > 0 && (
                <div className="text-[10px] text-muted-foreground mt-1">
                  Badges:{" "}
                  <span className="text-foreground font-display">
                    {badgeRow(leader.badges)}
                  </span>
                </div>
              )}
            </div>
            <div className="text-right space-y-1">
              <div className="font-display text-sm font-bold text-gold">
                🪙 {formatNumber(leader.wealth)}
              </div>
              {!isYou && (
                <button
                  disabled={!canAttack}
                  onClick={() => startPvP(leader)}
                  className={`px-3 py-1 rounded-lg font-display text-[11px] font-bold transition-all
                    ${
                      canAttack
                        ? "bg-gradient-fire text-foreground active:scale-95"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    }`}
                >
                  {cooldownLeftMs > 0
                    ? `Cooldown ${Math.ceil(cooldownLeftMs / 60000)}m`
                    : "Attack"}
                </button>
              )}
            </div>
          </motion.div>
        );
      })}

      {battle && (
        <ChallengeModal
          challenge={battle.challenge}
          onComplete={handlePvPRoundComplete}
          onClose={() => setBattle(null)}
        />
      )}

      <AnimatePresence>
        {battleResult && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setBattleResult(null)}
            />
            <motion.div
              className="relative w-full max-w-sm bg-surface rounded-2xl border border-border p-5 shadow-raised"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
            >
              <div className="text-center">
                <div className="text-4xl mb-2">
                  {battleResult.won ? "🏴‍☠️" : "🛡️"}
                </div>
                <p className="font-display text-lg font-bold text-foreground">
                  {battleResult.won ? "Raid Success!" : "Defense Held!"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  You vs {battleResult.rival.name}
                </p>
              </div>

              <div className="mt-4 bg-muted rounded-xl p-4 text-center">
                <div className="text-sm text-muted-foreground font-body">
                  Attack {battleResult.attackerPoints} · Defense{" "}
                  {battleResult.defenderPoints}
                </div>
                <div className="font-display text-xl font-bold text-gold mt-2">
                  {battleResult.coinsDelta >= 0 ? "+" : "-"}🪙{" "}
                  {formatNumber(Math.abs(battleResult.coinsDelta))}
                </div>
              </div>

              <button
                onClick={() => setBattleResult(null)}
                className="mt-4 w-full py-3 rounded-xl bg-gradient-gold text-primary-foreground font-display font-bold active:scale-95 transition-transform shadow-gold"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProfile && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setShowProfile(false)}
            />
            <motion.div
              className="relative w-full max-w-sm bg-surface rounded-2xl border border-border p-5 shadow-raised"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
            >
              <div className="text-center">
                <div className="text-4xl mb-2">🫵</div>
                <p className="font-display text-lg font-bold text-foreground">
                  Your Profile
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Badges:{" "}
                  <span className="text-foreground font-display">
                    {state.badgeIds.length > 0
                      ? badgeRow(state.badgeIds)
                      : "None yet"}
                  </span>
                </p>
              </div>

              <div className="mt-4 bg-muted rounded-xl p-4">
                <div className="text-xs text-muted-foreground font-body">
                  Achievements unlocked:{" "}
                  <span className="text-foreground font-display">
                    {Object.keys(state.achievementsUnlockedAt).length}
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  {Object.entries(state.achievementsUnlockedAt).length > 0 ? (
                    Object.entries(state.achievementsUnlockedAt).map(
                      ([id, ts]) => (
                        <div
                          key={id}
                          className="flex items-center justify-between text-[11px]"
                        >
                          <span className="text-foreground font-display">
                            {id}
                          </span>
                          <span className="text-muted-foreground">
                            {new Date(ts).toLocaleDateString()}
                          </span>
                        </div>
                      ),
                    )
                  ) : (
                    <div className="text-[11px] text-muted-foreground">
                      Play more to unlock achievements.
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setShowProfile(false)}
                className="mt-4 w-full py-3 rounded-xl bg-gradient-gold text-primary-foreground font-display font-bold active:scale-95 transition-transform shadow-gold"
              >
                Close
              </button>

              <button
                onClick={() => {
                  setShowProfile(false);
                  navigate("/social");
                }}
                className="mt-2 w-full py-3 rounded-xl bg-muted text-foreground font-display font-bold active:scale-95 transition-transform"
              >
                Challenge Friends
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
