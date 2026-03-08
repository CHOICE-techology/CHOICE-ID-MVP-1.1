import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import { AppLayout } from "@/components/AppLayout";
import { RewardAnimationOverlay } from "@/components/RewardAnimation";
import IdentityPage from "./pages/IdentityPage";
import CredentialsPage from "./pages/CredentialsPage";
import EducationPage from "./pages/EducationPage";
import LessonPage from "./pages/LessonPage";
import JobsPage from "./pages/JobsPage";
import BountyBoardPage from "./pages/BountyBoardPage";
import AboutPage from "./pages/AboutPage";
import VerifyPage from "./pages/VerifyPage";
import WalletManagerPage from "./pages/WalletManagerPage";
import ProfileSettingsPage from "./pages/ProfileSettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RewardAnimationOverlay />
      <BrowserRouter>
        <WalletProvider>
          <AppLayout>
            <Routes>
              <Route path="/" element={<IdentityPage />} />
              <Route path="/credentials" element={<CredentialsPage />} />
              <Route path="/education" element={<EducationPage />} />
              <Route path="/education/:courseId" element={<LessonPage />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/bounties" element={<BountyBoardPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/verify" element={<VerifyPage />} />
              <Route path="/wallet/create" element={<WalletManagerPage />} />
              <Route path="/profile/settings" element={<ProfileSettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </WalletProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
