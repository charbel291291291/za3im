import type { DifficultyTier } from "./gameData";

export type QuestionCategory =
  | "Science"
  | "History"
  | "Geography"
  | "Technology"
  | "Logic"
  | "Pop culture"
  | "Math"
  | "Riddle"
  | "Pattern"
  | "Quick-thinking"
  | "General Knowledge";

export type AnswerIndex = 0 | 1 | 2 | 3;

export interface Question {
  id: string;
  category: QuestionCategory;
  difficulty: DifficultyTier;
  text: string;
  options: [string, string, string, string];
  correctAnswer: AnswerIndex;
  explanation: string;
  timeLimitSec?: number;
}

type LegacyChallenge = {
  id: string;
  type: "trivia" | "logic" | "riddle" | "speed";
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: DifficultyTier;
  reward: number;
  timeLimit: number;
};

function clampAnswerIndex(n: number): AnswerIndex {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  if (n === 2) return 2;
  return 3;
}

function toFourOptions(options: string[]): [string, string, string, string] {
  const padded = [...options];
  while (padded.length < 4) padded.push("");
  return [padded[0], padded[1], padded[2], padded[3]];
}

function categoryFromLegacyType(
  type: LegacyChallenge["type"],
): QuestionCategory {
  if (type === "logic") return "Logic";
  if (type === "riddle") return "Logic";
  if (type === "speed") return "Science";
  return "History";
}

