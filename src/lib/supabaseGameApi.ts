import { supabase } from "@/lib/supabaseClient";

export type ProfileRow = {
  id: string;
  email?: string | null;
  username?: string | null;
  role?: string | null;
  avatar_emoji?: string | null;
  profile_frame?: string | null;
  badge_display?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  coins?: number | null;
  diamonds?: number | null;
  level?: number | null;
  xp?: number | null;
  reputation?: number | null;
  total_earned?: number | null;
  daily_streak?: number | null;
  last_daily_claim_date?: string | null;
};

export async function loadProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return { data: data as ProfileRow | null, error };
}

export async function loadLeaderboard(limit = 50) {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .order("wealth", { ascending: false })
    .limit(limit);
  return { data, error };
}

export async function loadPlayerBusinesses(userId: string) {
  const { data, error } = await supabase
    .from("player_businesses")
    .select("*")
    .eq("player_id", userId);
  return { data, error };
}

export async function loadPlayerStaff(userId: string) {
  const { data, error } = await supabase
    .from("player_staff")
    .select("*")
    .eq("player_id", userId);
  return { data, error };
}

export async function loadPlayerDistricts(userId: string) {
  const { data, error } = await supabase
    .from("player_districts")
    .select("*")
    .eq("player_id", userId);
  return { data, error };
}

export async function loadPlayerAchievements(userId: string) {
  const { data, error } = await supabase
    .from("player_achievements")
    .select("*")
    .eq("player_id", userId);
  return { data, error };
}

export async function loadPlayerDailyRewards(userId: string) {
  const { data, error } = await supabase
    .from("player_daily_rewards")
    .select("*")
    .eq("player_id", userId);
  return { data, error };
}

export async function rpcCollectIdleIncome(userId: string) {
  return supabase.rpc("collect_idle_income", { p_player: userId });
}

export async function rpcUpgradeBusiness(userId: string, businessId: string) {
  return supabase.rpc("upgrade_business", {
    p_player: userId,
    p_business: businessId,
  });
}

export async function rpcAnswerQuestion(args: {
  playerId: string;
  questionId: string;
  selectedAnswer: number;
  responseTimeMs?: number;
}) {
  const secure = await supabase.rpc("answer_question_secure", {
    p_player: args.playerId,
    p_question: args.questionId,
    p_answer: args.selectedAnswer,
    p_response_time_ms: args.responseTimeMs ?? null,
  });
  if (!secure.error) return secure;

  return supabase.rpc("answer_question", {
    p_player: args.playerId,
    p_question: args.questionId,
    p_answer: args.selectedAnswer,
    p_response_time_ms: args.responseTimeMs ?? null,
  });
}

export async function rpcResolveBattle(args: {
  playerId: string;
  rivalId: string;
}) {
  return supabase.rpc("resolve_battle", {
    p_player: args.playerId,
    p_rival: args.rivalId,
  });
}

export async function rpcClaimDailyReward(userId: string) {
  return supabase.rpc("claim_daily_reward", { p_player: userId });
}

export async function rpcGetRandomQuestion(args: {
  playerId: string;
  difficulty?: string;
}) {
  return supabase.rpc("get_random_question", {
    p_player: args.playerId,
    p_difficulty: args.difficulty ?? null,
  });
}

export async function invokeGenerateQuestion(args: {
  difficulty?: string;
  category?: string;
  avoidIds?: string[];
}) {
  return supabase.functions.invoke("generate-question", {
    body: {
      difficulty: args.difficulty ?? null,
      category: args.category ?? null,
      avoidIds: args.avoidIds ?? [],
    },
  });
}

export async function getOrGenerateRandomQuestion(args: {
  playerId: string;
  difficulty?: string;
  category?: string;
}) {
  const first = await rpcGetRandomQuestion({
    playerId: args.playerId,
    difficulty: args.difficulty,
  });
  if (first.data) return first;

  await invokeGenerateQuestion({
    difficulty: args.difficulty,
    category: args.category,
  });

  return rpcGetRandomQuestion({
    playerId: args.playerId,
    difficulty: args.difficulty,
  });
}
