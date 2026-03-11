import { useGame } from '@/game/GameContext';
import { formatNumber } from '@/components/game/TopBar';
import { motion, AnimatePresence } from 'framer-motion';
import { playCollectReward } from '@/game/sounds';

interface OfflineModalProps {
  onClose: () => void;
}

export function OfflineModal({ onClose }: OfflineModalProps) {
  const { state, dispatch, getOfflineEarnings } = useGame();
  const earnings = getOfflineEarnings();

  if (state.hasClaimedOffline || earnings < 1) return null;

  const handleCollect = () => {
    playCollectReward();
    dispatch({ type: 'COLLECT_OFFLINE', amount: earnings });
    onClose();
  };

  const elapsed = Math.floor((Date.now() - state.lastOnlineTime) / 60000);
  const hours = Math.floor(elapsed / 60);
  const mins = elapsed % 60;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        <motion.div
          className="relative w-full max-w-xs bg-surface rounded-2xl border border-border p-6 shadow-raised text-center"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
        >
          <div className="text-4xl mb-3">💰</div>
          <h3 className="font-display text-xl font-bold text-foreground mb-1">Welcome Back, Boss!</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You were away for {hours > 0 ? `${hours}h ` : ''}{mins}m
          </p>
          <div className="bg-muted rounded-xl p-4 mb-4">
            <p className="text-xs text-muted-foreground mb-1">Your businesses earned</p>
            <p className="font-display text-2xl font-bold text-gold">🪙 {formatNumber(earnings)}</p>
          </div>
          <button
            onClick={handleCollect}
            className="w-full py-3 rounded-xl bg-gradient-gold text-primary-foreground font-display font-bold active:scale-95 transition-transform shadow-gold"
          >
            Collect!
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}