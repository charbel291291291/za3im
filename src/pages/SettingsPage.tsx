import { useNavigate } from "react-router-dom";
import { useI18n } from "@/i18n/I18nContext";

export default function SettingsPage() {
  const { language, setLanguage, t, isRTL } = useI18n();
  const navigate = useNavigate();

  return (
    <div className={`px-4 pb-4 space-y-4 ${isRTL ? "text-right" : "text-left"}`}>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-gold">{t("settings.title")}</h2>
        <button
          onClick={() => navigate(-1)}
          className="text-[10px] px-2.5 py-1 rounded-full bg-muted text-foreground font-display font-bold active:scale-95 transition-transform"
        >
          {t("common.back")}
        </button>
      </div>

      <div className="bg-surface rounded-2xl p-4 shadow-card border border-border">
        <div className="text-xs text-muted-foreground font-body">
          {t("settings.language")}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => setLanguage("en")}
            className={`py-3 rounded-xl font-display font-bold transition-all ${
              language === "en"
                ? "bg-gradient-gold text-primary-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            {t("settings.english")}
          </button>
          <button
            onClick={() => setLanguage("ar")}
            className={`py-3 rounded-xl font-display font-bold transition-all ${
              language === "ar"
                ? "bg-gradient-gold text-primary-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            {t("settings.arabic")}
          </button>
        </div>
      </div>
    </div>
  );
}

