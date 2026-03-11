import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useGame, BADGES, SKINS } from "@/game/GameContext";
import { getLevelXP } from "@/game/gameData";
import { formatNumber } from "@/components/game/TopBar";
import { useI18n } from "@/i18n/I18nContext";
import { loadLeaderboard, loadProfile } from "@/lib/supabaseGameApi";
import { supabase } from "@/lib/supabaseClient";

type ProfileCosmetics = {
  avatar: string;
  frame: "gold" | "neon" | "diamond" | "cedar";
  badgeId: string | null;
};

function cosmeticsKey(userId: string) {
  return `profile_cosmetics:${userId}`;
}

function loadCosmetics(
  userId: string,
  fallbackBadgeId: string | null,
): ProfileCosmetics {
  const raw = localStorage.getItem(cosmeticsKey(userId));
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<ProfileCosmetics>;
      const avatar = typeof parsed.avatar === "string" ? parsed.avatar : "😎";
      const frame =
        parsed.frame === "gold" ||
        parsed.frame === "neon" ||
        parsed.frame === "diamond" ||
        parsed.frame === "cedar"
          ? parsed.frame
          : "gold";
      const badgeId =
        typeof parsed.badgeId === "string" ? parsed.badgeId : fallbackBadgeId;
      return { avatar, frame, badgeId: badgeId ?? null };
    } catch {
      localStorage.removeItem(cosmeticsKey(userId));
    }
  }
  return { avatar: "😎", frame: "gold", badgeId: fallbackBadgeId };
}

