import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { Analytics } from "@vercel/analytics/react";
import { AppProvider } from "./stores/AppContext";
import { AuthProvider, useAuth } from "./stores/AuthContext";
import { ToastProvider } from "./components/Toast";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import OfflineBanner from "./components/OfflineBanner";
import InstallPrompt from "./components/InstallPrompt";

// Eagerly loaded (critical path)
import Home from "./pages/Home";
import Reader from "./pages/Reader";

// Lazy loaded (secondary routes)
const MemoryVerses = lazy(() => import("./pages/MemoryVerses"));
const Flashcard = lazy(() => import("./pages/Flashcard"));
const WordStudy = lazy(() => import("./pages/WordStudy"));
const Journal = lazy(() => import("./pages/Journal"));
const JournalEntry = lazy(() => import("./pages/JournalEntry"));
const Progress = lazy(() => import("./pages/Progress"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Login = lazy(() => import("./pages/Login"));
const Search = lazy(() => import("./pages/Search"));
const ReadingPlan = lazy(() => import("./pages/ReadingPlan"));
const PrayerList = lazy(() => import("./pages/PrayerList"));
const Topics = lazy(() => import("./pages/Topics"));
const CommentaryLibrary = lazy(() => import("./pages/CommentaryLibrary"));
const Settings = lazy(() => import("./pages/Settings"));
const Groups = lazy(() => import("./pages/Groups"));
const GroupDetail = lazy(() => import("./pages/GroupDetail"));
const Meditation = lazy(() => import("./pages/Meditation"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Welcome = lazy(() => import("./pages/Welcome"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/**
 * Smart root route at "/":
 * - Logged out + web  → render <Welcome /> inline (the marketing landing page,
 *                       served from the root URL — no /welcome redirect)
 * - Logged in         → redirect to /home (the app dashboard)
 * - Native iOS        → redirect to /login (skip marketing — they're already in the app)
 * - Loading auth      → loader to avoid flicker
 */
function RootRoute() {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (isLoggedIn) return <Navigate to="/home" replace />;
  if (Capacitor.isNativePlatform()) return <Navigate to="/login" replace />;
  return <Welcome />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <ToastProvider>
            <OfflineBanner />
            <InstallPrompt />
            <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public root — landing page for logged-out web users (no app shell) */}
                <Route path="/" element={<RootRoute />} />
                {/* Back-compat: anyone hitting /welcome bounces to / */}
                <Route path="/welcome" element={<Navigate to="/" replace />} />
                <Route element={<Layout />}>
                  <Route path="/home" element={<Home />} />
                  <Route path="/read/:book/:chapter" element={<Reader />} />
                  <Route path="/word/:strongsId" element={<WordStudy />} />
                  <Route path="/memory" element={<MemoryVerses />} />
                  <Route path="/memory/practice" element={<Flashcard />} />
                  <Route path="/journal" element={<Journal />} />
                  <Route path="/journal/:id" element={<JournalEntry />} />
                  <Route path="/progress" element={<Progress />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/plans" element={<ReadingPlan />} />
                  <Route path="/prayers" element={<PrayerList />} />
                  <Route path="/commentaries" element={<CommentaryLibrary />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/groups" element={<Groups />} />
                  <Route path="/groups/:id" element={<GroupDetail />} />
                  <Route path="/topics" element={<Topics />} />
                  <Route path="/meditation" element={<Meditation />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </Suspense>
          </ErrorBoundary>
          </ToastProvider>
        </BrowserRouter>
        {/* Vercel Analytics — disabled on native iOS where it isn't needed */}
        {!Capacitor.isNativePlatform() && <Analytics />}
      </AppProvider>
    </AuthProvider>
  );
}
