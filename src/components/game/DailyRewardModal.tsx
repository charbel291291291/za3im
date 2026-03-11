import { getDailyStreakRewardMultiplier, useGame } from '@/game/GameContext';
import { DAILY_REWARDS } from '@/game/gameData';
import { motion, AnimatePresence } from 'framer-motion';
import { playDailyReward } from '@/game/sounds';

interface DailyRewardModalProps {
  onClose: () => void;
}

export function DailyRewardModal({ onClose }: DailyRewardModalProps) {
  const { state, dispatch } = useGame();
  const today = new Date().toDateString();
  const alreadyClaimed = state.lastDailyClaimDate === today;

  if (alreadyClaimed) return null;

  const currentDay = (state.dailyStreak % 7);
  const reward = DAILY_REWARDS[currentDay];
  const nextStreak = state.lastDailyClaimDate === new Date(Date.now() - 86400000).toDateString()
    ? state.dailyStreak + 1
    : 1;
  const multiplier = getDailyStreakRewardMultiplier(nextStreak);
  const coinPreview = reward.type === 'coins' ? Math.floor(reward.amount * multiplier) : 0;
  const chestPreview = nextStreak % 7 === 0;

  const handleClaim = () => {
    playDailyReward();
    dispatch({
      type: 'CLAIM_DAILY',
      coins: reward.type === 'coins' ? reward.amount : 0,
      diamonds: reward.type === 'diamonds' ? reward.amount : 0,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative w-full max-w-xs bg-surface rounded-2xl border border-border p-6 shadow-raised text-center"
          initial={{ scale: 0.8, rotate: -5 }}
          animate={{ scale: 1, rotate: 0 }}
        >
          <div className="text-4xl mb-3">🎁</div>
          <h3 className="font-display text-xl font-bold text-foreground mb-1">Daily Reward!</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Day {currentDay + 1} — Streak: {state.dailyStreak} days
          </p>

          <div className="flex justify-center gap-1 mb-4">
            {DAILY_REWARDS.map((r, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-display
                  ${i === currentDay ? 'bg-gradient-gold text-primary-foreground shadow-gold' :
                    i < currentDay ? 'bg-cedar/20 text-cedar' : 'bg-muted text-muted-foreground'}`}
              >
                {i + 1}
              </div>
            ))}
          </div>

          <div className="bg-muted rounded-xl p-4 mb-4">
            <p className="font-display text-lg font-bold text-gold">{reward.label}</p>
            {reward.type === 'coins' && multiplier > 1 && (
              <p className="text-xs text-muted-foreground mt-1">
                Streak bonus: x{multiplier.toFixed(2)} → 🪙 {coinPreview}
              </p>
            )}
            {chestPreview && (
              <p className="text-xs text-muted-foreground mt-1">+1 Rare Chest 🧰</p>
            )}
          </div>

          <button
            onClick={handleClaim}
            className="w-full py-3 rounded-xl bg-gradient-gold text-primary-foreground font-display font-bold active:scale-95 transition-transform shadow-gold"
          >
            Claim!
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