const LEGACY_CHALLENGES: LegacyChallenge[] = [
  {
    id: "t1",
    type: "trivia",
    question: "What is the capital of Lebanon?",
    options: ["Tripoli", "Beirut", "Sidon", "Byblos"],
    correctAnswer: 1,
    difficulty: "easy",
    reward: 100,
    timeLimit: 15,
  },
  {
    id: "t2",
    type: "trivia",
    question: "Which tree appears on the Lebanese flag?",
    options: ["Oak", "Olive", "Cedar", "Palm"],
    correctAnswer: 2,
    difficulty: "easy",
    reward: 100,
    timeLimit: 15,
  },
  {
    id: "t3",
    type: "trivia",
    question: "What is the traditional Lebanese bread called?",
    options: ["Naan", "Pita", "Khobz Markouk", "Tortilla"],
    correctAnswer: 2,
    difficulty: "easy",
    reward: 100,
    timeLimit: 15,
  },
  {
    id: "t4",
    type: "trivia",
    question:
      "Which ancient city in Lebanon is one of the oldest continuously inhabited cities?",
    options: ["Tyre", "Byblos", "Tripoli", "Zahle"],
    correctAnswer: 1,
    difficulty: "medium",
    reward: 250,
    timeLimit: 12,
  },
  {
    id: "t5",
    type: "trivia",
    question: 'What is "tabouleh" primarily made of?',
    options: ["Rice", "Couscous", "Parsley & Bulgur", "Lentils"],
    correctAnswer: 2,
    difficulty: "easy",
    reward: 100,
    timeLimit: 15,
  },
  {
    id: "t6",
    type: "trivia",
    question: 'Which Lebanese singer is known as "The Sun"?',
    options: ["Fairuz", "Nancy Ajram", "Elissa", "Majida El Roumi"],
    correctAnswer: 0,
    difficulty: "medium",
    reward: 250,
    timeLimit: 12,
  },
  {
    id: "t7",
    type: "trivia",
    question: "What currency is used in Lebanon?",
    options: ["Dollar", "Dinar", "Lira", "Riyal"],
    correctAnswer: 2,
    difficulty: "easy",
    reward: 100,
    timeLimit: 15,
  },
  {
    id: "t8",
    type: "trivia",
    question: "The Phoenicians invented which writing system?",
    options: ["Cuneiform", "Hieroglyphics", "Alphabet", "Runes"],
    correctAnswer: 2,
    difficulty: "medium",
    reward: 250,
    timeLimit: 12,
  },
  {
    id: "t9",
    type: "trivia",
    question: "Which sea borders Lebanon to the west?",
    options: ["Black Sea", "Red Sea", "Mediterranean Sea", "Arabian Sea"],
    correctAnswer: 2,
    difficulty: "easy",
    reward: 100,
    timeLimit: 15,
  },
  {
    id: "t10",
    type: "trivia",
    question: "Which Lebanese city is famous for its ancient Roman ruins?",
    options: ["Baalbek", "Zahle", "Batroun", "Bint Jbeil"],
    correctAnswer: 0,
    difficulty: "easy",
    reward: 100,
    timeLimit: 15,
  },
  {
    id: "t11",
    type: "trivia",
    question: "What is the main ingredient of hummus?",
    options: ["Chickpeas", "Lentils", "Rice", "Potatoes"],
    correctAnswer: 0,
    difficulty: "easy",
    reward: 100,
    timeLimit: 15,
  },
  {
    id: "t12",
    type: "trivia",
    question: "Which Lebanese dish is made with parsley, tomatoes, and bulgur?",
    options: ["Fattoush", "Tabouleh", "Kibbeh", "Mujaddara"],
    correctAnswer: 1,
    difficulty: "easy",
    reward: 100,
    timeLimit: 15,
  },
  {
    id: "t13",
    type: "trivia",
    question: "The Jeita Grotto is near which Lebanese city?",
    options: ["Jounieh", "Tripoli", "Tyre", "Zahle"],
    correctAnswer: 0,
    difficulty: "medium",
    reward: 250,
    timeLimit: 12,
  },
  {
    id: "t14",
    type: "trivia",
    question: "Which ancient port city is located in southern Lebanon?",
    options: ["Byblos", "Tyre", "Baalbek", "Sidon"],
    correctAnswer: 1,
    difficulty: "medium",
    reward: 250,
    timeLimit: 12,
  },
  {
    id: "t15",
    type: "trivia",
    question: 'What does "ahwe" typically refer to in Lebanese Arabic?',
    options: ["Coffee", "Bread", "Market", "River"],
    correctAnswer: 0,
    difficulty: "medium",
    reward: 250,
    timeLimit: 12,
  },
  {
    id: "t16",
    type: "trivia",
    question: "Which mountain range runs through Lebanon?",
    options: ["Atlas", "Andes", "Lebanon Mountains", "Himalayas"],
    correctAnswer: 2,
    difficulty: "medium",
    reward: 250,
    timeLimit: 12,
  },
  {
    id: "t17",
    type: "trivia",
    question: "Which is a UNESCO World Heritage site in Lebanon?",
    options: ["Baalbek", "Hamra Street", "The Corniche", "Raouche Rocks"],
    correctAnswer: 0,
    difficulty: "hard",
    reward: 600,
    timeLimit: 11,
  },
  {
    id: "t18",
    type: "trivia",
    question: "Which empire built the Temple of Jupiter at Baalbek?",
    options: ["Roman", "Ottoman", "Persian", "Phoenician"],
    correctAnswer: 0,
    difficulty: "hard",
    reward: 600,
    timeLimit: 11,
  },
  {
    id: "t19",
    type: "trivia",
    question:
      "In which century did the Phoenician alphabet spread widely across the Mediterranean?",
    options: ["2nd", "6th", "10th", "14th"],
    correctAnswer: 2,
    difficulty: "expert",
    reward: 1200,
    timeLimit: 10,
  },
  {
    id: "t20",
    type: "trivia",
    question:
      "Which geological feature largely formed the fertile Bekaa Valley?",
    options: ["Rift valley", "Volcanic crater", "Glacier basin", "River delta"],
    correctAnswer: 0,
    difficulty: "expert",
    reward: 1200,
    timeLimit: 10,
  },
  {
    id: "l1",
    type: "logic",
    question: "What number completes: 2, 6, 12, 20, ?",
    options: ["28", "30", "32", "24"],
    correctAnswer: 1,
    difficulty: "medium",
    reward: 250,
    timeLimit: 12,
  },
  {
    id: "l2",
    type: "logic",
    question: "If 3 manoushe cost 9000 LL, how much do 7 cost?",
    options: ["18000", "21000", "24000", "15000"],
    correctAnswer: 1,
    difficulty: "easy",
    reward: 100,
    timeLimit: 15,
  },
  {
    id: "l3",
    type: "logic",
    question: "Complete: 1, 1, 2, 3, 5, 8, ?",
    options: ["11", "12", "13", "10"],
    correctAnswer: 2,
    difficulty: "medium",
    reward: 250,
    timeLimit: 12,
  },
  {
    id: "l4",
    type: "logic",
    question:
      "A taxi from Hamra to Downtown takes 10 min. 3 taxis leave at the same time. When do they all arrive?",
    options: ["30 min", "10 min", "20 min", "15 min"],
    correctAnswer: 1,
    difficulty: "easy",
    reward: 100,
    timeLimit: 15,
  },
  {
    id: "l5",
    type: "logic",
    question: "What number completes: 3, 9, 27, ?, 243",
    options: ["54", "81", "108", "162"],
    correctAnswer: 1,
    difficulty: "easy",
    reward: 100,
    timeLimit: 15,
  },
  {
    id: "l6",
    type: "logic",
    question: "A shop sells 5 shawarma for 25,000 LL. How much for 8 shawarma?",
    options: ["30,000", "35,000", "40,000", "45,000"],
    correctAnswer: 2,
    difficulty: "easy",
    reward: 100,
    timeLimit: 15,
  },
  {
    id: "l7",
    type: "logic",
    question: "Find the next number: 1, 4, 9, 16, ?",
    options: ["20", "24", "25", "26"],
    correctAnswer: 2,
    difficulty: "easy",
    reward: 100,
    timeLimit: 15,
  },
  {
    id: "l8",
    type: "logic",
    question: "If A=1, B=2, C=3, what is the sum of L + E + B?",
    options: ["17", "18", "19", "20"],
    correctAnswer: 2,
    difficulty: "medium",
    reward: 250,
    timeLimit: 12,
  },
  {
    id: "l9",
    type: "logic",
    question: "A sequence increases by odd numbers: 2, 5, 10, 17, ?",
    options: ["24", "25", "26", "27"],
    correctAnswer: 1,
    difficulty: "medium",
    reward: 250,
    timeLimit: 12,
  },
  {
    id: "l10",
    type: "logic",
    question:
      "How many different 2-digit numbers can be formed using digits 1, 2, 3 without repetition?",
    options: ["3", "6", "9", "12"],
    correctAnswer: 1,
    difficulty: "hard",
    reward: 600,
    timeLimit: 11,
  },
  {
    id: "l11",
    type: "logic",
    question: "If today is Wednesday, what day will it be 100 days from today?",
    options: ["Thursday", "Friday", "Saturday", "Sunday"],
    correctAnswer: 1,
    difficulty: "hard",
    reward: 600,
    timeLimit: 11,
  },
  {
    id: "l12",
    type: "logic",
    question:
      "A three-digit number has digits that sum to 12. If you reverse the digits, the number increases by 198. What is the number?",
    options: ["246", "237", "156", "174"],
    correctAnswer: 0,
    difficulty: "expert",
    reward: 1200,
    timeLimit: 10,
  },
  {
    id: "l13",
    type: "logic",
    question:
      "In a group, each person shakes hands with every other person once. If there are 66 handshakes, how many people are there?",
    options: ["11", "12", "13", "14"],
    correctAnswer: 2,
    difficulty: "expert",
    reward: 1200,
    timeLimit: 10,
  },
  {
    id: "r1",
    type: "riddle",
    question:
      "I speak without a mouth and hear without ears. I have no body, but come alive with wind. What am I?",
    options: ["Shadow", "Echo", "Dream", "Music"],
    correctAnswer: 1,
    difficulty: "medium",
    reward: 250,
    timeLimit: 18,
  },
  {
    id: "r2",
    type: "riddle",
    question:
      "I stand tall in the mountains of Lebanon. I live for thousands of years. What am I?",
    options: ["A temple", "A cedar tree", "A fortress", "A river"],
    correctAnswer: 1,
    difficulty: "easy",
    reward: 100,
    timeLimit: 20,
  },
  {
    id: "r3",
    type: "riddle",
    question: "The more you take, the more you leave behind. What are they?",
    options: ["Memories", "Footsteps", "Breaths", "Coins"],
    correctAnswer: 1,
    difficulty: "medium",
    reward: 250,
    timeLimit: 18,
  },
  {
    id: "r4",
    type: "riddle",
    question:
      "I have keys but no locks. I have space but no room. You can enter but can’t go outside. What am I?",
    options: ["A map", "A keyboard", "A book", "A wallet"],
    correctAnswer: 1,
    difficulty: "easy",
    reward: 100,
    timeLimit: 20,
  },
  {
    id: "r5",
    type: "riddle",
    question: "What has to be broken before you can use it?",
    options: ["A promise", "An egg", "A lock", "A coin"],
    correctAnswer: 1,
    difficulty: "easy",
    reward: 100,
    timeLimit: 20,
  },
  {
    id: "r6",
    type: "riddle",
    question:
      "I’m found in socks, scarves and mittens; and often in the paws of playful kittens. What am I?",
    options: ["Yarn", "Sand", "Snow", "Feathers"],
    correctAnswer: 0,
    difficulty: "medium",
    reward: 250,
    timeLimit: 18,
  },
  {
    id: "r7",
    type: "riddle",
    question: "What gets wetter as it dries?",
    options: ["Sponge", "Towel", "Soap", "Rain"],
    correctAnswer: 1,
    difficulty: "medium",
    reward: 250,
    timeLimit: 18,
  },
  {
    id: "r8",
    type: "riddle",
    question: "I can be cracked, made, told, and played. What am I?",
    options: ["A song", "A joke", "A game", "A glass"],
    correctAnswer: 1,
    difficulty: "hard",
    reward: 600,
    timeLimit: 16,
  },
  {
    id: "r9",
    type: "riddle",
    question:
      "You see a boat filled with people, yet there isn’t a single person on board. How is that possible?",
    options: [
      "They are hiding",
      "It is a picture",
      "All are married",
      "It is underwater",
    ],
    correctAnswer: 2,
    difficulty: "hard",
    reward: 600,
    timeLimit: 16,
  },
  {
    id: "r10",
    type: "riddle",
    question:
      "I am not alive, but I grow. I don’t have lungs, but I need air. I don’t have a mouth, but water kills me. What am I?",
    options: ["Fire", "Shadow", "Cloud", "Metal"],
    correctAnswer: 0,
    difficulty: "expert",
    reward: 1200,
    timeLimit: 14,
  },
  {
    id: "r11",
    type: "riddle",
    question:
      "A man looks at a portrait and says: “Brothers and sisters I have none, but that man’s father is my father’s son.” Who is in the portrait?",
    options: ["His son", "His father", "Himself", "His uncle"],
    correctAnswer: 0,
    difficulty: "expert",
    reward: 1200,
    timeLimit: 14,
  },
  {
    id: "s1",
    type: "speed",
    question: "Quick! 15 × 4 = ?",
    options: ["50", "55", "60", "65"],
    correctAnswer: 2,
    difficulty: "easy",
    reward: 100,
    timeLimit: 10,
  },
  {
    id: "s2",
    type: "speed",
    question: "Quick! What is the 5th letter of the alphabet?",
    options: ["D", "E", "F", "G"],
    correctAnswer: 1,
    difficulty: "easy",
    reward: 100,
    timeLimit: 10,
  },
  {
    id: "s3",
    type: "speed",
    question: "Quick! 144 ÷ 12 = ?",
    options: ["10", "11", "12", "14"],
    correctAnswer: 2,
    difficulty: "medium",
    reward: 250,
    timeLimit: 9,
  },
  {
    id: "s4",
    type: "speed",
    question: "Quick! 18 × 7 = ?",
    options: ["116", "126", "136", "146"],
    correctAnswer: 1,
    difficulty: "medium",
    reward: 250,
    timeLimit: 9,
  },
  {
    id: "s5",
    type: "speed",
    question: "Quick! 7² = ?",
    options: ["42", "47", "49", "56"],
    correctAnswer: 2,
    difficulty: "medium",
    reward: 250,
    timeLimit: 9,
  },
  {
    id: "s6",
    type: "speed",
    question: "Quick! 625 ÷ 25 = ?",
    options: ["20", "25", "30", "35"],
    correctAnswer: 1,
    difficulty: "hard",
    reward: 600,
    timeLimit: 8,
  },
  {
    id: "s7",
    type: "speed",
    question: "Quick! 9 × 12 = ?",
    options: ["96", "108", "112", "120"],
    correctAnswer: 1,
    difficulty: "hard",
    reward: 600,
    timeLimit: 8,
  },
  {
    id: "s8",
    type: "speed",
    question: "Quick! What is 30% of 250?",
    options: ["65", "70", "75", "80"],
    correctAnswer: 2,
    difficulty: "hard",
    reward: 600,
    timeLimit: 8,
  },
  {
    id: "s9",
    type: "speed",
    question: "Quick! 13 × 17 = ?",
    options: ["201", "211", "221", "231"],
    correctAnswer: 2,
    difficulty: "expert",
    reward: 1200,
    timeLimit: 8,
  },
  {
    id: "s10",
    type: "speed",
    question: "Quick! 999 + 1 = ?",
    options: ["1000", "1001", "1010", "1100"],
    correctAnswer: 0,
    difficulty: "easy",
    reward: 100,
    timeLimit: 10,
  },
];

