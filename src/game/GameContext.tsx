import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useState,
} from "react";
import {
  BUSINESSES,
  STAFF,
  DISTRICTS,
  ECONOMY_MULTIPLIERS,
  getUpgradeCost,
  getIncomePerMinute,
  getLevelXP,
  DifficultyTier,
  EconomyLevel,
} from "./gameData";
import { useAuth } from "@/auth/AuthContext";
import {
  loadPlayerBusinesses,
  loadPlayerDistricts,
  loadPlayerStaff,
  loadProfile,
  rpcCollectIdleIncome,
} from "@/lib/supabaseGameApi";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";

export interface ChallengeStats {
  totalAnswered: number;
  correctAnswers: number;
  successRate: number;
  totalResponseTimeMs: number;
  averageResponseTimeMs: number;
  currentDifficulty: DifficultyTier;
  recentQuestionIds: string[];
  recentQuestionCategories: string[];
  lastDifficultyChangeAtAnswered: number;
}

export type DistrictEventType =
  | "tourism_surge"
  | "police_crackdown"
  | "festival_event"
  | "market_crash";

export interface DistrictEvent {
  type: DistrictEventType;
  multiplier: number;
  startedAt: number;
  endsAt: number;
}

export type GlobalEventType =
  | "double_income"
  | "challenge_frenzy"
  | "treasure_rush";

export interface GlobalEvent {
  type: GlobalEventType;
  incomeMultiplier: number;
  challengeRewardMultiplier: number;
  startedAt: number;
  endsAt: number;
}

export interface TreasureHunt {
  dayKey: string;
  requiredWins: number;
  requiredCaptures: number;
  wins: number;
  captures: number;
  rewardCoins: number;
  rewardRareChests: number;
  claimedAt: number | null;
}

export type LootKind = "spin" | "rare_chest" | "treasure";

export interface LastLoot {
  kind: LootKind;
  at: number;
  coins: number;
  diamonds: number;
  rareChests: number;
}

export interface GameState {
  coins: number;
  diamonds: number;
  level: number;
  xp: number;
  reputation: number;
  businessLevels: Record<string, number>;
  ownedStaff: string[];
  capturedDistricts: string[];
  challengesWon: number;
  challengesLost: number;
  totalEarned: number;
  lastOnlineTime: number;
  dailyStreak: number;
  lastDailyClaimDate: string | null;
  hasClaimedOffline: boolean;
  challengeStats: ChallengeStats;
  pvpCooldowns: Record<string, number>;
  districtEconomyLevels: Record<string, EconomyLevel>;
  districtEvents: Record<string, DistrictEvent | null>;
  lastDistrictEventRollAt: number;
  achievementsUnlockedAt: Record<string, number>;
  badgeIds: string[];
  prestigeLevel: number;
  unlockedSkinIds: string[];
  selectedSkinId: string;
  rareChests: number;
  lastSpinDate: string | null;
  spinsToday: number;
  treasureHunt: TreasureHunt;
  globalEvent: GlobalEvent | null;
  lastGlobalEventRollAt: number;
  lastLoot: LastLoot | null;
}

type GameAction =
  | { type: "UPGRADE_BUSINESS"; businessId: string }
  | { type: "HIRE_STAFF"; staffId: string }
  | { type: "CAPTURE_DISTRICT"; districtId: string; reward: number }
  | {
      type: "CHALLENGE_WIN";
      reward: number;
      xp: number;
      challengeId: string;
      difficulty: DifficultyTier;
      category: string;
      responseTimeMs: number;
    }
  | {
      type: "CHALLENGE_LOSE";
      penalty: number;
      challengeId: string;
      difficulty: DifficultyTier;
      category: string;
      responseTimeMs: number;
    }
  | {
      type: "PVP_WIN";
      rivalId: string;
      coinsStolen: number;
      cooldownUntil: number;
    }
  | {
      type: "PVP_LOSE";
      rivalId: string;
      penaltyCoins: number;
      cooldownUntil: number;
    }
  | { type: "COLLECT_OFFLINE"; amount: number }
  | { type: "CLAIM_DAILY"; coins: number; diamonds: number }
  | { type: "GRANT_REWARD"; coins: number; diamonds: number }
  | { type: "SPIN_WHEEL"; paid: boolean }
  | { type: "OPEN_RARE_CHEST" }
  | { type: "CLAIM_TREASURE_HUNT" }
  | { type: "CLEAR_LAST_LOOT" }
  | { type: "PRESTIGE" }
  | { type: "SET_SKIN"; skinId: string }
  | { type: "TICK_INCOME" }
  | { type: "SPEND_DIAMONDS"; amount: number }
  | { type: "LOAD_STATE"; state: GameState };

