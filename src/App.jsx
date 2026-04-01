import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./stores/AppContext";
import { AuthProvider } from "./stores/AuthContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Reader from "./pages/Reader";
import MemoryVerses from "./pages/MemoryVerses";
import Flashcard from "./pages/Flashcard";
import WordStudy from "./pages/WordStudy";
import Journal from "./pages/Journal";
import JournalEntry from "./pages/JournalEntry";
import Progress from "./pages/Progress";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
import Search from "./pages/Search";
import ReadingPlan from "./pages/ReadingPlan";
import PrayerList from "./pages/PrayerList";

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}
