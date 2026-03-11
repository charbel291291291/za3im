import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useI18n } from "@/i18n/I18nContext";

export default function AuthPage() {
  const { user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle } =
    useAuth();
  const navigate = useNavigate();
  const { t, isRTL } = useI18n();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const disabled = loading || email.trim().length === 0 || password.length < 6;

  const title = useMemo(
    () => (mode === "login" ? t("pages.authTitleLogin") : t("pages.authTitleSignup")),
    [mode, t],
  );

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [loading, user, navigate]);

  return (
    <div className={`px-4 pb-4 ${isRTL ? "text-right" : "text-left"}`}>
      <div className="bg-surface rounded-2xl p-6 shadow-card border border-border">
        <h2 className="font-display text-xl text-gold">{title}</h2>
        <p className="text-xs text-muted-foreground font-body mt-1">
          {t("auth.subtitle")}
        </p>

        <div className="mt-4 space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("auth.email")}
            type="email"
            className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border border-border font-body text-sm"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("auth.password")}
            type="password"
            className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border border-border font-body text-sm"
          />

          <button
            disabled={disabled}
            onClick={async () => {
              const action = mode === "login" ? signInWithEmail : signUpWithEmail;
              const { error } = await action({ email, password });
              if (error) {
                toast({ title: t("auth.errorTitle"), description: error.message });
                return;
              }
              toast({
                title: t("auth.successTitle"),
                description:
                  mode === "login"
                    ? t("auth.loginSuccess")
                    : t("auth.signupSuccess"),
              });
              navigate("/", { replace: true });
            }}
            className={`w-full py-3 rounded-xl font-display font-bold transition-all
              ${disabled
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-gradient-gold text-primary-foreground active:scale-95"}`}
          >
            {mode === "login" ? t("topbar.login") : t("pages.authTitleSignup")}
          </button>

          <button
            onClick={async () => {
              const { error } = await signInWithGoogle();
              if (error) {
                toast({
                  title: t("auth.googleErrorTitle"),
                  description: error.message,
                });
              }
            }}
            className="w-full py-3 rounded-xl bg-muted text-foreground font-display font-bold active:scale-95 transition-transform"
          >
            {t("auth.continueGoogle")}
          </button>

          <button
            onClick={() => setMode((m) => (m === "login" ? "signup" : "login"))}
            className="w-full py-2 rounded-xl bg-background text-muted-foreground font-display font-bold active:scale-95 transition-transform"
          >
            {mode === "login"
              ? t("auth.switchToSignup")
              : t("auth.switchToLogin")}
          </button>
        </div>
      </div>
    </div>
  );
}