const initialState: GameState = {
  coins: 100,
  diamonds: 10,
  level: 1,
  xp: 0,
  reputation: 0,
  businessLevels: { manoushe: 1 },
  ownedStaff: [],
  capturedDistricts: ["hamra"],
  challengesWon: 0,
  challengesLost: 0,
  totalEarned: 0,
  lastOnlineTime: Date.now(),
  dailyStreak: 0,
  lastDailyClaimDate: null,
  hasClaimedOffline: true,
  challengeStats: {
    totalAnswered: 0,
    correctAnswers: 0,
    successRate: 0,
    totalResponseTimeMs: 0,
    averageResponseTimeMs: 0,
    currentDifficulty: "easy",
    recentQuestionIds: [],
    recentQuestionCategories: [],
    lastDifficultyChangeAtAnswered: 0,
  },
  pvpCooldowns: {},
  districtEconomyLevels: DISTRICTS.reduce(
    (acc, d) => {
      acc[d.id] = "poor";
      return acc;
    },
    {} as Record<string, EconomyLevel>,
  ),
  districtEvents: DISTRICTS.reduce(
    (acc, d) => {
      acc[d.id] = null;
      return acc;
    },
    {} as Record<string, DistrictEvent | null>,
  ),
  lastDistrictEventRollAt: Date.now(),
  achievementsUnlockedAt: {},
  badgeIds: [],
  prestigeLevel: 0,
  unlockedSkinIds: ["default"],
  selectedSkinId: "default",
  rareChests: 0,
  lastSpinDate: null,
  spinsToday: 0,
  treasureHunt: {
    dayKey: new Date().toDateString(),
    requiredWins: 3,
    requiredCaptures: 1,
    wins: 0,
    captures: 0,
    rewardCoins: 1500,
    rewardRareChests: 0,
    claimedAt: null,
  },
  globalEvent: null,
  lastGlobalEventRollAt: Date.now(),
  lastLoot: null,
};

const difficultyOrder: DifficultyTier[] = ["easy", "medium", "hard", "expert"];

function clampDifficultyIndex(idx: number) {
  return Math.max(0, Math.min(difficultyOrder.length - 1, idx));
}

function stepDifficulty(
  base: DifficultyTier,
  direction: -1 | 1,
): DifficultyTier {
  const idx = difficultyOrder.indexOf(base);
  const nextIdx = clampDifficultyIndex(idx + direction);
  return difficultyOrder[nextIdx];
}

function getAdaptiveDifficulty(
  current: DifficultyTier,
  successRate: number,
  totalAnswered: number,
): DifficultyTier {
  if (totalAnswered < 5) return current;
  if (successRate > 0.8) return stepDifficulty(current, 1);
  if (successRate < 0.5) return stepDifficulty(current, -1);
  return current;
}

function updateChallengeStats(
  stats: ChallengeStats,
  args: {
    won: boolean;
    challengeId: string;
    difficulty: DifficultyTier;
    category: string;
    responseTimeMs: number;
  },
): ChallengeStats {
  const totalAnswered = stats.totalAnswered + 1;
  const correctAnswers = stats.correctAnswers + (args.won ? 1 : 0);
  const totalResponseTimeMs = stats.totalResponseTimeMs + args.responseTimeMs;
  const successRate = correctAnswers / totalAnswered;
  const averageResponseTimeMs = totalResponseTimeMs / totalAnswered;
  const candidateDifficulty = getAdaptiveDifficulty(
    stats.currentDifficulty,
    successRate,
    totalAnswered,
  );
  const canChangeDifficulty =
    totalAnswered - stats.lastDifficultyChangeAtAnswered >= 3;
  const currentDifficulty =
    candidateDifficulty !== stats.currentDifficulty && canChangeDifficulty
      ? candidateDifficulty
      : stats.currentDifficulty;
  const lastDifficultyChangeAtAnswered =
    currentDifficulty !== stats.currentDifficulty
      ? totalAnswered
      : stats.lastDifficultyChangeAtAnswered;
  const recentQuestionIds = [
    ...stats.recentQuestionIds,
    args.challengeId,
  ].slice(-12);
  const recentQuestionCategories = [
    ...stats.recentQuestionCategories,
    args.category,
  ].slice(-12);

  return {
    totalAnswered,
    correctAnswers,
    successRate,
    totalResponseTimeMs,
    averageResponseTimeMs,
    currentDifficulty,
    recentQuestionIds,
    recentQuestionCategories,
    lastDifficultyChangeAtAnswered,
  };
}

const businessDistrictIdByBusinessId = DISTRICTS.reduce(
  (acc, dist) => {
    dist.businesses.forEach((bizId) => {
      acc[bizId] = dist.id;
    });
    return acc;
  },
  {} as Record<string, string>,
);

function computeDistrictEconomyLevels(
  state: GameState,
): Record<string, EconomyLevel> {
  const next = { ...state.districtEconomyLevels };

  for (const dist of DISTRICTS) {
    const isCaptured = state.capturedDistricts.includes(dist.id);
    if (!isCaptured) {
      next[dist.id] = "poor";
      continue;
    }

    const ownedBusinessesInDistrict = dist.businesses.filter((bizId) => {
      const level = state.businessLevels[bizId] ?? 0;
      return level > 0;
    }).length;

    next[dist.id] =
      ownedBusinessesInDistrict >= 3
        ? "booming"
        : ownedBusinessesInDistrict === 2
          ? "busy"
          : ownedBusinessesInDistrict === 1
            ? "growing"
            : "poor";
  }

  return next;
}

const districtEventDefs: Record<
  DistrictEventType,
  { multiplier: number; minDurationMs: number; maxDurationMs: number }
> = {
  tourism_surge: {
    multiplier: 1.25,
    minDurationMs: 90_000,
    maxDurationMs: 210_000,
  },
  police_crackdown: {
    multiplier: 0.75,
    minDurationMs: 90_000,
    maxDurationMs: 240_000,
  },
  festival_event: {
    multiplier: 1.4,
    minDurationMs: 120_000,
    maxDurationMs: 240_000,
  },
  market_crash: {
    multiplier: 0.6,
    minDurationMs: 120_000,
    maxDurationMs: 300_000,
  },
};

const districtEventTypes: DistrictEventType[] = [
  "tourism_surge",
  "police_crackdown",
  "festival_event",
  "market_crash",
];

