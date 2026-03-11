import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Difficulty = "easy" | "medium" | "hard" | "expert";
type Category =
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

type GeneratedQuestion = {
  question_text: string;
  difficulty: Difficulty;
  category: Category;
  options: [string, string, string, string];
  correct_index: 0 | 1 | 2 | 3;
  explanation: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function asDifficulty(input: unknown): Difficulty | null {
  if (
    input === "easy" ||
    input === "medium" ||
    input === "hard" ||
    input === "expert"
  )
    return input;
  if (input === "Easy") return "easy";
  if (input === "Medium") return "medium";
  if (input === "Hard") return "hard";
  if (input === "Expert") return "expert";
  return null;
}

function pickCorrectOptionLetter(idx: number) {
  return idx === 0 ? "A" : idx === 1 ? "B" : idx === 2 ? "C" : "D";
}

function normalizeQuestion(q: unknown): GeneratedQuestion | null {
  const obj = q as Record<string, unknown>;
  const question_text =
    typeof obj.question_text === "string" ? obj.question_text.trim() : "";
  const difficulty = asDifficulty(obj.difficulty);
  const category =
    typeof obj.category === "string" ? (obj.category as Category) : null;
  const explanation =
    typeof obj.explanation === "string" ? obj.explanation.trim() : "";

  const optionsRaw = obj.options;
  const options =
    Array.isArray(optionsRaw) && optionsRaw.length === 4
      ? ([
          String(optionsRaw[0] ?? ""),
          String(optionsRaw[1] ?? ""),
          String(optionsRaw[2] ?? ""),
          String(optionsRaw[3] ?? ""),
        ] as [string, string, string, string])
      : null;

  const correct_index =
    typeof obj.correct_index === "number" &&
    (obj.correct_index === 0 ||
      obj.correct_index === 1 ||
      obj.correct_index === 2 ||
      obj.correct_index === 3)
      ? (obj.correct_index as 0 | 1 | 2 | 3)
      : null;

  if (
    !question_text ||
    !difficulty ||
    !category ||
    !options ||
    correct_index === null ||
    !explanation
  )
    return null;

  if (options.some((o) => !o || o.trim().length < 1)) return null;

  return {
    question_text,
    difficulty,
    category,
    options: [
      options[0].trim(),
      options[1].trim(),
      options[2].trim(),
      options[3].trim(),
    ],
    correct_index,
    explanation,
  };
}

async function generateWithOpenAI(args: {
  difficulty: Difficulty;
  category?: Category;
  recentQuestionTexts?: string[];
}) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const model = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";
  const banned = (args.recentQuestionTexts ?? []).slice(0, 20);

  const system = `You create quiz questions for a mobile strategy game.
Output ONLY valid JSON with this schema:
{
  "question_text": string,
  "difficulty": "easy"|"medium"|"hard"|"expert",
  "category": "Science"|"History"|"Geography"|"Technology"|"Logic"|"Pop culture"|"Math"|"Riddle"|"Pattern"|"Quick-thinking"|"General Knowledge",
  "options": [string,string,string,string],
  "correct_index": 0|1|2|3,
  "explanation": string
}
Rules:
- One unambiguous correct answer.
- Clear, solvable, short explanation.
- Avoid trick wording and subjective facts.
- Do not repeat any question similar to the banned list.
`;

  const user = `difficulty=${args.difficulty}
category=${args.category ?? "any"}
banned=${JSON.stringify(banned)}
Generate ONE question.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${text}`);
  }
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string")
    throw new Error("OpenAI response missing content");

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("OpenAI returned non-JSON content");
  }

  const normalized = normalizeQuestion(parsed);
  if (!normalized) throw new Error("OpenAI returned invalid question schema");
  return normalized;
}

