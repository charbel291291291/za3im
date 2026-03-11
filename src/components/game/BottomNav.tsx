import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nContext';

const tabs = [
  { id: '/', labelKey: 'nav.city', emoji: '🏙️' },
  { id: '/businesses', labelKey: 'nav.businesses', emoji: '💼' },
  { id: '/staff', labelKey: 'nav.staff', emoji: '👥' },
  { id: '/attack', labelKey: 'nav.attack', emoji: '⚔️' },
  { id: '/leaderboard', labelKey: 'nav.leaderboard', emoji: '🏆' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-md border-t border-border">
      <div className="flex items-center justify-around max-w-lg mx-auto py-1 pb-[env(safe-area-inset-bottom,8px)]">
        {tabs.map(tab => {
          const active = location.pathname === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.id)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 relative"
            >
              {active && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-gold"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="text-xl">{tab.emoji}</span>
              <span className={`text-[10px] font-display ${active ? 'text-gold' : 'text-muted-foreground'}`}>
                {t(tab.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
