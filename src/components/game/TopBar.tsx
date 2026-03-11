import { useGame } from "@/game/GameContext";
import { motion } from "framer-motion";
import { useState } from "react";
import { toggleBGM, isBGMPlaying } from "@/game/sounds";
import { useAuth } from "@/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { loadProfile } from "@/lib/supabaseGameApi";
import { useI18n } from "@/i18n/I18nContext";

export function TopBar() {
  const { state } = useGame();
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [musicOn, setMusicOn] = useState(isBGMPlaying());
  const [signingOut, setSigningOut] = useState(false);
  const { t } = useI18n();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setRole(null);
      return;
    }
    void (async () => {
      const res = await loadProfile(user.id);
      const nextRole = res.data?.role ?? null;
      if (!cancelled) setRole(nextRole);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const isAdmin = useMemo(() => role === "admin", [role]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-md border-b border-border px-4 py-2">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        {/* Level */}
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center text-sm font-bold text-primary-foreground font-display">
            {state.level}
          </div>
          <div className="text-xs text-muted-foreground leading-tight">
            <div className="font-display text-foreground text-sm">
              {t("topbar.boss")}
            </div>
            <div className="text-[10px] text-muted-foreground">
              🌟 {t("topbar.prestige", { level: state.prestigeLevel })}
            </div>
          </div>
        </div>

        {/* Coins */}
        <motion.div
          className="flex items-center gap-1 bg-muted rounded-full px-3 py-1"
          key={state.coins}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.2 }}
        >
          <span className="text-base">🪙</span>
          <span className="text-gold font-bold font-display text-sm">
            {formatNumber(state.coins)}
          </span>
        </motion.div>

        {/* Diamonds */}
        <div className="flex items-center gap-1 bg-muted rounded-full px-3 py-1">
          <span className="text-base">💎</span>
          <span className="text-diamond font-bold font-display text-sm">
            {state.diamonds}
          </span>
        </div>

        {/* Music toggle */}
        <button
          onClick={() => setMusicOn(toggleBGM())}
          className="text-lg w-7 h-7 flex items-center justify-center rounded-full bg-muted active:scale-90 transition-transform"
          aria-label={t("topbar.toggleMusic")}
        >
          {musicOn ? "🔊" : "🔇"}
        </button>

        <button
          onClick={() => navigate("/profile")}
          className="text-lg w-7 h-7 flex items-center justify-center rounded-full bg-muted active:scale-90 transition-transform"
          aria-label={t("nav.profile")}
        >
          👤
        </button>

        <button
          onClick={() => navigate("/settings")}
          className="text-lg w-7 h-7 flex items-center justify-center rounded-full bg-muted active:scale-90 transition-transform"
          aria-label={t("nav.settings")}
        >
          ⚙️
        </button>

        {isAdmin && (
          <button
            onClick={() => navigate("/admin")}
            className="text-lg w-7 h-7 flex items-center justify-center rounded-full bg-muted active:scale-90 transition-transform"
            aria-label={t("nav.admin")}
          >
            🛡️
          </button>
        )}

        <button
          disabled={loading || signingOut}
          onClick={async () => {
            if (user) {
              setSigningOut(true);
              try {
                await signOut();
              } finally {
                setSigningOut(false);
                navigate("/auth", { replace: true });
              }
              return;
            }
            navigate("/auth");
          }}
          className="text-[10px] px-2.5 py-1 rounded-full bg-muted text-foreground font-display font-bold active:scale-95 transition-transform disabled:opacity-50"
        >
          {user ? t("topbar.logout") : t("topbar.login")}
        </button>
      </div>
    </div>
  );
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 10_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}
