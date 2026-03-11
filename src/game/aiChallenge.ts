import { supabase } from "@/lib/supabaseClient";
import { DIFFICULTY_REWARDS, type Challenge, type DifficultyTier } from "@/game/gameData";
import type { QuestionCategory } from "@/game/questionBank";

type DbQuestion = {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "A" | "B" | "C" | "D";
  category: string;
  difficulty: string;
  explanation: string;
};

function difficultyToTier(difficulty: string): DifficultyTier {
  const d = difficulty.toLowerCase();
  if (d === "easy") return "easy";
  if (d === "medium") return "medium";
  if (d === "hard") return "hard";
  return "expert";
}

function correctIndexFromLetter(letter: string): 0 | 1 | 2 | 3 {
  if (letter === "A") return 0;
  if (letter === "B") return 1;
  if (letter === "C") return 2;
  return 3;
}

function categoryToKnown(category: string): QuestionCategory {
  const c = category.trim();
  const known: QuestionCategory[] = [
    "Science",
    "History",
    "Geography",
    "Technology",
    "Logic",
    "Pop culture",
    "Math",
    "Riddle",
    "Pattern",
    "Quick-thinking",
    "General Knowledge",
  ];
  return (known.includes(c as QuestionCategory) ? (c as QuestionCategory) : "General Knowledge");
}

function toChallenge(row: DbQuestion): Challenge {
  const tier = difficultyToTier(row.difficulty);
  const category = categoryToKnown(row.category);
  const type =
    category === "Logic"
      ? "logic"
      : category === "Technology" || category === "Quick-thinking"
        ? "speed"
        : category === "Riddle"
          ? "riddle"
          : "trivia";
  const reward = DIFFICULTY_REWARDS[tier];

  return {
    id: row.id,
    type,
    category,
    question: row.question_text,
    options: [row.option_a, row.option_b, row.option_c, row.option_d],
    correctAnswer: correctIndexFromLetter(row.correct_option),
    explanation: row.explanation,
    difficulty: tier,
    reward,
    timeLimit: tier === "easy" ? 15 : tier === "medium" ? 12 : tier === "hard" ? 11 : 10,
  };
}

export async function getOrGenerateServerChallenge(args: {
  playerId: string;
  difficulty: DifficultyTier;
  category?: QuestionCategory;
  avoidIds?: string[];
}): Promise<Challenge> {
  const attempt = async () => {
    const { data, error } = await supabase.rpc("get_random_question", {
      p_player: args.playerId,
      p_difficulty: args.difficulty,
    });
    if (error) return null;
    if (!data) return null;
    const row = data as DbQuestion;
    if (!row.id) return null;
    if (args.avoidIds?.includes(row.id)) return null;
    return toChallenge(row);
  };

  const first = await attempt();
  if (first) return first;

  await supabase.functions.invoke("generate-question", {
    body: { difficulty: args.difficulty, category: args.category, avoidIds: args.avoidIds ?? [] },
  });

  const second = await attempt();
  if (second) return second;

  const { data } = await supabase
    .from("questions")
    .select(
      "id,question_text,option_a,option_b,option_c,option_d,correct_option,category,difficulty,explanation",
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return toChallenge(data as DbQuestion);
}

