import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useGame } from "@/game/GameContext";
import { formatNumber } from "@/components/game/TopBar";

interface LuckySpinModalProps {
  open: boolean;
  onClose: () => void;
}

export function LuckySpinModal({ open, onClose }: LuckySpinModalProps) {
  const { state, dispatch } = useGame();
  const [spinning, setSpinning] = useState(false);

  const today = useMemo(() => new Date().toDateString(), []);
  const freeAvailable = state.lastSpinDate === today && state.spinsToday === 0;
  const canSpinFree = freeAvailable && !spinning;
  const canSpinPaid = state.diamonds >= 5 && !spinning;

  const spin = async (paid: boolean) => {
    if (spinning) return;
    setSpinning(true);
    await new Promise((r) => setTimeout(r, 650));
    dispatch({ type: "SPIN_WHEEL", paid });
    setSpinning(false);
  };

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
            <div className="text-4xl mb-2">🎡</div>
            <h3 className="font-display text-xl font-bold text-foreground">
              Lucky Spin
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Daily free spin + paid spins for 💎 5
            </p>
          </div>

          <div className="mt-4 bg-muted rounded-xl p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Free spin</span>
              <span className="text-foreground font-display">
                {freeAvailable ? "Available" : "Used"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs mt-2">
              <span className="text-muted-foreground">Spins today</span>
              <span className="text-foreground font-display">
                {state.spinsToday}
              </span>
            </div>
          </div>

          <motion.div
            className="mt-4 w-full rounded-2xl bg-background border border-border p-5 text-center"
            animate={
              spinning
                ? { rotate: [0, 8, -8, 10, -10, 0] }
                : { rotate: 0 }
            }
            transition={{ duration: 0.65 }}
          >
            <div className="text-5xl">🍀</div>
            <div className="mt-2 text-xs text-muted-foreground">
              Tap spin to roll rewards
            </div>
          </motion.div>

          {state.lastLoot?.kind === "spin" && (
            <div className="mt-4 bg-muted rounded-xl p-4">
              <div className="text-xs text-muted-foreground">Last spin</div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-foreground font-display">🪙</span>
                <span className="text-foreground font-display">
                  {formatNumber(state.lastLoot.coins)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-foreground font-display">💎</span>
                <span className="text-foreground font-display">
                  {state.lastLoot.diamonds}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-foreground font-display">🧰</span>
                <span className="text-foreground font-display">
                  {state.lastLoot.rareChests}
                </span>
              </div>
              <button
                onClick={() => dispatch({ type: "CLEAR_LAST_LOOT" })}
                className="mt-3 w-full py-2 rounded-lg bg-background text-muted-foreground font-display text-xs font-bold active:scale-95 transition-transform"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              disabled={!canSpinFree}
              onClick={() => void spin(false)}
              className={`py-3 rounded-xl font-display font-bold transition-all
                ${canSpinFree
                  ? "bg-gradient-gold text-primary-foreground active:scale-95"
                  : "bg-muted text-muted-foreground cursor-not-allowed"}`}
            >
              Free Spin
            </button>
            <button
              disabled={!canSpinPaid}
              onClick={() => void spin(true)}
              className={`py-3 rounded-xl font-display font-bold transition-all
                ${canSpinPaid
                  ? "bg-gradient-fire text-foreground active:scale-95"
                  : "bg-muted text-muted-foreground cursor-not-allowed"}`}
            >
              Spin (💎 5)
            </button>
          </div>

          <button
            onClick={onClose}
            className="mt-2 w-full py-3 rounded-xl bg-muted text-foreground font-display font-bold active:scale-95 transition-transform"
          >
            Close
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