Deno.serve(async (req) => {
  if (req.method !== "POST")
    return jsonResponse({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(
      { error: "Missing Supabase service role configuration" },
      500,
    );
  }

  let body: { difficulty?: unknown; category?: unknown; avoidIds?: unknown };
  try {
    body = (await req.json()) as {
      difficulty?: unknown;
      category?: unknown;
      avoidIds?: unknown;
    };
  } catch {
    body = {};
  }

  const difficulty = asDifficulty(body.difficulty) ?? "easy";
  const category =
    typeof body.category === "string" ? (body.category as Category) : undefined;
  const avoidIds = Array.isArray(body.avoidIds)
    ? body.avoidIds.map((v) => String(v))
    : [];

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: recent } = await admin
    .from("questions")
    .select("question_text")
    .order("created_at", { ascending: false })
    .limit(25);

  const recentQuestionTexts = Array.isArray(recent)
    ? recent
        .map((r) =>
          typeof (r as any).question_text === "string"
            ? (r as any).question_text
            : "",
        )
        .filter(Boolean)
    : [];

  if (avoidIds.length > 0) {
    const { data: avoidRows } = await admin
      .from("questions")
      .select("question_text")
      .in("id", avoidIds.slice(0, 50));
    if (Array.isArray(avoidRows)) {
      for (const r of avoidRows as Array<any>) {
        if (typeof r.question_text === "string" && r.question_text) {
          recentQuestionTexts.push(r.question_text);
        }
      }
    }
  }

  const cachedQuery = admin
    .from("questions")
    .select(
      "id,question_text,option_a,option_b,option_c,option_d,correct_option,category,difficulty,explanation",
    )
    .eq("source", "ai")
    .eq("difficulty", difficulty)
    .order("created_at", { ascending: false })
    .limit(60);

  const cachedRes = category
    ? await cachedQuery.eq("category", category)
    : await cachedQuery;

  if (Array.isArray(cachedRes.data) && cachedRes.data.length > 0) {
    const filtered = cachedRes.data.filter(
      (r: any) => !avoidIds.includes(String(r.id)),
    );
    const pickFrom = filtered.length > 0 ? filtered : cachedRes.data;
    const picked = pickFrom[Math.floor(Math.random() * pickFrom.length)] as any;
    const correct_index =
      picked.correct_option === "A"
        ? 0
        : picked.correct_option === "B"
          ? 1
          : picked.correct_option === "C"
            ? 2
            : 3;

    const cachedQuestion: GeneratedQuestion = {
      question_text: String(picked.question_text ?? ""),
      difficulty,
      category: (picked.category ??
        category ??
        "General Knowledge") as Category,
      options: [
        String(picked.option_a ?? ""),
        String(picked.option_b ?? ""),
        String(picked.option_c ?? ""),
        String(picked.option_d ?? ""),
      ],
      correct_index,
      explanation: String(picked.explanation ?? ""),
    };

    const normalizedCached = normalizeQuestion(cachedQuestion);
    if (normalizedCached) {
      return jsonResponse(
        {
          ok: true,
          cached: true,
          inserted: false,
          id: String(picked.id),
          question: normalizedCached,
        },
        200,
      );
    }
  }

  const q = await generateWithOpenAI({
    difficulty,
    category,
    recentQuestionTexts,
  });

  const insertRow = {
    question_text: q.question_text,
    option_a: q.options[0],
    option_b: q.options[1],
    option_c: q.options[2],
    option_d: q.options[3],
    correct_option: pickCorrectOptionLetter(q.correct_index),
    category: q.category,
    difficulty: q.difficulty,
    explanation: q.explanation,
    source: "ai",
  };

  const inserted = await admin
    .from("questions")
    .insert(insertRow)
    .select("id")
    .single();

  if (inserted.error) {
    return jsonResponse(
      {
        ok: true,
        cached: false,
        inserted: false,
        error: inserted.error.message,
        question: q,
      },
      200,
    );
  }

  return jsonResponse(
    {
      ok: true,
      cached: false,
      inserted: true,
      id: inserted.data?.id,
      question: q,
    },
    200,
  );
});
