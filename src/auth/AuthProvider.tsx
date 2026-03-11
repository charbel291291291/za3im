import { useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/auth/AuthContext";

async function ensureProfileRow(user: User) {
  const payload = {
    id: user.id,
    email: user.email ?? null,
    updated_at: new Date().toISOString(),
  };

  await supabase.from("profiles").upsert(payload, { onConflict: "id" });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        if (nextSession?.user) {
          await ensureProfileRow(nextSession.user);
        }
      },
    );

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      signUpWithEmail: async (args: { email: string; password: string }) => {
        const { data, error } = await supabase.auth.signUp({
          email: args.email,
          password: args.password,
        });
        if (data.user) {
          await ensureProfileRow(data.user);
        }
        return { error: error ? new Error(error.message) : null };
      },
      signInWithEmail: async (args: { email: string; password: string }) => {
        const { error } = await supabase.auth.signInWithPassword({
          email: args.email,
          password: args.password,
        });
        return { error: error ? new Error(error.message) : null };
      },
      signInWithGoogle: async () => {
        const redirectTo = new URL(
          import.meta.env.BASE_URL ?? "/",
          window.location.origin,
        ).toString();
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo },
        });
        return { error: error ? new Error(error.message) : null };
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [user, session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
