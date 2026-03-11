// Game data: businesses, districts, staff, challenges

import { getRandomQuestion, type QuestionCategory } from "./questionBank";

export interface Business {
  id: string;
  name: string;
  nameAr: string;
  emoji: string;
  baseIncome: number;
  baseCost: number;
  costMultiplier: number;
  unlockLevel: number;
}

export interface District {
  id: string;
  name: string;
  nameAr: string;
  emoji: string;
  unlockLevel: number;
  captureReward: number;
  businesses: string[];
  bossName: string;
  bossTitle: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  emoji: string;
  bonus: string;
  bonusType: "income" | "offline" | "defense" | "trivia";
  bonusValue: number;
  cost: number;
  unlockLevel: number;
  unlockPrestigeLevel?: number;
}

export type DifficultyTier = "easy" | "medium" | "hard" | "expert";

export type EconomyLevel = "poor" | "growing" | "busy" | "booming";

export interface Challenge {
  id: string;
  type?: "trivia" | "logic" | "riddle" | "speed";
  category: QuestionCategory;
  question: string;
  options: [string, string, string, string];
  correctAnswer: number;
  explanation: string;
  difficulty: DifficultyTier;
  reward: number;
  timeLimit: number;
}

export const DIFFICULTY_REWARDS: Record<DifficultyTier, number> = {
  easy: 100,
  medium: 250,
  hard: 600,
  expert: 1200,
};

export const ECONOMY_MULTIPLIERS: Record<EconomyLevel, number> = {
  poor: 0.8,
  growing: 1.0,
  busy: 1.3,
  booming: 1.8,
};

export const BUSINESSES: Business[] = [
  {
    id: "manoushe",
    name: "Manoushe Stand",
    nameAr: "فرن منقوشة",
    emoji: "🫓",
    baseIncome: 5,
    baseCost: 50,
    costMultiplier: 1.12,
    unlockLevel: 1,
  },
  {
    id: "shawarma",
    name: "Shawarma Truck",
    nameAr: "عربة شاورما",
    emoji: "🌯",
    baseIncome: 15,
    baseCost: 200,
    costMultiplier: 1.13,
    unlockLevel: 2,
  },
  {
    id: "carwash",
    name: "Car Wash",
    nameAr: "غسيل سيارات",
    emoji: "🚗",
    baseIncome: 40,
    baseCost: 800,
    costMultiplier: 1.14,
    unlockLevel: 4,
  },
  {
    id: "ahwe",
    name: "Ahwe House",
    nameAr: "بيت القهوة",
    emoji: "☕",
    baseIncome: 120,
    baseCost: 3000,
    costMultiplier: 1.15,
    unlockLevel: 7,
  },
  {
    id: "argileh",
    name: "Argileh Lounge",
    nameAr: "صالون أراكيل",
    emoji: "💨",
    baseIncome: 350,
    baseCost: 12000,
    costMultiplier: 1.16,
    unlockLevel: 12,
  },
  {
    id: "nightclub",
    name: "Night Club",
    nameAr: "ملهى ليلي",
    emoji: "🎵",
    baseIncome: 1000,
    baseCost: 50000,
    costMultiplier: 1.17,
    unlockLevel: 20,
  },
  {
    id: "casino",
    name: "Casino du Liban",
    nameAr: "كازينو لبنان",
    emoji: "🎰",
    baseIncome: 3500,
    baseCost: 250000,
    costMultiplier: 1.18,
    unlockLevel: 30,
  },
];

export const DISTRICTS: District[] = [
  {
    id: "hamra",
    name: "Hamra",
    nameAr: "الحمرا",
    emoji: "🏙️",
    unlockLevel: 1,
    captureReward: 500,
    businesses: ["manoushe", "shawarma"],
    bossName: "Abu Fadi",
    bossTitle: "The Veteran",
  },
  {
    id: "gemmayzeh",
    name: "Gemmayzeh",
    nameAr: "الجميزة",
    emoji: "🎭",
    unlockLevel: 3,
    captureReward: 1500,
    businesses: ["ahwe", "argileh"],
    bossName: "Tony B",
    bossTitle: "Night King",
  },
  {
    id: "downtown",
    name: "Downtown Beirut",
    nameAr: "وسط بيروت",
    emoji: "🏛️",
    unlockLevel: 6,
    captureReward: 5000,
    businesses: ["carwash", "ahwe"],
    bossName: "Nadia K",
    bossTitle: "The Strategist",
  },
  {
    id: "jounieh",
    name: "Jounieh Bay",
    nameAr: "خليج جونية",
    emoji: "⛵",
    unlockLevel: 10,
    captureReward: 15000,
    businesses: ["nightclub", "argileh"],
    bossName: "Charbel X",
    bossTitle: "Bay Lord",
  },
  {
    id: "byblos",
    name: "Byblos",
    nameAr: "جبيل",
    emoji: "🏺",
    unlockLevel: 15,
    captureReward: 40000,
    businesses: ["nightclub", "casino"],
    bossName: "Rami Z",
    bossTitle: "The Ancient",
  },
  {
    id: "baalbek",
    name: "Baalbek",
    nameAr: "بعلبك",
    emoji: "🏛️",
    unlockLevel: 25,
    captureReward: 120000,
    businesses: ["casino"],
    bossName: "Ziad M",
    bossTitle: "Temple Guardian",
  },
];

