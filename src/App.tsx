import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import { AppLayout } from "@/components/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

import Index from "./pages/Index";
import IdentityPage from "./pages/IdentityPage";
import CredentialsPage from "./pages/CredentialsPage";
import EducationPage from "./pages/EducationPage";
import LessonPage from "./pages/LessonPage";
import JobsPage from "./pages/JobsPage";
import BountyBoardPage from "./pages/BountyBoardPage";
import AboutPage from "./pages/AboutPage";
import VerifyPage from "./pages/VerifyPage";
import TransactionViewPage from "./pages/TransactionViewPage";
import WalletManagerPage from "./pages/WalletManagerPage";
import ProfileSettingsPage from "./pages/ProfileSettingsPage";
import NotFound from "./pages/NotFound";

import { PrivyProvider } from '@privy-io/react-auth';

const queryClient = new QueryClient();

const rawPrivyAppId = import.meta.env.VITE_PRIVY_APP_ID;
const sanitizedPrivyAppId = typeof rawPrivyAppId === 'string' ? rawPrivyAppId.trim() : '';
const hasValidPrivyAppId = Boolean(sanitizedPrivyAppId) && ![
  'undefined',
  'null',
  'your-privy-app-id',
  'changeme',
].includes(sanitizedPrivyAppId.toLowerCase());

const AppContent = () => {
  const protect = (element: JSX.Element) =>
    hasValidPrivyAppId ? <ProtectedRoute>{element}</ProtectedRoute> : element;

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <WalletProvider>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/identity" element={protect(<IdentityPage />)} />
                <Route path="/credentials" element={protect(<CredentialsPage />)} />
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
    </ErrorBoundary>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    {hasValidPrivyAppId ? (
      <PrivyProvider
        appId={sanitizedPrivyAppId}
        config={{
          appearance: {
            theme: 'light',
            accentColor: '#0ea5e9',
            showWalletLoginFirst: false,
          },
          loginMethods: ['wallet', 'email', 'google', 'twitter', 'discord', 'github', 'apple'],
          embeddedWallets: {
            ethereum: {
              createOnLogin: 'users-without-wallets',
            },
          },
        }}
      >
        <AppContent />
      </PrivyProvider>
    ) : (
      <AppContent />
    )}
  </QueryClientProvider>
);

export default App;
