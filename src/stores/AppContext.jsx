import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AppContext = createContext();

export const COLOR_THEMES = [
  {
    id: "classic",
    name: "Classic Parchment",
    desc: "Warm cream and gold",
    colors: { cream: "#faf7f2", "cream-dark": "#f0ebe3", parchment: "#f5f0e8", "warm-brown": "#5c4033", "warm-brown-light": "#806252", gold: "#8a6d22", "gold-light": "#e8d48b", "scripture-bg": "#fdfbf7" },
  },
  {
    id: "ocean",
    name: "Ocean Depths",
    desc: "Cool blues and teals",
    colors: { cream: "#f0f5f9", "cream-dark": "#dce6ef", parchment: "#e8f0f5", "warm-brown": "#2c3e50", "warm-brown-light": "#4a6a80", gold: "#1a7a6d", "gold-light": "#a8e0d6", "scripture-bg": "#f5faf9" },
  },
  {
    id: "forest",
    name: "Forest Haven",
    desc: "Earthy greens and browns",
    colors: { cream: "#f4f5f0", "cream-dark": "#e4e8dd", parchment: "#eef0e8", "warm-brown": "#3d4a35", "warm-brown-light": "#5e7050", gold: "#6b7c3a", "gold-light": "#c8d6a0", "scripture-bg": "#f8f9f5" },
  },
  {
    id: "royal",
    name: "Royal Purple",
    desc: "Majestic purples and golds",
    colors: { cream: "#f6f2fa", "cream-dark": "#e8e0f0", parchment: "#f0eaf5", "warm-brown": "#3a2d4a", "warm-brown-light": "#6a5580", gold: "#7a5c9e", "gold-light": "#c8b0e0", "scripture-bg": "#faf7fd" },
  },
  {
    id: "ember",
    name: "Warm Ember",
    desc: "Rich ambers and rusts",
    colors: { cream: "#faf5f0", "cream-dark": "#f0e5d8", parchment: "#f5ece0", "warm-brown": "#4a3020", "warm-brown-light": "#7a5540", gold: "#b07020", "gold-light": "#e8c88b", "scripture-bg": "#fdf9f4" },
  },
];

export function AppProvider({ children }) {
  const [fontSize, setFontSize] = useState(
    () => parseInt(localStorage.getItem("fontSize")) || 18
  );
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("darkMode");
    if (stored !== null) return stored === "true";
    // Respect system preference as default
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });
  const [studyMode, setStudyMode] = useState(
    () => localStorage.getItem("studyMode") === "true"
  );
  const [fontFamily, setFontFamilyState] = useState(
    () => localStorage.getItem("fontFamily") || "Georgia, 'Times New Roman', serif"
  );
  const [showVerseNumbers, setShowVerseNumbersState] = useState(
    () => localStorage.getItem("showVerseNumbers") !== "false"
  );
  const [pinnedCommentator, setPinnedCommentatorState] = useState(
    () => localStorage.getItem("pinnedCommentator") || null
  );
  const [colorTheme, setColorThemeState] = useState(
    () => localStorage.getItem("colorTheme") || "classic"
  );
  const [rotatingTheme, setRotatingTheme] = useState(
    () => localStorage.getItem("rotatingTheme") === "true"
  );

  // Apply color theme CSS variables
  const applyThemeColors = useCallback((themeId) => {
    const theme = COLOR_THEMES.find((t) => t.id === themeId) || COLOR_THEMES[0];
    const root = document.documentElement;
    for (const [key, value] of Object.entries(theme.colors)) {
      root.style.setProperty(`--color-${key}`, value);
    }
  }, []);

  useEffect(() => {
    if (rotatingTheme) {
      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
      const themeIndex = dayOfYear % COLOR_THEMES.length;
      applyThemeColors(COLOR_THEMES[themeIndex].id);
    } else {
      applyThemeColors(colorTheme);
    }
  }, [colorTheme, rotatingTheme, applyThemeColors]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const updateFontSize = (size) => {
    setFontSize(size);
    localStorage.setItem("fontSize", size);
  };

  const toggleDarkMode = () => setDarkMode((d) => !d);

  const toggleStudyMode = () => {
    setStudyMode((s) => {
      localStorage.setItem("studyMode", !s);
      return !s;
    });
  };

  const setFontFamily = (family) => {
    setFontFamilyState(family);
    localStorage.setItem("fontFamily", family);
  };

  const toggleVerseNumbers = () => {
    setShowVerseNumbersState((v) => {
      localStorage.setItem("showVerseNumbers", !v);
      return !v;
    });
  };

  const setPinnedCommentator = (author) => {
    setPinnedCommentatorState(author);
    if (author) localStorage.setItem("pinnedCommentator", author);
    else localStorage.removeItem("pinnedCommentator");
  };

  const setColorTheme = (themeId) => {
    setColorThemeState(themeId);
    localStorage.setItem("colorTheme", themeId);
    if (rotatingTheme) {
      setRotatingTheme(false);
      localStorage.setItem("rotatingTheme", "false");
    }
  };

  const toggleRotatingTheme = () => {
    setRotatingTheme((r) => {
      const next = !r;
      localStorage.setItem("rotatingTheme", next);
      return next;
    });
  };

  return (
    <AppContext.Provider value={{
      fontSize, setFontSize: updateFontSize,
      darkMode, toggleDarkMode,
      studyMode, toggleStudyMode,
      showVerseNumbers, toggleVerseNumbers,
      fontFamily, setFontFamily,
      pinnedCommentator, setPinnedCommentator,
      colorTheme, setColorTheme, rotatingTheme, toggleRotatingTheme,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