function applyDistrictEvents(
  state: GameState,
  now: number,
): {
  districtEvents: Record<string, DistrictEvent | null>;
  lastDistrictEventRollAt: number;
} {
  let districtEvents = state.districtEvents;

  const cleaned = { ...districtEvents };
  let changed = false;
  for (const [distId, ev] of Object.entries(cleaned)) {
    if (!ev) continue;
    if (ev.endsAt <= now) {
      cleaned[distId] = null;
      changed = true;
    }
  }
  districtEvents = changed ? cleaned : districtEvents;

  if (now - state.lastDistrictEventRollAt < 60_000) {
    return {
      districtEvents,
      lastDistrictEventRollAt: state.lastDistrictEventRollAt,
    };
  }

  const rolled = { ...districtEvents };
  let rolledAny = false;

  for (const dist of DISTRICTS) {
    if (!state.capturedDistricts.includes(dist.id)) continue;
    if (rolled[dist.id]) continue;
    if (Math.random() > 0.02) continue;

    const type =
      districtEventTypes[Math.floor(Math.random() * districtEventTypes.length)];
    const def = districtEventDefs[type];
    const duration =
      def.minDurationMs +
      Math.floor(Math.random() * (def.maxDurationMs - def.minDurationMs + 1));

    rolled[dist.id] = {
      type,
      multiplier: def.multiplier,
      startedAt: now,
      endsAt: now + duration,
    };
    rolledAny = true;
  }

  return {
    districtEvents: rolledAny ? rolled : districtEvents,
    lastDistrictEventRollAt: now,
  };
}

type AchievementReward = {
  coins?: number;
  diamonds?: number;
  badgeId?: string;
};

type AchievementDef = {
  id: string;
  title: string;
  reward: AchievementReward;
  isUnlocked: (state: GameState) => boolean;
};

export const BADGES: Record<string, { label: string; emoji: string }> = {
  starter: { label: "Starter", emoji: "🥉" },
  tycoon: { label: "Tycoon", emoji: "🏗️" },
  brainiac: { label: "Brainiac", emoji: "🧠" },
  warlord: { label: "Warlord", emoji: "⚔️" },
  millionaire: { label: "Millionaire", emoji: "💰" },
};

export const SKINS: Record<
  string,
  { label: string; emoji: string; unlockPrestigeLevel: number }
> = {
  default: { label: "Classic", emoji: "🌙", unlockPrestigeLevel: 0 },
  gold: { label: "Gold", emoji: "🥇", unlockPrestigeLevel: 1 },
  neon: { label: "Neon", emoji: "🟣", unlockPrestigeLevel: 3 },
  diamond: { label: "Diamond", emoji: "💎", unlockPrestigeLevel: 5 },
};

export function getPrestigeIncomeMultiplier(prestigeLevel: number) {
  return 1 + prestigeLevel * 0.1;
}

export function getNextPrestigeThreshold(prestigeLevel: number) {
  return 1_000_000 * Math.max(1, prestigeLevel + 1);
}

export function getDailyStreakRewardMultiplier(dailyStreak: number) {
  const weeks = Math.floor(Math.max(0, dailyStreak) / 7);
  const bonus = Math.min(0.5, weeks * 0.05);
  return 1 + bonus;
}

function dayKeyAt(now: number) {
  return new Date(now).toDateString();
}

function isSameDay(a: string | null, b: string) {
  return Boolean(a) && a === b;
}

function yesterdayKeyOf(dayKey: string) {
  const d = new Date(dayKey);
  d.setDate(d.getDate() - 1);
  return d.toDateString();
}

function hashToInt(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function generateTreasureHunt(dayKey: string): TreasureHunt {
  const seed = hashToInt(`treasure:${dayKey}`);
  const requiredWins = 2 + (seed % 4);
  const requiredCaptures = 1 + ((seed >>> 3) % 2);
  const rewardCoins = 1000 + (seed % 5) * 500;
  const rewardRareChests = seed % 7 === 0 ? 1 : 0;

  return {
    dayKey,
    requiredWins,
    requiredCaptures,
    wins: 0,
    captures: 0,
    rewardCoins,
    rewardRareChests,
    claimedAt: null,
  };
}

function ensureDailySystems(state: GameState, now: number) {
  const today = dayKeyAt(now);
  let next = state;

  if (next.treasureHunt.dayKey !== today) {
    next = { ...next, treasureHunt: generateTreasureHunt(today) };
  }

  if (!isSameDay(next.lastSpinDate, today)) {
    next = { ...next, lastSpinDate: today, spinsToday: 0 };
  }

  return next;
}

function getActiveGlobalEvent(state: GameState, now: number) {
  const ev = state.globalEvent;
  if (!ev) return null;
  return ev.endsAt > now ? ev : null;
}

function rollGlobalEvent(now: number): GlobalEvent | null {
  const r = Math.random();
  if (r > 0.06) return null;
  const pick = Math.random();
  if (pick < 0.45) {
    return {
      type: "double_income",
      incomeMultiplier: 2,
      challengeRewardMultiplier: 1,
      startedAt: now,
      endsAt: now + 30 * 60 * 1000,
    };
  }
  if (pick < 0.8) {
    return {
      type: "challenge_frenzy",
      incomeMultiplier: 1,
      challengeRewardMultiplier: 1.5,
      startedAt: now,
      endsAt: now + 30 * 60 * 1000,
    };
  }
  return {
    type: "treasure_rush",
    incomeMultiplier: 1.25,
    challengeRewardMultiplier: 1.25,
    startedAt: now,
    endsAt: now + 20 * 60 * 1000,
  };
}

export function getEmpireValue(state: GameState) {
  let invested = 0;
  for (const [bizId, level] of Object.entries(state.businessLevels)) {
    const biz = BUSINESSES.find((b) => b.id === bizId);
    if (!biz) continue;
    const safeLevel = Math.max(0, Math.floor(level));
    for (let i = 0; i < safeLevel; i++) {
      invested += getUpgradeCost(biz, i);
    }
  }

  const staffValue = state.ownedStaff.reduce((acc, staffId) => {
    const staff = STAFF.find((s) => s.id === staffId);
    return acc + (staff?.cost ?? 0);
  }, 0);

  const districtValue = state.capturedDistricts.reduce((acc, distId) => {
    const dist = DISTRICTS.find((d) => d.id === distId);
    return acc + (dist?.captureReward ?? 0);
  }, 0);

  return state.coins + invested + staffValue + districtValue;
}

function getUnlockedSkinIdsForPrestige(prestigeLevel: number) {
  const unlocked = Object.entries(SKINS)
    .filter(([, skin]) => prestigeLevel >= skin.unlockPrestigeLevel)
    .map(([id]) => id);
  return unlocked.length > 0 ? unlocked : ["default"];
}

const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first_business",
    title: "First Business",
    reward: { coins: 200, badgeId: "starter" },
    isUnlocked: (s) =>
      Object.values(s.businessLevels).filter((lvl) => lvl > 0).length >= 1,
  },
  {
    id: "business_level_10",
    title: "Upgrade a business to level 10",
    reward: { diamonds: 5, badgeId: "tycoon" },
    isUnlocked: (s) => Object.values(s.businessLevels).some((lvl) => lvl >= 10),
  },
  {
    id: "correct_50",
    title: "Answer 50 questions correctly",
    reward: { coins: 2000, badgeId: "brainiac" },
    isUnlocked: (s) => s.challengeStats.correctAnswers >= 50,
  },
  {
    id: "win_10_attacks",
    title: "Win 10 attacks",
    reward: { diamonds: 10, badgeId: "warlord" },
    isUnlocked: (s) => s.challengesWon >= 10,
  },
  {
    id: "earn_1m",
    title: "Earn 1,000,000 coins",
    reward: { diamonds: 50, badgeId: "millionaire" },
    isUnlocked: (s) => s.totalEarned >= 1_000_000,
  },
];