export const STAFF: StaffMember[] = [
  {
    id: "manager",
    name: "Manager",
    role: "مدير",
    emoji: "👔",
    bonus: "+20% income",
    bonusType: "income",
    bonusValue: 0.2,
    cost: 1000,
    unlockLevel: 3,
  },
  {
    id: "accountant",
    name: "Accountant",
    role: "محاسب",
    emoji: "📊",
    bonus: "+15% offline earnings",
    bonusType: "offline",
    bonusValue: 0.15,
    cost: 2500,
    unlockLevel: 5,
  },
  {
    id: "bodyguard",
    name: "Bodyguard",
    role: "حارس",
    emoji: "🕶️",
    bonus: "+10% defense",
    bonusType: "defense",
    bonusValue: 0.1,
    cost: 5000,
    unlockLevel: 8,
  },
  {
    id: "strategist",
    name: "Strategist",
    role: "محلل",
    emoji: "🧠",
    bonus: "+15% trivia rewards",
    bonusType: "trivia",
    bonusValue: 0.15,
    cost: 8000,
    unlockLevel: 12,
  },
  {
    id: "chef",
    name: "Master Chef",
    role: "شيف",
    emoji: "👨‍🍳",
    bonus: "+30% food income",
    bonusType: "income",
    bonusValue: 0.3,
    cost: 15000,
    unlockLevel: 18,
  },
  {
    id: "fixer",
    name: "The Fixer",
    role: "المصلح",
    emoji: "🔧",
    bonus: "+25% all bonuses",
    bonusType: "income",
    bonusValue: 0.25,
    cost: 50000,
    unlockLevel: 25,
  },
  {
    id: "consigliere",
    name: "Consigliere",
    role: "المستشار",
    emoji: "🦊",
    bonus: "+35% income",
    bonusType: "income",
    bonusValue: 0.35,
    cost: 120000,
    unlockLevel: 1,
    unlockPrestigeLevel: 1,
  },
  {
    id: "shadow_banker",
    name: "Shadow Banker",
    role: "مصرفي",
    emoji: "🏦",
    bonus: "+35% offline earnings",
    bonusType: "offline",
    bonusValue: 0.35,
    cost: 200000,
    unlockLevel: 1,
    unlockPrestigeLevel: 3,
  },
  {
    id: "legendary_guard",
    name: "Legendary Guard",
    role: "حارس أسطوري",
    emoji: "🦁",
    bonus: "+25% defense",
    bonusType: "defense",
    bonusValue: 0.25,
    cost: 350000,
    unlockLevel: 1,
    unlockPrestigeLevel: 5,
  },
];

export const DAILY_REWARDS = [
  { day: 1, type: "coins" as const, amount: 100, label: "100 Coins" },
  { day: 2, type: "coins" as const, amount: 250, label: "250 Coins" },
  { day: 3, type: "diamonds" as const, amount: 5, label: "5 Diamonds" },
  { day: 4, type: "coins" as const, amount: 500, label: "500 Coins" },
  { day: 5, type: "coins" as const, amount: 750, label: "750 Coins" },
  { day: 6, type: "diamonds" as const, amount: 15, label: "15 Diamonds" },
  {
    day: 7,
    type: "coins" as const,
    amount: 2000,
    label: "2000 Coins + Rare Chest",
  },
];

export function getUpgradeCost(
  business: Business,
  currentLevel: number,
): number {
  return Math.floor(
    business.baseCost * Math.pow(business.costMultiplier, currentLevel),
  );
}

export function getIncomePerMinute(business: Business, level: number): number {
  if (level === 0) return 0;
  return Math.floor(business.baseIncome * level * (1 + level * 0.05));
}

export function getLevelXP(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function getRandomChallenge(options?: {
  difficulty?: DifficultyTier;
  category?: QuestionCategory;
  avoidIds?: string[];
}): Challenge {
  const q = getRandomQuestion({
    difficulty: options?.difficulty,
    category: options?.category,
    avoidIds: options?.avoidIds,
  });

  const type =
    q.category === "Logic"
      ? "logic"
      : q.category === "Technology" || q.category === "Quick-thinking"
        ? "speed"
        : q.category === "Riddle"
          ? "riddle"
          : "trivia";

  const reward = DIFFICULTY_REWARDS[q.difficulty];
  const timeLimit =
    q.timeLimitSec ??
    (q.difficulty === "easy"
      ? 15
      : q.difficulty === "medium"
        ? 12
        : q.difficulty === "hard"
          ? 11
          : 10);

  return {
    id: q.id,
    type,
    category: q.category,
    question: q.text,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    difficulty: q.difficulty,
    reward,
    timeLimit,
  };
}
