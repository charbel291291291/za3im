import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "@/game/GameContext";
import { formatNumber } from "@/components/game/TopBar";

interface TreasureHuntModalProps {
  open: boolean;
  onClose: () => void;
}

export function TreasureHuntModal({ open, onClose }: TreasureHuntModalProps) {
  const { state, dispatch } = useGame();
  const th = state.treasureHunt;

  const ready =
    !th.claimedAt &&
    th.wins >= th.requiredWins &&
    th.captures >= th.requiredCaptures;

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
            <div className="text-4xl mb-2">🗝️</div>
            <h3 className="font-display text-xl font-bold text-foreground">
              Treasure Hunt
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Daily mission · {th.dayKey}
            </p>
          </div>

          <div className="mt-4 bg-muted rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Win challenges</span>
              <span className="text-foreground font-display">
                {th.wins}/{th.requiredWins}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Capture districts</span>
              <span className="text-foreground font-display">
                {th.captures}/{th.requiredCaptures}
              </span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-gold rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    ((th.wins + th.captures) /
                      (th.requiredWins + th.requiredCaptures)) *
                      100,
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-4 bg-muted rounded-xl p-4">
            <div className="text-xs text-muted-foreground">Reward</div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-foreground font-display">🪙</span>
              <span className="text-foreground font-display">
                {formatNumber(th.rewardCoins)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-foreground font-display">🧰</span>
              <span className="text-foreground font-display">
                {th.rewardRareChests}
              </span>
            </div>
          </div>

          {state.lastLoot?.kind === "treasure" && (
            <div className="mt-4 bg-muted rounded-xl p-4">
              <div className="text-xs text-muted-foreground">
                Claimed
              </div>
              <div className="mt-2 text-sm text-foreground font-display">
                +🪙 {formatNumber(state.lastLoot.coins)}{" "}
                {state.lastLoot.rareChests > 0 && `· +🧰 ${state.lastLoot.rareChests}`}
              </div>
              <button
                onClick={() => dispatch({ type: "CLEAR_LAST_LOOT" })}
                className="mt-3 w-full py-2 rounded-lg bg-background text-muted-foreground font-display text-xs font-bold active:scale-95 transition-transform"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="mt-4 space-y-2">
            <button
              disabled={!ready}
              onClick={() => dispatch({ type: "CLAIM_TREASURE_HUNT" })}
              className={`w-full py-3 rounded-xl font-display font-bold transition-all
                ${ready
                  ? "bg-gradient-fire text-foreground active:scale-95"
                  : "bg-muted text-muted-foreground cursor-not-allowed"}`}
            >
              {th.claimedAt ? "Claimed" : "Claim Reward"}
            </button>
            <button
              onClick={onClose}
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