function applyAchievements(state: GameState): GameState {
  const now = Date.now();
  let next = state;

  for (const ach of ACHIEVEMENTS) {
    if (next.achievementsUnlockedAt[ach.id]) continue;
    if (!ach.isUnlocked(next)) continue;

    const coinsReward = ach.reward.coins ?? 0;
    const diamondsReward = ach.reward.diamonds ?? 0;
    const badgeId = ach.reward.badgeId;

    next = {
      ...next,
      coins: next.coins + coinsReward,
      diamonds: next.diamonds + diamondsReward,
      totalEarned: next.totalEarned + coinsReward,
      achievementsUnlockedAt: { ...next.achievementsUnlockedAt, [ach.id]: now },
      badgeIds:
        badgeId && !next.badgeIds.includes(badgeId)
          ? [...next.badgeIds, badgeId]
          : next.badgeIds,
    };
  }

  return next;
}

function getTotalIncomePerMinute(state: GameState): number {
  let total = 0;
  for (const [bizId, level] of Object.entries(state.businessLevels)) {
    const biz = BUSINESSES.find((b) => b.id === bizId);
    if (biz && level > 0) {
      const base = getIncomePerMinute(biz, level);
      const distId = businessDistrictIdByBusinessId[bizId];
      const economyLevel = distId
        ? (state.districtEconomyLevels[distId] ?? "growing")
        : "growing";
      const eventMultiplier = distId
        ? (state.districtEvents[distId]?.multiplier ?? 1)
        : 1;
      total += Math.floor(
        base * (ECONOMY_MULTIPLIERS[economyLevel] ?? 1) * eventMultiplier,
      );
    }
  }
  // Staff income bonus
  const incomeStaff = state.ownedStaff.filter((s) => {
    const staff = STAFF.find((st) => st.id === s);
    return staff?.bonusType === "income";
  });
  const incomeBonus = incomeStaff.reduce((acc, s) => {
    const staff = STAFF.find((st) => st.id === s);
    return acc + (staff?.bonusValue || 0);
  }, 0);
  const withStaff = Math.floor(total * (1 + incomeBonus));
  const withPrestige = Math.floor(
    withStaff * getPrestigeIncomeMultiplier(state.prestigeLevel),
  );
  const now = Date.now();
  const globalEvent = getActiveGlobalEvent(state, now);
  const withEvent = Math.floor(
    withPrestige * (globalEvent?.incomeMultiplier ?? 1),
  );
  return withEvent;
}

function checkLevelUp(state: GameState): GameState {
  const needed = getLevelXP(state.level);
  if (state.xp >= needed) {
    return { ...state, level: state.level + 1, xp: state.xp - needed };
  }
  return state;
}

type RewardRoll = { coins: number; diamonds: number; rareChests: number };

function rollFromTable(table: Array<{ weight: number; roll: RewardRoll }>) {
  const total = table.reduce((acc, t) => acc + t.weight, 0);
  let r = Math.random() * total;
  for (const entry of table) {
    r -= entry.weight;
    if (r <= 0) return entry.roll;
  }
  return table[table.length - 1].roll;
}