const EXTRA_QUESTIONS: Question[] = [
  {
    id: "sc1",
    category: "Science",
    difficulty: "easy",
    text: "What gas do plants absorb from the atmosphere?",
    options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"],
    correctAnswer: 1,
    explanation: "Plants absorb carbon dioxide to perform photosynthesis.",
  },
  {
    id: "geo1",
    category: "Geography",
    difficulty: "easy",
    text: "Which is the largest ocean on Earth?",
    options: ["Atlantic", "Pacific", "Indian", "Arctic"],
    correctAnswer: 1,
    explanation: "The Pacific Ocean is the largest by area.",
  },
  {
    id: "tech1",
    category: "Technology",
    difficulty: "easy",
    text: "What does 'HTTP' stand for?",
    options: [
      "HyperText Transfer Protocol",
      "High Transfer Text Program",
      "Hyperlink Transmission Process",
      "Host Transfer Text Protocol",
    ],
    correctAnswer: 0,
    explanation: "HTTP stands for HyperText Transfer Protocol.",
  },
  {
    id: "pc1",
    category: "Pop culture",
    difficulty: "easy",
    text: "Which platform is primarily used for short-form vertical videos?",
    options: ["TikTok", "LinkedIn", "GitHub", "Wikipedia"],
    correctAnswer: 0,
    explanation: "TikTok popularized short-form vertical videos.",
  },
  {
    id: "hist1",
    category: "History",
    difficulty: "medium",
    text: "Which empire was ruled by Julius Caesar?",
    options: [
      "Roman Republic",
      "Ottoman Empire",
      "British Empire",
      "Mongol Empire",
    ],
    correctAnswer: 0,
    explanation: "Julius Caesar was a leader in the Roman Republic era.",
  },
];

