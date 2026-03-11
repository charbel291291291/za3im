import { useGame } from '@/game/GameContext';
import { DISTRICTS, ECONOMY_MULTIPLIERS } from '@/game/gameData';
import { formatNumber } from '@/components/game/TopBar';
import { motion } from 'framer-motion';

interface DistrictMapProps {
  onAttack: (districtId: string) => void;
}

export function DistrictMap({ onAttack }: DistrictMapProps) {
  const { state } = useGame();

  return (
    <div className="space-y-3 px-4">
      <h2 className="font-display text-xl text-gold">🇱🇧 Lebanese Empire</h2>
      <p className="text-xs text-muted-foreground font-body">Control districts across Lebanon to build your empire</p>

      <div className="grid grid-cols-2 gap-3">
        {DISTRICTS.map((dist, i) => {
          const captured = state.capturedDistricts.includes(dist.id);
          const locked = dist.unlockLevel > state.level;
          const economy = state.districtEconomyLevels[dist.id] ?? 'poor';
          const economyLabel = economy.charAt(0).toUpperCase() + economy.slice(1);
          const economyMultiplier = ECONOMY_MULTIPLIERS[economy] ?? 1;
          const event = state.districtEvents[dist.id];
          const eventLabel = event?.type
            ? event.type
                .split('_')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ')
            : null;

          return (
            <motion.div
              key={dist.id}
              className={`rounded-xl p-4 border transition-all ${
                captured
                  ? 'bg-surface border-cedar/30'
                  : locked
                    ? 'bg-muted border-border opacity-50'
                    : 'bg-surface border-accent/30'
              }`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="text-2xl mb-1">{dist.emoji}</div>
              <div className="font-display font-bold text-sm text-foreground">{dist.name}</div>
              <div className="text-[10px] text-muted-foreground mb-2">{dist.nameAr}</div>

              <div className="text-[10px] text-muted-foreground mb-2">
                Economy: <span className="text-gold font-display">{economyLabel}</span> · x{economyMultiplier.toFixed(1)}
              </div>

              {eventLabel && (
                <div className="text-[10px] text-muted-foreground mb-2">
                  Event: <span className="text-foreground font-display">{eventLabel}</span> · x{(event?.multiplier ?? 1).toFixed(2)}
                </div>
              )}

              {captured ? (
                <div className="text-xs text-cedar font-display">✅ Controlled</div>
              ) : locked ? (
                <div className="text-xs text-muted-foreground">🔒 Level {dist.unlockLevel}</div>
              ) : (
                <>
                  <div className="text-[10px] text-muted-foreground mb-1">
                    Boss: {dist.bossName}
                  </div>
                  <div className="text-[10px] text-gold mb-2">
                    Reward: 🪙 {formatNumber(dist.captureReward)}
                  </div>
                  <button
                    onClick={() => onAttack(dist.id)}
                    className="w-full py-1.5 rounded-lg bg-gradient-fire text-foreground text-xs font-display font-bold active:scale-95 transition-transform"
                  >
                    ⚔️ Attack
                  </button>
                </>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