function rollSpinReward(multiplier: number): RewardRoll {
  const base = rollFromTable([
    { weight: 30, roll: { coins: 250, diamonds: 0, rareChests: 0 } },
    { weight: 25, roll: { coins: 500, diamonds: 0, rareChests: 0 } },
    { weight: 15, roll: { coins: 1000, diamonds: 0, rareChests: 0 } },
    { weight: 10, roll: { coins: 2000, diamonds: 0, rareChests: 0 } },
    { weight: 8, roll: { coins: 0, diamonds: 2, rareChests: 0 } },
    { weight: 6, roll: { coins: 0, diamonds: 5, rareChests: 0 } },
    { weight: 5, roll: { coins: 0, diamonds: 0, rareChests: 1 } },
    { weight: 1, roll: { coins: 7500, diamonds: 0, rareChests: 1 } },
  ]);

  return {
    ...base,
    coins: Math.floor(base.coins * multiplier),
  };
}

function rollRareChestReward(multiplier: number): RewardRoll {
  const base = rollFromTable([
    { weight: 35, roll: { coins: 2000, diamonds: 0, rareChests: 0 } },
    { weight: 25, roll: { coins: 3500, diamonds: 0, rareChests: 0 } },
    { weight: 15, roll: { coins: 6000, diamonds: 0, rareChests: 0 } },
    { weight: 12, roll: { coins: 0, diamonds: 10, rareChests: 0 } },
    { weight: 10, roll: { coins: 0, diamonds: 20, rareChests: 0 } },
    { weight: 3, roll: { coins: 0, diamonds: 0, rareChests: 1 } },
  ]);

  return {
    ...base,
    coins: Math.floor(base.coins * multiplier),
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "UPGRADE_BUSINESS": {
      const biz = BUSINESSES.find((b) => b.id === action.businessId);
      if (!biz) return state;
      const currentLevel = state.businessLevels[action.businessId] || 0;
      const cost = getUpgradeCost(biz, currentLevel);
      if (state.coins < cost) return state;
      if (biz.unlockLevel > state.level) return state;
      return applyAchievements({
        ...state,
        coins: state.coins - cost,
        businessLevels: {
          ...state.businessLevels,
          [action.businessId]: currentLevel + 1,
        },
        xp: state.xp + 10,
      });
    }
    case "HIRE_STAFF": {
      const staff = STAFF.find((s) => s.id === action.staffId);
      if (!staff) return state;
      if (state.ownedStaff.includes(action.staffId)) return state;
      if (state.coins < staff.cost) return state;
      return applyAchievements({
        ...state,
        coins: state.coins - staff.cost,
        ownedStaff: [...state.ownedStaff, action.staffId],
        xp: state.xp + 25,
      });
    }
    case "CAPTURE_DISTRICT": {
      const now = Date.now();
      const baseState = ensureDailySystems(state, now);
      if (baseState.capturedDistricts.includes(action.districtId))
        return baseState;
      const treasureHunt =
        baseState.treasureHunt.dayKey === dayKeyAt(now) &&
        !baseState.treasureHunt.claimedAt
          ? {
              ...baseState.treasureHunt,
              captures: Math.min(
                baseState.treasureHunt.requiredCaptures,
                baseState.treasureHunt.captures + 1,
              ),
            }
          : baseState.treasureHunt;
      return applyAchievements({
        ...baseState,
        coins: baseState.coins + action.reward,
        capturedDistricts: [...baseState.capturedDistricts, action.districtId],
        reputation: baseState.reputation + 50,
        xp: baseState.xp + 100,
        totalEarned: baseState.totalEarned + action.reward,
        treasureHunt,
      });
    }
    case "CHALLENGE_WIN": {
      const now = Date.now();
      const baseState = ensureDailySystems(state, now);
      const triviaStaff = state.ownedStaff.filter((s) => {
        const staff = STAFF.find((st) => st.id === s);
        return staff?.bonusType === "trivia";
      });
      const bonus = triviaStaff.reduce((acc, s) => {
        const staff = STAFF.find((st) => st.id === s);
        return acc + (staff?.bonusValue || 0);
      }, 0);
      const globalEvent = getActiveGlobalEvent(baseState, now);
      const finalReward = Math.floor(
        action.reward *
          (1 + bonus) *
          (globalEvent?.challengeRewardMultiplier ?? 1),
      );
      const treasureHunt =
        baseState.treasureHunt.dayKey === dayKeyAt(now) &&
        !baseState.treasureHunt.claimedAt
          ? {
              ...baseState.treasureHunt,
              wins: Math.min(
                baseState.treasureHunt.requiredWins,
                baseState.treasureHunt.wins + 1,
              ),
            }
          : baseState.treasureHunt;
      return applyAchievements(
        checkLevelUp({
          ...baseState,
          coins: baseState.coins + finalReward,
          challengesWon: baseState.challengesWon + 1,
          reputation: baseState.reputation + 10,
          xp: baseState.xp + action.xp,
          totalEarned: baseState.totalEarned + finalReward,
          treasureHunt,
          challengeStats: updateChallengeStats(baseState.challengeStats, {
            won: true,
            challengeId: action.challengeId,
            difficulty: action.difficulty,
            category: action.category,
            responseTimeMs: action.responseTimeMs,
          }),
        }),
      );
    }
    case "CHALLENGE_LOSE":
      return applyAchievements({
        ...ensureDailySystems(state, Date.now()),
        coins: Math.max(0, state.coins - action.penalty),
        challengesLost: state.challengesLost + 1,
        challengeStats: updateChallengeStats(state.challengeStats, {
          won: false,
          challengeId: action.challengeId,
          difficulty: action.difficulty,
          category: action.category,
          responseTimeMs: action.responseTimeMs,
        }),
      });
    case "PVP_WIN":
      return applyAchievements(
        checkLevelUp({
          ...state,
          coins: state.coins + action.coinsStolen,
          totalEarned: state.totalEarned + action.coinsStolen,
          pvpCooldowns: {
            ...state.pvpCooldowns,
            [action.rivalId]: action.cooldownUntil,
          },
          xp: state.xp + 30,
          reputation: state.reputation + 5,
        }),
      );
    case "PVP_LOSE":
      return applyAchievements({
        ...state,
        coins: Math.max(0, state.coins - action.penaltyCoins),
        pvpCooldowns: {
          ...state.pvpCooldowns,
          [action.rivalId]: action.cooldownUntil,
        },
      });
    case "COLLECT_OFFLINE":
      return applyAchievements({
        ...state,
        coins: state.coins + action.amount,
        totalEarned: state.totalEarned + action.amount,
        hasClaimedOffline: true,
      });
    case "CLAIM_DAILY": {
      const now = Date.now();
      const today = dayKeyAt(now);
      const baseState = ensureDailySystems(state, now);
      if (baseState.lastDailyClaimDate === today) return baseState;
      const nextStreak =
        baseState.lastDailyClaimDate === yesterdayKeyOf(today)
          ? baseState.dailyStreak + 1
          : 1;
      const multiplier = getDailyStreakRewardMultiplier(nextStreak);
      const coins = Math.floor(action.coins * multiplier);
      const rareChests = nextStreak % 7 === 0 ? 1 : 0;
      return applyAchievements(
        checkLevelUp({
          ...baseState,
          coins: baseState.coins + coins,
          diamonds: baseState.diamonds + action.diamonds,
          dailyStreak: nextStreak,
          lastDailyClaimDate: today,
          xp: baseState.xp + 20,
          rareChests: baseState.rareChests + rareChests,
        }),
      );
    }
    case "GRANT_REWARD":
      return applyAchievements({
        ...state,
        coins: state.coins + action.coins,
        diamonds: state.diamonds + action.diamonds,
        totalEarned: state.totalEarned + action.coins,
      });
    case "SPIN_WHEEL": {
      const now = Date.now();
      const baseState = ensureDailySystems(state, now);
      const today = dayKeyAt(now);
      const freeAvailable =
        baseState.lastSpinDate === today && baseState.spinsToday === 0;
      const costDiamonds = 5;
      if (!action.paid && !freeAvailable) return baseState;
      if (action.paid && baseState.diamonds < costDiamonds) return baseState;

      const multiplier = getDailyStreakRewardMultiplier(baseState.dailyStreak);
      const rolled = rollSpinReward(multiplier);
      const diamondsSpent = action.paid ? costDiamonds : 0;

      return applyAchievements({
        ...baseState,
        diamonds: baseState.diamonds - diamondsSpent + rolled.diamonds,
        coins: baseState.coins + rolled.coins,
        totalEarned: baseState.totalEarned + rolled.coins,
        rareChests: baseState.rareChests + rolled.rareChests,
        lastSpinDate: today,
        spinsToday: baseState.spinsToday + 1,
        lastLoot: {
          kind: "spin",
          at: now,
          coins: rolled.coins,
          diamonds: rolled.diamonds - diamondsSpent,
          rareChests: rolled.rareChests,
        },
      });
    }
    case "OPEN_RARE_CHEST": {
      if (state.rareChests < 1) return state;
      const now = Date.now();
      const baseState = ensureDailySystems(state, now);
      const multiplier = getDailyStreakRewardMultiplier(baseState.dailyStreak);
      const rolled = rollRareChestReward(multiplier);
      return applyAchievements({
        ...baseState,
        rareChests: baseState.rareChests - 1 + rolled.rareChests,
        coins: baseState.coins + rolled.coins,
        diamonds: baseState.diamonds + rolled.diamonds,
        totalEarned: baseState.totalEarned + rolled.coins,
        lastLoot: {
          kind: "rare_chest",
          at: now,
          coins: rolled.coins,
          diamonds: rolled.diamonds,
          rareChests: rolled.rareChests,
        },
      });
    }
    case "CLAIM_TREASURE_HUNT": {
      const now = Date.now();
      const baseState = ensureDailySystems(state, now);
      const th = baseState.treasureHunt;
      if (th.dayKey !== dayKeyAt(now)) return baseState;
      if (th.claimedAt) return baseState;
      if (th.wins < th.requiredWins) return baseState;
      if (th.captures < th.requiredCaptures) return baseState;

      return applyAchievements({
        ...baseState,
        coins: baseState.coins + th.rewardCoins,
        totalEarned: baseState.totalEarned + th.rewardCoins,
        rareChests: baseState.rareChests + th.rewardRareChests,
        treasureHunt: { ...th, claimedAt: now },
        lastLoot: {
          kind: "treasure",
          at: now,
          coins: th.rewardCoins,
          diamonds: 0,
          rareChests: th.rewardRareChests,
        },
      });
    }
    case "CLEAR_LAST_LOOT":
      return { ...state, lastLoot: null };
    case "SET_SKIN": {
      if (!state.unlockedSkinIds.includes(action.skinId)) return state;
      return { ...state, selectedSkinId: action.skinId };
    }
    case "PRESTIGE": {
      const empireValue = getEmpireValue(state);
      const threshold = getNextPrestigeThreshold(state.prestigeLevel);
      if (empireValue < threshold) return state;

      const prestigeLevel = state.prestigeLevel + 1;
      const unlockedSkinIds = Array.from(
        new Set([
          ...state.unlockedSkinIds,
          ...getUnlockedSkinIdsForPrestige(prestigeLevel),
        ]),
      );
      const selectedSkinId = unlockedSkinIds.includes(state.selectedSkinId)
        ? state.selectedSkinId
        : "default";

      return applyAchievements({
        ...initialState,
        prestigeLevel,
        unlockedSkinIds,
        selectedSkinId,
        achievementsUnlockedAt: state.achievementsUnlockedAt,
        badgeIds: state.badgeIds,
        totalEarned: state.totalEarned,
      });
    }
    case "TICK_INCOME": {
      const now = Date.now();
      const withDaily = ensureDailySystems(state, now);
      const { districtEvents, lastDistrictEventRollAt } = applyDistrictEvents(
        withDaily,
        now,
      );
      const districtEconomyLevels = computeDistrictEconomyLevels(withDaily);
      const globalEventExisting = getActiveGlobalEvent(withDaily, now);
      const shouldRollGlobalEvent =
        now - withDaily.lastGlobalEventRollAt >= 5 * 60 * 1000;
      const globalEvent =
        globalEventExisting ??
        (shouldRollGlobalEvent ? rollGlobalEvent(now) : null);
      const nextState = {
        ...withDaily,
        districtEconomyLevels,
        districtEvents,
        lastDistrictEventRollAt,
        globalEvent,
        lastGlobalEventRollAt: shouldRollGlobalEvent
          ? now
          : withDaily.lastGlobalEventRollAt,
      };
      const incomePerTick = Math.max(
        1,
        Math.floor(getTotalIncomePerMinute(nextState) / 60),
      );
      return applyAchievements({
        ...nextState,
        coins: nextState.coins + incomePerTick,
        totalEarned: nextState.totalEarned + incomePerTick,
        lastOnlineTime: now,
      });
    }
    case "SPEND_DIAMONDS":
      if (state.diamonds < action.amount) return state;
      return { ...state, diamonds: state.diamonds - action.amount };
    case "LOAD_STATE":
      return applyAchievements(
        ensureDailySystems(
          {
            ...action.state,
            globalEvent: getActiveGlobalEvent(action.state, Date.now()),
          },
          Date.now(),
        ),
      );
    default:
      return state;
  }
}

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  incomePerMinute: number;
  getOfflineEarnings: () => number;
}