export const QUESTIONS: Question[] = [
  ...LEGACY_CHALLENGES.map((c) => {
    const options = toFourOptions(c.options);
    const correct = clampAnswerIndex(c.correctAnswer);
    const explanation = `Correct answer: ${options[correct]}.`;
    return {
      id: c.id,
      category: categoryFromLegacyType(c.type),
      difficulty: c.difficulty,
      text: c.question,
      options,
      correctAnswer: correct,
      explanation,
      timeLimitSec: c.timeLimit,
    } satisfies Question;
  }),
  ...EXTRA_QUESTIONS,
];

type QuestionIndex = {
  all: Question[];
  byDifficulty: Record<DifficultyTier, Question[]>;
  byDifficultyCategory: Record<
    DifficultyTier,
    Partial<Record<QuestionCategory, Question[]>>
  >;
};

function buildIndex(questions: Question[]): QuestionIndex {
  const byDifficulty: Record<DifficultyTier, Question[]> = {
    easy: [],
    medium: [],
    hard: [],
    expert: [],
  };
  const byDifficultyCategory: QuestionIndex["byDifficultyCategory"] = {
    easy: {},
    medium: {},
    hard: {},
    expert: {},
  };

  for (const q of questions) {
    byDifficulty[q.difficulty].push(q);
    const curr = byDifficultyCategory[q.difficulty][q.category] ?? [];
    byDifficultyCategory[q.difficulty][q.category] = [...curr, q];
  }

  return { all: questions, byDifficulty, byDifficultyCategory };
}

const INDEX = buildIndex(QUESTIONS);

export function getRandomQuestion(options?: {
  difficulty?: DifficultyTier;
  category?: QuestionCategory;
  avoidIds?: string[];
}): Question {
  const pool = options?.difficulty
    ? INDEX.byDifficulty[options.difficulty]
    : INDEX.all;
  const byCat =
    options?.difficulty && options?.category
      ? INDEX.byDifficultyCategory[options.difficulty][options.category]
      : options?.category
        ? pool.filter((q) => q.category === options.category)
        : pool;
  const candidates = byCat && byCat.length > 0 ? byCat : pool;

  const avoid = new Set(options?.avoidIds ?? []);
  for (let i = 0; i < 20; i++) {
    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    if (picked && !avoid.has(picked.id)) return picked;
  }

  const unblocked = candidates.filter((q) => !avoid.has(q.id));
  const pickFrom = unblocked.length > 0 ? unblocked : candidates;
  return pickFrom[Math.floor(Math.random() * pickFrom.length)];
}
