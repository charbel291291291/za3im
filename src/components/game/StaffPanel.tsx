import { useGame } from "@/game/GameContext";
import { STAFF } from "@/game/gameData";
import { formatNumber } from "@/components/game/TopBar";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n/I18nContext";

export function StaffPanel() {
  const { state, dispatch } = useGame();
  const { t, isRTL } = useI18n();

  return (
    <div className={`space-y-3 px-4 ${isRTL ? "text-right" : "text-left"}`}>
      <h2 className="font-display text-xl text-gold">{t("staff.title")}</h2>
      <p className="text-xs text-muted-foreground font-body">
        {t("staff.subtitle")}
      </p>

      {STAFF.map((staff) => {
        const owned = state.ownedStaff.includes(staff.id);
        const locked =
          staff.unlockLevel > state.level ||
          (staff.unlockPrestigeLevel ?? 0) > state.prestigeLevel;
        const canAfford = state.coins >= staff.cost;

        return (
          <motion.div
            key={staff.id}
            className={`rounded-xl p-4 shadow-card ${locked ? "bg-muted opacity-50" : "bg-surface"}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl">{staff.emoji}</div>
              <div className="flex-1">
                <div className="font-display font-bold text-foreground">
                  {staff.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {staff.role}
                </div>
                <div className="text-xs text-cedar mt-1">{staff.bonus}</div>
                {locked && (
                  <div className="text-xs text-accent mt-1">
                    {t("staff.unlocksAtLevel", { level: staff.unlockLevel })}
                    {(staff.unlockPrestigeLevel ?? 0) > 0 &&
                      ` · ${t("staff.prestigePlus", { level: staff.unlockPrestigeLevel ?? 0 })}`}
                  </div>
                )}
              </div>
              {owned ? (
                <div className="text-xs text-cedar font-display bg-cedar/10 px-3 py-1.5 rounded-lg">
                  ✅ {t("staff.hired")}
                </div>
              ) : (
                <button
                  disabled={locked || !canAfford}
                  onClick={() =>
                    dispatch({ type: "HIRE_STAFF", staffId: staff.id })
                  }
                  className={`px-4 py-2 rounded-lg font-display text-sm font-bold transition-all
                    ${
                      canAfford && !locked
                        ? "bg-gradient-cedar text-secondary-foreground active:scale-95"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    }`}
                >
                  {t("staff.hire")}
                  <div className="text-[10px] opacity-80">
                    🪙 {formatNumber(staff.cost)}
                  </div>
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