const GameContext = createContext<GameContextType | null>(null);

const SAVE_KEY = "street_boss_save";

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [remoteLoadedForUserId, setRemoteLoadedForUserId] = useState<
    string | null
  >(null);

  // Load saved game
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<GameState>;
        dispatch({
          type: "LOAD_STATE",
          state: {
            ...initialState,
            ...parsed,
            challengeStats: {
              ...initialState.challengeStats,
              ...(parsed as GameState).challengeStats,
            },
            pvpCooldowns: {
              ...initialState.pvpCooldowns,
              ...(parsed as GameState).pvpCooldowns,
            },
            districtEconomyLevels: {
              ...initialState.districtEconomyLevels,
              ...(parsed as GameState).districtEconomyLevels,
            },
            districtEvents: {
              ...initialState.districtEvents,
              ...(parsed as GameState).districtEvents,
            },
            lastDistrictEventRollAt:
              (parsed as GameState).lastDistrictEventRollAt ??
              initialState.lastDistrictEventRollAt,
            achievementsUnlockedAt: {
              ...initialState.achievementsUnlockedAt,
              ...(parsed as GameState).achievementsUnlockedAt,
            },
            badgeIds: Array.isArray((parsed as GameState).badgeIds)
              ? (parsed as GameState).badgeIds
              : initialState.badgeIds,
            prestigeLevel:
              (parsed as GameState).prestigeLevel ?? initialState.prestigeLevel,
            unlockedSkinIds: Array.isArray(
              (parsed as GameState).unlockedSkinIds,
            )
              ? (parsed as GameState).unlockedSkinIds
              : initialState.unlockedSkinIds,
            selectedSkinId:
              (parsed as GameState).selectedSkinId ??
              initialState.selectedSkinId,
            rareChests:
              (parsed as GameState).rareChests ?? initialState.rareChests,
            lastSpinDate:
              (parsed as GameState).lastSpinDate ?? initialState.lastSpinDate,
            spinsToday:
              (parsed as GameState).spinsToday ?? initialState.spinsToday,
            treasureHunt: (parsed as GameState).treasureHunt?.dayKey
              ? {
                  ...initialState.treasureHunt,
                  ...(parsed as GameState).treasureHunt,
                }
              : initialState.treasureHunt,
            globalEvent:
              (parsed as GameState).globalEvent ?? initialState.globalEvent,
            lastGlobalEventRollAt:
              (parsed as GameState).lastGlobalEventRollAt ??
              initialState.lastGlobalEventRollAt,
            lastLoot: null,
            hasClaimedOffline: false,
          },
        });
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setRemoteLoadedForUserId(null);
      return;
    }
    if (remoteLoadedForUserId === user.id) return;

    let cancelled = false;
    (async () => {
      try {
        await rpcCollectIdleIncome(user.id);
      } catch {
        /* ignore */
      }

      const [profileRes, businessesRes, staffRes, districtsRes] =
        await Promise.all([
          loadProfile(user.id),
          loadPlayerBusinesses(user.id),
          loadPlayerStaff(user.id),
          loadPlayerDistricts(user.id),
        ]);

      if (cancelled) return;

      const profile = profileRes.data;
      const businessLevels = { ...initialState.businessLevels };
      const ownedStaff: string[] = [];
      const capturedDistricts: string[] = [];

      if (Array.isArray(businessesRes.data)) {
        for (const row of businessesRes.data as Array<
          Record<string, unknown>
        >) {
          const bizId =
            (typeof row.business_id === "string" && row.business_id) ||
            (typeof row.businessId === "string" && row.businessId) ||
            (typeof row.business === "string" && row.business) ||
            null;
          const lvl =
            (typeof row.level === "number" && row.level) ||
            (typeof row.business_level === "number" && row.business_level) ||
            (typeof row.lvl === "number" && row.lvl) ||
            null;
          if (typeof bizId === "string" && typeof lvl === "number") {
            businessLevels[bizId] = Math.max(0, Math.floor(lvl));
          }
        }
      }

      if (Array.isArray(staffRes.data)) {
        for (const row of staffRes.data as Array<Record<string, unknown>>) {
          const staffId =
            (typeof row.staff_id === "string" && row.staff_id) ||
            (typeof row.staffId === "string" && row.staffId) ||
            (typeof row.staff === "string" && row.staff) ||
            null;
          if (typeof staffId === "string") ownedStaff.push(staffId);
        }
      }

      if (Array.isArray(districtsRes.data)) {
        for (const row of districtsRes.data as Array<Record<string, unknown>>) {
          const districtId =
            (typeof row.district_id === "string" && row.district_id) ||
            (typeof row.districtId === "string" && row.districtId) ||
            (typeof row.district === "string" && row.district) ||
            null;
          if (typeof districtId === "string")
            capturedDistricts.push(districtId);
        }
      }

      dispatch({
        type: "LOAD_STATE",
        state: {
          ...initialState,
          coins: profile?.coins ?? initialState.coins,
          diamonds: profile?.diamonds ?? initialState.diamonds,
          level: profile?.level ?? initialState.level,
          xp: profile?.xp ?? initialState.xp,
          reputation: profile?.reputation ?? initialState.reputation,
          totalEarned: profile?.total_earned ?? initialState.totalEarned,
          dailyStreak: profile?.daily_streak ?? initialState.dailyStreak,
          lastDailyClaimDate:
            profile?.last_daily_claim_date ?? initialState.lastDailyClaimDate,
          businessLevels,
          ownedStaff,
          capturedDistricts:
            capturedDistricts.length > 0
              ? capturedDistricts
              : initialState.capturedDistricts,
          hasClaimedOffline: false,
        },
      });

      setRemoteLoadedForUserId(user.id);
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, remoteLoadedForUserId]);

  useEffect(() => {
    if (!user?.id) return;
    const timer = setInterval(async () => {
      try {
        await supabase
          .from("profiles")
          .update({
            coins: state.coins,
            diamonds: state.diamonds,
            level: state.level,
            xp: state.xp,
            reputation: state.reputation,
            total_earned: state.totalEarned,
            daily_streak: state.dailyStreak,
            last_daily_claim_date: state.lastDailyClaimDate,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
      } catch {
        /* ignore */
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [
    user?.id,
    state.coins,
    state.diamonds,
    state.level,
    state.xp,
    state.reputation,
    state.totalEarned,
    state.dailyStreak,
    state.lastDailyClaimDate,
  ]);

  useEffect(() => {
    if (!user?.id) return;

    const leaderboardChannel = supabase
      .channel("leaderboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leaderboard" },
        () => {
          toast({
            title: "Leaderboard updated",
            description: "New rankings are available",
          });
        },
      )
      .subscribe();

    const battlesChannel = supabase
      .channel("battles")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "battles" },
        (payload) => {
          const row = (payload.new ?? payload.old) as Record<
            string,
            unknown
          > | null;
          const playerId =
            (row && typeof row.player_id === "string" && row.player_id) ||
            (row && typeof row.playerId === "string" && row.playerId) ||
            null;
          if (playerId !== user.id) return;
          toast({
            title: "Battle update",
            description: "Your battle result has changed",
          });
        },
      )
      .subscribe();

    const districtChannel = supabase
      .channel("district_updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "player_districts" },
        (payload) => {
          const row = (payload.new ?? payload.old) as Record<
            string,
            unknown
          > | null;
          const playerId =
            (row && typeof row.player_id === "string" && row.player_id) ||
            (row && typeof row.playerId === "string" && row.playerId) ||
            null;
          if (playerId !== user.id) return;
          toast({
            title: "District update",
            description: "District ownership changed",
          });
        },
      )
      .subscribe();

    return () => {
      leaderboardChannel.unsubscribe();
      battlesChannel.unsubscribe();
      districtChannel.unsubscribe();
    };
  }, [user?.id]);

  // Save game every 5s
  useEffect(() => {
    const timer = setInterval(() => {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    }, 5000);
    return () => clearInterval(timer);
  }, [state]);

  // Income tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      dispatch({ type: "TICK_INCOME" });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const incomePerMinute = getTotalIncomePerMinute(state);

  const getOfflineEarnings = useCallback(() => {
    const now = Date.now();
    const elapsed = (now - state.lastOnlineTime) / 60000; // minutes
    if (elapsed < 1) return 0;
    const maxMinutes = 480; // 8 hours max
    const minutes = Math.min(elapsed, maxMinutes);
    let offlineRate = 0.5;
    const offlineStaff = state.ownedStaff.filter((s) => {
      const staff = STAFF.find((st) => st.id === s);
      return staff?.bonusType === "offline";
    });
    offlineRate += offlineStaff.reduce((acc, s) => {
      const staff = STAFF.find((st) => st.id === s);
      return acc + (staff?.bonusValue || 0);
    }, 0);
    return Math.floor(incomePerMinute * minutes * offlineRate);
  }, [state.lastOnlineTime, state.ownedStaff, incomePerMinute]);

  return (
    <GameContext.Provider
      value={{ state, dispatch, incomePerMinute, getOfflineEarnings }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be within GameProvider");
  return ctx;
}
