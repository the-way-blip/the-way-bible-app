import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./stores/AppContext";
import { AuthProvider } from "./stores/AuthContext";
import Layout from "./components/Layout";

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

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
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
                <Route path="/topics" element={<Topics />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}
