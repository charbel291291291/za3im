import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  getEmpireValue,
  getNextPrestigeThreshold,
  getPrestigeIncomeMultiplier,
  SKINS,
  useGame,
} from "@/game/GameContext";
import { formatNumber } from "@/components/game/TopBar";

interface PrestigeModalProps {
  open: boolean;
  onClose: () => void;
}

export function PrestigeModal({ open, onClose }: PrestigeModalProps) {
  const { state, dispatch } = useGame();
  const [confirming, setConfirming] = useState(false);

  const empireValue = useMemo(() => getEmpireValue(state), [state]);
  const nextThreshold = useMemo(
    () => getNextPrestigeThreshold(state.prestigeLevel),
    [state.prestigeLevel],
  );
  const canPrestige = empireValue >= nextThreshold;
  const nextLevel = state.prestigeLevel + 1;
  const nextMultiplier = getPrestigeIncomeMultiplier(nextLevel);

  const unlockedSkins = useMemo(
    () =>
      Object.entries(SKINS)
        .filter(([id]) => state.unlockedSkinIds.includes(id))
        .map(([id, s]) => ({ id, ...s })),
    [state.unlockedSkinIds],
  );

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          className="relative w-full max-w-sm bg-surface rounded-2xl border border-border p-6 shadow-raised"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 10 }}
        >
          <div className="text-center">
            <div className="text-4xl mb-2">🌟</div>
            <h3 className="font-display text-xl font-bold text-foreground">
              Prestige
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Prestige Level{" "}
              <span className="text-foreground font-display">
                {state.prestigeLevel}
              </span>{" "}
              · Income x
              {getPrestigeIncomeMultiplier(state.prestigeLevel).toFixed(2)}
            </p>
          </div>

          <div className="mt-4 bg-muted rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Empire Value</span>
              <span className="text-foreground font-display">
                🪙 {formatNumber(empireValue)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Next Prestige</span>
              <span className="text-foreground font-display">
                🪙 {formatNumber(nextThreshold)}
              </span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-gold rounded-full"
                style={{
                  width: `${Math.min(100, (empireValue / nextThreshold) * 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-4 bg-muted rounded-xl p-4">
            <div className="text-xs text-muted-foreground">
              Next reward
            </div>
            <div className="mt-2 text-sm font-display font-bold text-foreground">
              Prestige Level {nextLevel} · Income x{nextMultiplier.toFixed(2)}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Skins unlocked:{" "}
              <span className="text-foreground font-display">
                {unlockedSkins.map((s) => s.emoji).join(" ")}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <button
              disabled={!canPrestige}
              onClick={() => {
                if (!confirming) {
                  setConfirming(true);
                  return;
                }
                dispatch({ type: "PRESTIGE" });
                setConfirming(false);
                onClose();
              }}
              className={`w-full py-3 rounded-xl font-display font-bold transition-all
                ${canPrestige
                  ? "bg-gradient-fire text-foreground active:scale-95"
                  : "bg-background text-muted-foreground cursor-not-allowed"}`}
            >
              {confirming ? "Tap again to confirm" : "Prestige Reset"}
            </button>
            <button
              onClick={() => {
                setConfirming(false);
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-muted text-foreground font-display font-bold active:scale-95 transition-transform"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

