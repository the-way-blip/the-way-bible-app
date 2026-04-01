import { useApp } from "../stores/AppContext";
import { useAuth } from "../stores/AuthContext";

const FONT_OPTIONS = [
  { value: "Georgia, 'Times New Roman', serif", label: "Georgia (Classic)", sample: "In the beginning God created..." },
  { value: "'Palatino Linotype', Palatino, serif", label: "Palatino", sample: "In the beginning God created..." },
  { value: "'Book Antiqua', Palatino, serif", label: "Book Antiqua", sample: "In the beginning God created..." },
  { value: "'Garamond', serif", label: "Garamond", sample: "In the beginning God created..." },
  { value: "'Times New Roman', Times, serif", label: "Times New Roman", sample: "In the beginning God created..." },
  { value: "system-ui, -apple-system, sans-serif", label: "System Sans-Serif", sample: "In the beginning God created..." },
  { value: "'Courier New', monospace", label: "Courier (Monospace)", sample: "In the beginning God created..." },
];

const SIZE_OPTIONS = [14, 16, 18, 20, 22, 24];

export default function Settings() {
  const { fontSize, setFontSize, fontFamily, setFontFamily, darkMode, toggleDarkMode, studyMode, toggleStudyMode } = useApp();
  const { isLoggedIn, user, signOut } = useAuth();

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-warm-brown mb-6">Settings</h1>

      {/* Account */}
      <SettingsSection title="Account">
        {isLoggedIn ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warm-brown">{user?.email || "Signed in"}</p>
              <p className="text-xs text-warm-brown-light">Signed in</p>
            </div>
            <button onClick={signOut} className="text-xs text-red-400 hover:text-red-500">Sign Out</button>
          </div>
        ) : (
          <a href="/login" className="text-sm text-gold hover:text-gold/80">Sign in to sync your data</a>
        )}
      </SettingsSection>

      {/* Font Size */}
      <SettingsSection title="Font Size">
        <div className="flex items-center gap-3">
          <span className="text-xs text-warm-brown-light">A</span>
          <input
            type="range"
            min="14"
            max="24"
            step="2"
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
            className="flex-1 accent-gold"
          />
          <span className="text-lg text-warm-brown-light">A</span>
          <span className="text-xs text-warm-brown-light w-8 text-right">{fontSize}px</span>
        </div>
        <div className="mt-3 bg-scripture-bg rounded-lg p-3">
          <p className="font-scripture text-warm-brown leading-relaxed" style={{ fontSize: `${fontSize}px`, fontFamily: fontFamily }}>
            In the beginning God created the heaven and the earth.
          </p>
        </div>
      </SettingsSection>

      {/* Font Type */}
      <SettingsSection title="Font Style">
        <div className="space-y-2">
          {FONT_OPTIONS.map((font) => (
            <button
              key={font.value}
              onClick={() => setFontFamily(font.value)}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors ${
                fontFamily === font.value
                  ? "border-gold bg-gold/5"
                  : "border-cream-dark bg-white hover:border-gold/30"
              }`}
            >
              <p className="text-xs font-medium text-warm-brown mb-1">{font.label}</p>
              <p className="text-sm text-warm-brown-light" style={{ fontFamily: font.value }}>
                {font.sample}
              </p>
            </button>
          ))}
        </div>
      </SettingsSection>

      {/* Reading Mode */}
      <SettingsSection title="Default Mode">
        <div className="flex gap-2">
          <button
            onClick={() => { if (studyMode) toggleStudyMode(); }}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
              !studyMode ? "bg-gold text-white" : "bg-cream-dark text-warm-brown-light"
            }`}
          >
            Read Mode
          </button>
          <button
            onClick={() => { if (!studyMode) toggleStudyMode(); }}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
              studyMode ? "bg-gold text-white" : "bg-cream-dark text-warm-brown-light"
            }`}
          >
            Study Mode
          </button>
        </div>
        <p className="text-[10px] text-warm-brown-light/60 mt-2">
          Read mode shows clean text. Study mode enables tappable words with study tools.
        </p>
      </SettingsSection>

      {/* Appearance */}
      <SettingsSection title="Appearance">
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-cream-dark"
        >
          <span className="text-sm text-warm-brown">Dark Mode</span>
          <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${darkMode ? "bg-gold" : "bg-cream-dark"}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${darkMode ? "translate-x-4" : ""}`} />
          </div>
        </button>
      </SettingsSection>

      {/* Clear Data */}
      <SettingsSection title="Data">
        <button
          onClick={() => {
            if (confirm("Clear all local data? This removes highlights, notes, memory verses, and journal entries.")) {
              indexedDB.deleteDatabase("scripture-study");
              localStorage.clear();
              window.location.href = "/";
            }
          }}
          className="text-sm text-red-400 hover:text-red-500"
        >
          Clear All Local Data
        </button>
      </SettingsSection>
    </div>
  );
}

function SettingsSection({ title, children }) {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-semibold text-warm-brown-light uppercase tracking-wider mb-3">{title}</h2>
      {children}
    </div>
  );
}
