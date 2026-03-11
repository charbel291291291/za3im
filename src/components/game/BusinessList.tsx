import { useGame } from '@/game/GameContext';
import { BUSINESSES, getUpgradeCost, getIncomePerMinute } from '@/game/gameData';
import { formatNumber } from '@/components/game/TopBar';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { playUpgradeSound } from '@/game/sounds';
import { useI18n } from '@/i18n/I18nContext';

export function BusinessList() {
  const { state, dispatch } = useGame();
  const { t, isRTL } = useI18n();
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  const handleUpgrade = (bizId: string) => {
    dispatch({ type: 'UPGRADE_BUSINESS', businessId: bizId });
    playUpgradeSound();
    setAnimatingId(bizId);
    setTimeout(() => setAnimatingId(null), 500);
  };

  return (
    <div className={`space-y-3 px-4 ${isRTL ? 'text-right' : 'text-left'}`}>
      <h2 className="font-display text-xl text-gold">{t('businesses.title')}</h2>
      {BUSINESSES.map(biz => {
        const level = state.businessLevels[biz.id] || 0;
        const locked = biz.unlockLevel > state.level;
        const cost = getUpgradeCost(biz, level);
        const income = getIncomePerMinute(biz, level);
        const nextIncome = getIncomePerMinute(biz, level + 1);
        const canAfford = state.coins >= cost && !locked;

        return (
          <motion.div
            key={biz.id}
            className={`rounded-xl p-4 shadow-card ${locked ? 'bg-muted opacity-50' : 'bg-surface'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl">{locked ? '🔒' : biz.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display text-foreground font-bold truncate">{biz.name}</span>
                  {level > 0 && (
                    <span className="text-xs bg-muted text-gold px-2 py-0.5 rounded-full font-display">
                      Lv.{level}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground font-body">{biz.nameAr}</div>
                {level > 0 && (
                  <div className="text-xs text-cedar mt-1">
                    🪙 {formatNumber(income)}
                    {t('businesses.perMin')} → {formatNumber(nextIncome)}
                    {t('businesses.perMin')}
                  </div>
                )}
                {locked && (
                  <div className="text-xs text-accent mt-1">
                    {t('businesses.unlocksAtLevel', { level: biz.unlockLevel })}
                  </div>
                )}
              </div>
              <button
                disabled={!canAfford}
                onClick={() => handleUpgrade(biz.id)}
                className={`shrink-0 px-4 py-2 rounded-lg font-display text-sm font-bold transition-all
                  ${canAfford
                    ? 'bg-gradient-gold text-primary-foreground shadow-gold active:scale-95'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
              >
                <AnimatePresence>
                  {animatingId === biz.id && (
                    <motion.span
                      className="absolute text-lg"
                      initial={{ opacity: 1, y: 0 }}
                      animate={{ opacity: 0, y: -30 }}
                      exit={{ opacity: 0 }}
                    >
                      +💰
                    </motion.span>
                  )}
                </AnimatePresence>
                {level === 0 ? t('businesses.buy') : t('businesses.upgrade')}
                <div className="text-[10px] opacity-80">🪙 {formatNumber(cost)}</div>
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