function saveCosmetics(userId: string, next: ProfileCosmetics) {
  localStorage.setItem(cosmeticsKey(userId), JSON.stringify(next));
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { state, dispatch } = useGame();
  const { t, isRTL } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [leaderboardRank, setLeaderboardRank] = useState<number | null>(null);
  const [remoteUsername, setRemoteUsername] = useState<string | null>(null);
  const [remoteCoins, setRemoteCoins] = useState<number | null>(null);
  const [remoteDiamonds, setRemoteDiamonds] = useState<number | null>(null);
  const [cosmetics, setCosmetics] = useState<ProfileCosmetics | null>(null);
  const [savingCosmetics, setSavingCosmetics] = useState(false);

  const xpNeeded = getLevelXP(state.level);
  const xpProgress = Math.min(100, (state.xp / xpNeeded) * 100);

  const displayedUsername = useMemo(() => {
    if (remoteUsername) return remoteUsername;
    if (user?.email) return user.email.split("@")[0];
    return "Boss";
  }, [remoteUsername, user?.email]);

  const displayedCoins = remoteCoins ?? state.coins;
  const displayedDiamonds = remoteDiamonds ?? state.diamonds;

  const unlockedBadges = useMemo(() => {
    return state.badgeIds
      .map((id) => ({ id, def: BADGES[id] }))
      .filter((b) => Boolean(b.def));
  }, [state.badgeIds]);

  const selectedBadge = useMemo(() => {
    const badgeId = cosmetics?.badgeId ?? null;
    if (!badgeId) return null;
    const def = BADGES[badgeId];
    return def ? { id: badgeId, ...def } : null;
  }, [cosmetics?.badgeId]);

  useEffect(() => {
    if (!user?.id) return;
    setCosmetics(loadCosmetics(user.id, state.badgeIds[0] ?? null));
  }, [user?.id, state.badgeIds]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const [profileRes, leadersRes] = await Promise.all([
        loadProfile(user.id),
        loadLeaderboard(200),
      ]);

      if (cancelled) return;
      setLoading(false);

      if (profileRes.data) {
        const username =
          typeof profileRes.data.username === "string"
            ? profileRes.data.username
            : null;
        setRemoteUsername(
          username && username.trim().length > 0 ? username : null,
        );
        setRemoteCoins(
          typeof profileRes.data.coins === "number"
            ? profileRes.data.coins
            : null,
        );
        setRemoteDiamonds(
          typeof profileRes.data.diamonds === "number"
            ? profileRes.data.diamonds
            : null,
        );
      }

      if (Array.isArray(leadersRes.data)) {
        const idx = (
          leadersRes.data as Array<Record<string, unknown>>
        ).findIndex((r) => {
          const pid =
            (typeof r.player_id === "string" && r.player_id) ||
            (typeof r.id === "string" && r.id) ||
            null;
          return pid === user.id;
        });
        setLeaderboardRank(idx >= 0 ? idx + 1 : null);
      }
    })();

    const channel = supabase
      .channel("profile_page")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        () => {
          void (async () => {
            const res = await loadProfile(user.id);
            if (!res.data) return;
            setRemoteCoins(
              typeof res.data.coins === "number" ? res.data.coins : null,
            );
            setRemoteDiamonds(
              typeof res.data.diamonds === "number" ? res.data.diamonds : null,
            );
          })();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      channel.unsubscribe();
    };
  }, [user?.id]);

  if (!user) {
    return (
      <div
        className={`px-4 pb-4 space-y-4 ${isRTL ? "text-right" : "text-left"}`}
      >
        <h2 className="font-display text-xl text-gold">{t("profile.title")}</h2>
        <div className="bg-surface rounded-2xl p-5 shadow-card border border-border">
          <div className="text-sm text-muted-foreground font-body">
            {t("common.loginToContinue")}
          </div>
          <button
            onClick={() => navigate("/auth")}
            className="mt-4 w-full py-3 rounded-xl bg-gradient-gold text-primary-foreground font-display font-bold active:scale-95 transition-transform"
          >
            {t("topbar.login")}
          </button>
        </div>
      </div>
    );
  }

  const frameClass =
    cosmetics?.frame === "diamond"
      ? "ring-2 ring-diamond/70"
      : cosmetics?.frame === "neon"
        ? "ring-2 ring-fuchsia-400/70"
        : cosmetics?.frame === "cedar"
          ? "ring-2 ring-cedar/70"
          : "ring-2 ring-gold/60";

  return (
    <div
      className={`px-4 pb-4 space-y-4 ${isRTL ? "text-right" : "text-left"}`}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-gold">{t("profile.title")}</h2>
        <button
          onClick={() => navigate(-1)}
          className="text-[10px] px-2.5 py-1 rounded-full bg-muted text-foreground font-display font-bold active:scale-95 transition-transform"
        >
          {t("common.back")}
        </button>
      </div>

      <div className="bg-surface rounded-2xl p-5 shadow-card border border-border">
        <div className="flex items-center gap-4">
          <div
            className={`w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-3xl ${frameClass}`}
          >
            {cosmetics?.avatar ?? "😎"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="font-display font-bold text-foreground text-lg">
                {displayedUsername}
              </div>
              {selectedBadge && (
                <div className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-display text-foreground">
                  {selectedBadge.emoji} {selectedBadge.label}
                </div>
              )}
            </div>
            <div className="mt-1 text-xs text-muted-foreground font-body">
              {t("profile.rank")}:{" "}
              <span className="text-foreground font-display font-bold">
                {leaderboardRank ? `#${leaderboardRank}` : "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="bg-muted rounded-xl p-3">
            <div className="text-sm font-display font-bold text-foreground">
              {state.level}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {t("profile.level")}
            </div>
          </div>
          <div className="bg-muted rounded-xl p-3">
            <div className="text-sm font-display font-bold text-foreground">
              {formatNumber(displayedCoins)}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {t("profile.coins")}
            </div>
          </div>
          <div className="bg-muted rounded-xl p-3">
            <div className="text-sm font-display font-bold text-foreground">
              {displayedDiamonds}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {t("profile.diamonds")}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>
              {t("profile.xp")}: {state.xp}/{xpNeeded}
            </span>
            <span>
              {t("profile.prestige")}: {state.prestigeLevel}
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-2 bg-gradient-gold"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-2xl p-5 shadow-card border border-border">
        <div className="font-display font-bold text-foreground">
          {t("profile.statistics")}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="bg-muted rounded-xl p-3">
            <div className="text-sm font-display font-bold text-foreground">
              {
                Object.values(state.businessLevels).filter((lvl) => lvl > 0)
                  .length
              }
            </div>
            <div className="text-[10px] text-muted-foreground">
              {t("stats.businessesOwned")}
            </div>
          </div>
          <div className="bg-muted rounded-xl p-3">
            <div className="text-sm font-display font-bold text-foreground">
              {formatNumber(state.totalEarned)}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {t("stats.totalIncome")}
            </div>
          </div>
          <div className="bg-muted rounded-xl p-3">
            <div className="text-sm font-display font-bold text-foreground">
              {state.challengesWon}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {t("stats.battlesWon")}
            </div>
          </div>
          <div className="bg-muted rounded-xl p-3">
            <div className="text-sm font-display font-bold text-foreground">
              {state.challengesLost}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {t("stats.battlesLost")}
            </div>
          </div>
          <div className="bg-muted rounded-xl p-3">
            <div className="text-sm font-display font-bold text-foreground">
              {state.challengeStats.correctAnswers}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {t("stats.correctAnswers")}
            </div>
          </div>
          <div className="bg-muted rounded-xl p-3">
            <div className="text-sm font-display font-bold text-foreground">
              {Math.round(state.challengeStats.successRate * 100)}%
            </div>
            <div className="text-[10px] text-muted-foreground">
              {t("stats.accuracy")}
            </div>
          </div>
          <div className="bg-muted rounded-xl p-3 col-span-2">
            <div className="text-sm font-display font-bold text-foreground">
              {state.capturedDistricts.length}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {t("stats.districtsControlled")}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-2xl p-5 shadow-card border border-border">
        <div className="font-display font-bold text-foreground">
          {t("profile.achievements")}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {unlockedBadges.length === 0 ? (
            <div className="text-xs text-muted-foreground font-body col-span-2">
              —
            </div>
          ) : (
            unlockedBadges.map(({ id, def }) => (
              <div
                key={id}
                className="bg-muted rounded-xl p-3 flex items-center gap-2"
              >
                <div className="text-xl">{def.emoji}</div>
                <div className="text-xs font-display text-foreground">
                  {def.label}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-surface rounded-2xl p-5 shadow-card border border-border">
        <div className="font-display font-bold text-foreground">
          {t("profile.inventory")}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="bg-muted rounded-xl p-3">
            <div className="text-sm font-display font-bold text-foreground">
              {state.rareChests}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {t("stats.rareChests")}
            </div>
          </div>
          <div className="bg-muted rounded-xl p-3">
            <div className="text-sm font-display font-bold text-foreground">
              {state.unlockedSkinIds.length}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {t("stats.cosmetics")}
            </div>
          </div>
          <div className="bg-muted rounded-xl p-3 col-span-2">
            <div className="text-[10px] text-muted-foreground mb-2">
              {t("stats.skins")}
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SKINS)
                .filter(([id]) => state.unlockedSkinIds.includes(id))
                .map(([id, skin]) => (
                  <button
                    key={id}
                    onClick={() => dispatch({ type: "SET_SKIN", skinId: id })}
                    className={`px-3 py-1 rounded-full text-[10px] font-display font-bold transition-all ${
                      state.selectedSkinId === id
                        ? "bg-gradient-gold text-primary-foreground"
                        : "bg-background text-foreground"
                    }`}
                  >
                    {skin.emoji} {skin.label}
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-2xl p-5 shadow-card border border-border">
        <div className="flex items-center justify-between">
          <div className="font-display font-bold text-foreground">
            {t("profile.customization")}
          </div>
          {loading && (
            <div className="text-[10px] text-muted-foreground">
              {t("common.loading")}
            </div>
          )}
        </div>

        <div className="mt-3 space-y-3">
          <div>
            <div className="text-[10px] text-muted-foreground">
              {t("profile.avatar")}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {["😎", "🥷", "👑", "🦊", "🦁", "🐍", "🧠", "🕶️"].map((a) => (
                <button
                  key={a}
                  onClick={() =>
                    setCosmetics((c) => (c ? { ...c, avatar: a } : c))
                  }
                  className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl active:scale-95 transition-transform ${
                    cosmetics?.avatar === a
                      ? "ring-2 ring-gold/70"
                      : "ring-1 ring-border"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-muted-foreground">
              {t("profile.frame")}
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {(["gold", "cedar", "neon", "diamond"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() =>
                    setCosmetics((c) => (c ? { ...c, frame: f } : c))
                  }
                  className={`py-2 rounded-xl font-display font-bold text-[10px] ${
                    cosmetics?.frame === f
                      ? "bg-gradient-gold text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-muted-foreground">
              {t("profile.badge")}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() =>
                  setCosmetics((c) => (c ? { ...c, badgeId: null } : c))
                }
                className={`px-3 py-1 rounded-full text-[10px] font-display font-bold transition-all ${
                  cosmetics?.badgeId === null
                    ? "bg-gradient-gold text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                —
              </button>
              {unlockedBadges.map(({ id, def }) => (
                <button
                  key={id}
                  onClick={() =>
                    setCosmetics((c) => (c ? { ...c, badgeId: id } : c))
                  }
                  className={`px-3 py-1 rounded-full text-[10px] font-display font-bold transition-all ${
                    cosmetics?.badgeId === id
                      ? "bg-gradient-gold text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {def.emoji} {def.label}
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={!cosmetics || savingCosmetics}
            onClick={async () => {
              if (!cosmetics) return;
              setSavingCosmetics(true);
              saveCosmetics(user.id, cosmetics);
              await supabase
                .from("profiles")
                .update({
                  avatar_emoji: cosmetics.avatar,
                  profile_frame: cosmetics.frame,
                  badge_display: cosmetics.badgeId,
                })
                .eq("id", user.id);
              setSavingCosmetics(false);
            }}
            className="w-full py-3 rounded-xl bg-gradient-fire text-foreground font-display font-bold active:scale-95 transition-transform disabled:opacity-60"
          >
            {t("profile.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
