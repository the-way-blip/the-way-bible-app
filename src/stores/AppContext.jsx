import { createContext, useContext, useState, useEffect } from "react";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [fontSize, setFontSize] = useState(
    () => parseInt(localStorage.getItem("fontSize")) || 18
  );
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true"
  );
  const [studyMode, setStudyMode] = useState(
    () => localStorage.getItem("studyMode") !== "false" // default to study mode
  );

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

  return (
    <AppContext.Provider value={{
      fontSize, setFontSize: updateFontSize,
      darkMode, toggleDarkMode,
      studyMode, toggleStudyMode,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
