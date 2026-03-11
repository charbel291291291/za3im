import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/auth/AuthProvider";
import { GameProvider } from "@/game/GameContext";
import { I18nProvider } from "@/i18n/I18nContext";
import { TopBar } from "@/components/game/TopBar";
import { BottomNav } from "@/components/game/BottomNav";
import CityPage from "@/pages/CityPage";
import BusinessPage from "@/pages/BusinessPage";
import StaffPage from "@/pages/StaffPage";
import AttackPage from "@/pages/AttackPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import SocialChallengePage from "@/pages/SocialChallengePage";
import AuthPage from "@/pages/AuthPage";
import SettingsPage from "@/pages/SettingsPage";
import ProfilePage from "@/pages/ProfilePage";
import AdminPage from "@/pages/AdminPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <I18nProvider>
        <AuthProvider>
          <GameProvider>
            <BrowserRouter>
              <div className="min-h-screen bg-gradient-night max-w-lg mx-auto relative">
                <TopBar />
                <main className="pt-14 pb-20">
                  <Routes>
                    <Route path="/" element={<CityPage />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/businesses" element={<BusinessPage />} />
                    <Route path="/staff" element={<StaffPage />} />
                    <Route path="/attack" element={<AttackPage />} />
                    <Route path="/leaderboard" element={<LeaderboardPage />} />
                    <Route path="/social" element={<SocialChallengePage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <BottomNav />
                <Toaster />
              </div>
            </BrowserRouter>
          </GameProvider>
        </AuthProvider>
      </I18nProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
