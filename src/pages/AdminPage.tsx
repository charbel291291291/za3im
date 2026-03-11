import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { loadProfile } from "@/lib/supabaseGameApi";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";

type AdminTab = "players" | "questions" | "analytics";

type ProfileRow = {
  id: string;
  username: string | null;
  email: string | null;
  coins: number | null;
  diamonds: number | null;
  role: string | null;
};

type QuestionRow = {
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

function normalizeCorrectOption(n: unknown): "A" | "B" | "C" | "D" {
  const v = String(n ?? "").toUpperCase();
  if (v === "A" || v === "B" || v === "C" || v === "D") return v;
  return "A";
}

export default function AdminPage() {
  const { user } = useAuth();
  const { t, isRTL, language, setLanguage } = useI18n();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AdminTab>("players");
  const [role, setRole] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const [search, setSearch] = useState("");
  const [players, setPlayers] = useState<ProfileRow[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);

  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  const [analytics, setAnalytics] = useState<{ totalPlayers: number | null }>({
    totalPlayers: null,
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const isAdmin = useMemo(() => role === "admin", [role]);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setRole(null);
      setChecking(false);
      return;
    }
    setChecking(true);
    void (async () => {
      const res = await loadProfile(user.id);
      const nextRole = res.data?.role ?? null;
      if (!cancelled) {
        setRole(nextRole);
        setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const refreshPlayers = async () => {
    if (!isAdmin) return;
    const q = search.trim();
    setPlayersLoading(true);
    const query = supabase
      .from("profiles")
      .select("id,username,email,coins,diamonds,role")
      .limit(30);
    const res =
      q.length === 0
        ? await query.order("updated_at", { ascending: false })
        : await query.or(`username.ilike.%${q}%,id.eq.${q}`);
    setPlayersLoading(false);
    if (res.error) {
      toast({ title: "Admin", description: res.error.message });
      setPlayers([]);
      return;
    }
    setPlayers((res.data ?? []) as ProfileRow[]);
  };

  const refreshQuestions = async () => {
    if (!isAdmin) return;
    setQuestionsLoading(true);
    const res = await supabase
      .from("questions")
      .select(
        "id,question_text,option_a,option_b,option_c,option_d,correct_option,category,difficulty,explanation",
      )
      .order("created_at", { ascending: false })
      .limit(30);
    setQuestionsLoading(false);
    if (res.error) {
      toast({ title: "Admin", description: res.error.message });
      setQuestions([]);
      return;
    }
    setQuestions((res.data ?? []) as QuestionRow[]);
  };

  const refreshAnalytics = async () => {
    if (!isAdmin) return;
    setAnalyticsLoading(true);
    const res = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });
    setAnalyticsLoading(false);
    if (res.error) {
      toast({ title: "Admin", description: res.error.message });
      setAnalytics({ totalPlayers: null });
      return;
    }
    setAnalytics({ totalPlayers: res.count ?? null });
  };

  useEffect(() => {
    if (!isAdmin) return;
    if (tab === "players") void refreshPlayers();
    if (tab === "questions") void refreshQuestions();
    if (tab === "analytics") void refreshAnalytics();
  }, [tab, isAdmin]);

  if (!user) {
    return (
      <div
        className={`px-4 pb-4 space-y-4 ${isRTL ? "text-right" : "text-left"}`}
      >
        <h2 className="font-display text-xl text-gold">{t("admin.title")}</h2>
        <div className="bg-surface rounded-2xl p-5 shadow-card border border-border">
          <div className="text-sm text-muted-foreground font-body">
            {t("common.loginToContinue")}
          </div>
          <button
            onClick={() => navigate("/auth")}
            className="mt-4 w-full py-3 rounded-xl bg-gradient-gold text-primary-foreground font-display font-bold active:scale-95 transition-transform"
          >
            {t("topbar.login")}
          </button>
        </div>
      </div>
    );
  }

  if (checking) {
    return (
      <div
        className={`px-4 pb-4 space-y-4 ${isRTL ? "text-right" : "text-left"}`}
      >
        <h2 className="font-display text-xl text-gold">{t("admin.title")}</h2>
        <div className="text-sm text-muted-foreground font-body">
          {t("common.loading")}
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        className={`px-4 pb-4 space-y-4 ${isRTL ? "text-right" : "text-left"}`}
      >
        <h2 className="font-display text-xl text-gold">{t("admin.title")}</h2>
        <div className="bg-surface rounded-2xl p-5 shadow-card border border-border">
          <div className="text-sm text-muted-foreground font-body">
            {t("admin.notAuthorized")}
          </div>
          <button
            onClick={() => navigate("/")}
            className="mt-4 w-full py-3 rounded-xl bg-muted text-foreground font-display font-bold active:scale-95 transition-transform"
          >
            {t("nav.city")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`px-4 pb-4 space-y-4 ${isRTL ? "text-right" : "text-left"}`}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-gold">{t("admin.title")}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLanguage("en")}
            className={`text-[10px] px-2.5 py-1 rounded-full font-display font-bold active:scale-95 transition-transform ${
              language === "en"
                ? "bg-gradient-gold text-primary-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage("ar")}
            className={`text-[10px] px-2.5 py-1 rounded-full font-display font-bold active:scale-95 transition-transform ${
              language === "ar"
                ? "bg-gradient-gold text-primary-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            AR
          </button>
          <button
            onClick={() => navigate(-1)}
            className="text-[10px] px-2.5 py-1 rounded-full bg-muted text-foreground font-display font-bold active:scale-95 transition-transform"
          >
            {t("common.back")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(["players", "questions", "analytics"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`py-3 rounded-xl font-display font-bold text-sm transition-all ${
              tab === k
                ? "bg-gradient-gold text-primary-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            {t(`admin.${k}`)}
          </button>
        ))}
      </div>

      {tab === "players" && (
        <div className="bg-surface rounded-2xl p-5 shadow-card border border-border space-y-3">
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("admin.searchPlaceholder")}
              className="flex-1 px-4 py-3 rounded-xl bg-muted text-foreground border border-border font-body text-sm"
            />
            <button
              onClick={() => void refreshPlayers()}
              className="px-4 py-3 rounded-xl bg-gradient-fire text-foreground font-display font-bold text-sm active:scale-95 transition-transform"
            >
              {playersLoading ? "…" : t("admin.update")}
            </button>
          </div>

          <div className="space-y-2">
            {players.map((p) => (
              <AdminPlayerRow
                key={p.id}
                player={p}
                onUpdated={() => void refreshPlayers()}
              />
            ))}
            {players.length === 0 && !playersLoading && (
              <div className="text-xs text-muted-foreground font-body">—</div>
            )}
          </div>
        </div>
      )}

      {tab === "questions" && (
        <div className="space-y-3">
          <AdminQuestionCreate onCreated={() => void refreshQuestions()} />
          <div className="bg-surface rounded-2xl p-5 shadow-card border border-border space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-display font-bold text-foreground">
                {t("admin.questions")}
              </div>
              <button
                onClick={() => void refreshQuestions()}
                className="text-[10px] px-2.5 py-1 rounded-full bg-muted text-foreground font-display font-bold active:scale-95 transition-transform"
              >
                {questionsLoading ? "…" : t("admin.update")}
              </button>
            </div>
            <div className="space-y-2">
              {questions.map((q) => (
                <AdminQuestionRow
                  key={q.id}
                  question={q}
                  onChanged={() => void refreshQuestions()}
                />
              ))}
              {questions.length === 0 && !questionsLoading && (
                <div className="text-xs text-muted-foreground font-body">—</div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "analytics" && (
        <div className="bg-surface rounded-2xl p-5 shadow-card border border-border">
          <div className="flex items-center justify-between">
            <div className="font-display font-bold text-foreground">
              {t("admin.analytics")}
            </div>
            <button
              onClick={() => void refreshAnalytics()}
              className="text-[10px] px-2.5 py-1 rounded-full bg-muted text-foreground font-display font-bold active:scale-95 transition-transform"
            >
              {analyticsLoading ? "…" : t("admin.update")}
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="bg-muted rounded-xl p-3">
              <div className="text-sm font-display font-bold text-foreground">
                {analytics.totalPlayers ?? "—"}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Total players
              </div>
            </div>
            <div className="bg-muted rounded-xl p-3">
              <div className="text-sm font-display font-bold text-foreground">
                —
              </div>
              <div className="text-[10px] text-muted-foreground">
                Active today
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminPlayerRow({
  player,
  onUpdated,
}: {
  player: ProfileRow;
  onUpdated: () => void;
}) {
  const { t } = useI18n();
  const [coins, setCoins] = useState<number>(player.coins ?? 0);
  const [diamonds, setDiamonds] = useState<number>(player.diamonds ?? 0);
  const [role, setRole] = useState<string>(player.role ?? "player");
  const [saving, setSaving] = useState(false);

  return (
    <div className="bg-muted rounded-2xl p-4 border border-border space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-display font-bold text-foreground text-sm truncate">
            {player.username ?? player.email ?? player.id}
          </div>
          <div className="text-[10px] text-muted-foreground font-body truncate">
            {player.id}
          </div>
        </div>
        <div className="text-[10px] px-2 py-1 rounded-full bg-background text-foreground font-display font-bold">
          {player.role ?? "player"}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <input
          value={coins}
          onChange={(e) => setCoins(Number(e.target.value))}
          className="px-3 py-2 rounded-xl bg-background text-foreground border border-border font-body text-sm"
          inputMode="numeric"
          placeholder={t("admin.coins")}
        />
        <input
          value={diamonds}
          onChange={(e) => setDiamonds(Number(e.target.value))}
          className="px-3 py-2 rounded-xl bg-background text-foreground border border-border font-body text-sm"
          inputMode="numeric"
          placeholder={t("admin.diamonds")}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="px-3 py-2 rounded-xl bg-background text-foreground border border-border font-body text-sm"
        >
          <option value="player">{t("admin.player")}</option>
          <option value="admin">{t("admin.adminRole")}</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          disabled={saving}
          onClick={() => {
            void (async () => {
              setSaving(true);
              const res = await supabase
                .from("profiles")
                .update({ coins, diamonds, role })
                .eq("id", player.id);
              setSaving(false);
              if (res.error) {
                toast({ title: "Admin", description: res.error.message });
                return;
              }
              toast({ title: "Admin", description: "Updated" });
              onUpdated();
            })();
          }}
          className="flex-1 py-2.5 rounded-xl bg-gradient-gold text-primary-foreground font-display font-bold text-sm active:scale-95 transition-transform disabled:opacity-60"
        >
          {saving ? "…" : t("admin.update")}
        </button>
      </div>
    </div>
  );
}

function AdminQuestionCreate({ onCreated }: { onCreated: () => void }) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [c, setC] = useState("");
  const [d, setD] = useState("");
  const [correct, setCorrect] = useState<"A" | "B" | "C" | "D">("A");
  const [category, setCategory] = useState("General Knowledge");
  const [difficulty, setDifficulty] = useState("easy");
  const [explanation, setExplanation] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <div className="bg-surface rounded-2xl p-5 shadow-card border border-border space-y-3">
      <div className="font-display font-bold text-foreground">
        {t("admin.add")} {t("admin.questions")}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border border-border font-body text-sm"
        placeholder="question_text"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          value={a}
          onChange={(e) => setA(e.target.value)}
          className="px-4 py-3 rounded-xl bg-muted border border-border text-sm"
          placeholder="option_a"
        />
        <input
          value={b}
          onChange={(e) => setB(e.target.value)}
          className="px-4 py-3 rounded-xl bg-muted border border-border text-sm"
          placeholder="option_b"
        />
        <input
          value={c}
          onChange={(e) => setC(e.target.value)}
          className="px-4 py-3 rounded-xl bg-muted border border-border text-sm"
          placeholder="option_c"
        />
        <input
          value={d}
          onChange={(e) => setD(e.target.value)}
          className="px-4 py-3 rounded-xl bg-muted border border-border text-sm"
          placeholder="option_d"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <select
          value={correct}
          onChange={(e) => setCorrect(normalizeCorrectOption(e.target.value))}
          className="px-3 py-2 rounded-xl bg-muted border border-border text-sm"
        >
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
        </select>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 rounded-xl bg-muted border border-border text-sm"
          placeholder="category"
        />
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="px-3 py-2 rounded-xl bg-muted border border-border text-sm"
        >
          <option value="easy">easy</option>
          <option value="medium">medium</option>
          <option value="hard">hard</option>
          <option value="expert">expert</option>
        </select>
      </div>
      <textarea
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border border-border font-body text-sm"
        placeholder="explanation"
      />
      <button
        disabled={saving}
        onClick={() => {
          void (async () => {
            setSaving(true);
            const res = await supabase.from("questions").insert({
              question_text: text,
              option_a: a,
              option_b: b,
              option_c: c,
              option_d: d,
              correct_option: correct,
              category,
              difficulty,
              explanation,
              source: "admin",
            });
            setSaving(false);
            if (res.error) {
              toast({ title: "Admin", description: res.error.message });
              return;
            }
            setText("");
            setA("");
            setB("");
            setC("");
            setD("");
            setExplanation("");
            toast({ title: "Admin", description: "Created" });
            onCreated();
          })();
        }}
        className="w-full py-3 rounded-xl bg-gradient-gold text-primary-foreground font-display font-bold active:scale-95 transition-transform disabled:opacity-60"
      >
        {saving ? "…" : t("admin.add")}
      </button>
    </div>
  );
}

function AdminQuestionRow({
  question,
  onChanged,
}: {
  question: QuestionRow;
  onChanged: () => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<QuestionRow>(question);

  useEffect(() => setDraft(question), [question]);

  return (
    <div className="bg-muted rounded-2xl p-4 border border-border">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-display font-bold text-foreground text-sm truncate">
            {question.question_text}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {question.category} · {question.difficulty} ·{" "}
            {question.correct_option}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-[10px] px-2.5 py-1 rounded-full bg-background text-foreground font-display font-bold active:scale-95 transition-transform"
          >
            {t("admin.edit")}
          </button>
          <button
            disabled={saving}
            onClick={() => {
              void (async () => {
                setSaving(true);
                const res = await supabase
                  .from("questions")
                  .delete()
                  .eq("id", question.id);
                setSaving(false);
                if (res.error) {
                  toast({ title: "Admin", description: res.error.message });
                  return;
                }
                toast({ title: "Admin", description: "Deleted" });
                onChanged();
              })();
            }}
            className="text-[10px] px-2.5 py-1 rounded-full bg-background text-foreground font-display font-bold active:scale-95 transition-transform disabled:opacity-60"
          >
            {saving ? "…" : t("admin.delete")}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-3 space-y-2">
          <textarea
            value={draft.question_text}
            onChange={(e) =>
              setDraft((d) => ({ ...d, question_text: e.target.value }))
            }
            className="w-full px-4 py-3 rounded-xl bg-background text-foreground border border-border font-body text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={draft.option_a}
              onChange={(e) =>
                setDraft((d) => ({ ...d, option_a: e.target.value }))
              }
              className="px-3 py-2 rounded-xl bg-background border border-border text-sm"
            />
            <input
              value={draft.option_b}
              onChange={(e) =>
                setDraft((d) => ({ ...d, option_b: e.target.value }))
              }
              className="px-3 py-2 rounded-xl bg-background border border-border text-sm"
            />
            <input
              value={draft.option_c}
              onChange={(e) =>
                setDraft((d) => ({ ...d, option_c: e.target.value }))
              }
              className="px-3 py-2 rounded-xl bg-background border border-border text-sm"
            />
            <input
              value={draft.option_d}
              onChange={(e) =>
                setDraft((d) => ({ ...d, option_d: e.target.value }))
              }
              className="px-3 py-2 rounded-xl bg-background border border-border text-sm"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select
              value={draft.correct_option}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  correct_option: normalizeCorrectOption(e.target.value),
                }))
              }
              className="px-3 py-2 rounded-xl bg-background border border-border text-sm"
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
            <input
              value={draft.category}
              onChange={(e) =>
                setDraft((d) => ({ ...d, category: e.target.value }))
              }
              className="px-3 py-2 rounded-xl bg-background border border-border text-sm"
            />
            <select
              value={draft.difficulty}
              onChange={(e) =>
                setDraft((d) => ({ ...d, difficulty: e.target.value }))
              }
              className="px-3 py-2 rounded-xl bg-background border border-border text-sm"
            >
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
              <option value="expert">expert</option>
            </select>
          </div>
          <textarea
            value={draft.explanation}
            onChange={(e) =>
              setDraft((d) => ({ ...d, explanation: e.target.value }))
            }
            className="w-full px-4 py-3 rounded-xl bg-background text-foreground border border-border font-body text-sm"
          />
          <button
            disabled={saving}
            onClick={() => {
              void (async () => {
                setSaving(true);
                const res = await supabase
                  .from("questions")
                  .update({
                    question_text: draft.question_text,
                    option_a: draft.option_a,
                    option_b: draft.option_b,
                    option_c: draft.option_c,
                    option_d: draft.option_d,
                    correct_option: draft.correct_option,
                    category: draft.category,
                    difficulty: draft.difficulty,
                    explanation: draft.explanation,
                  })
                  .eq("id", question.id);
                setSaving(false);
                if (res.error) {
                  toast({ title: "Admin", description: res.error.message });
                  return;
                }
                toast({ title: "Admin", description: "Saved" });
                onChanged();
              })();
            }}
            className="w-full py-3 rounded-xl bg-gradient-fire text-foreground font-display font-bold active:scale-95 transition-transform disabled:opacity-60"
          >
            {saving ? "…" : t("common.save")}
          </button>
        </div>
      )}
    </div>
  );
}
