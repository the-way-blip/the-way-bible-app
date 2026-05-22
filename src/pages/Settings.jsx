import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useApp, COLOR_THEMES } from "../stores/AppContext";
import { useAuth } from "../stores/AuthContext";
import TRANSLATIONS from "../data/translations";
import { dbGetAll } from "../hooks/useDB";
import useDocumentTitle from "../hooks/useDocumentTitle";
import FONT_OPTIONS from "../data/fontOptions";

const SIZE_OPTIONS = [14, 16, 18, 20, 22, 24];

export default function Settings() {
  useDocumentTitle("Settings");
  const { fontSize, setFontSize, fontFamily, setFontFamily, darkMode, toggleDarkMode, studyMode, toggleStudyMode, colorTheme, setColorTheme, rotatingTheme, toggleRotatingTheme, translation, setTranslation } = useApp();
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
          <Link to="/login" className="text-sm text-gold hover:text-gold/80">Sign in to sync your data</Link>
        )}
      </SettingsSection>

      {/* Bible Translation */}
      <SettingsSection title="Bible Translation">
        <div className="space-y-2">
          {TRANSLATIONS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTranslation(t.id)}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors ${
                translation === t.id
                  ? "border-gold bg-gold/5"
                  : "border-cream-dark bg-white hover:border-gold/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-warm-brown">{t.short}</span>
                  <span className="text-xs text-warm-brown-light ml-2">{t.name}</span>
                </div>
                {translation === t.id && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-gold shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <p className="text-[11px] text-warm-brown-light mt-0.5">{t.description}</p>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-warm-brown-light/60 mt-2">
          You can also switch translations while reading by tapping the translation badge in the reader header.
        </p>
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

      {/* Color Theme */}
      <SettingsSection title="Color Theme">
        <div className="grid grid-cols-2 gap-2">
          {COLOR_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setColorTheme(theme.id)}
              className={`text-left px-3 py-3 rounded-xl border-2 transition-colors ${
                !rotatingTheme && colorTheme === theme.id
                  ? "border-gold bg-gold/5"
                  : "border-cream-dark bg-white hover:border-gold/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex gap-0.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.gold }} />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors["warm-brown"] }} />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.cream }} />
                </div>
              </div>
              <p className="text-xs font-medium text-warm-brown">{theme.name}</p>
              <p className="text-[10px] text-warm-brown-light">{theme.desc}</p>
            </button>
          ))}
          {/* Rotating theme */}
          <button
            onClick={toggleRotatingTheme}
            className={`text-left px-3 py-3 rounded-xl border-2 transition-colors ${
              rotatingTheme
                ? "border-gold bg-gold/5"
                : "border-cream-dark bg-white hover:border-gold/30"
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex gap-0.5">
                {COLOR_THEMES.slice(0, 3).map((t) => (
                  <div key={t.id} className="w-3 h-3 rounded-full" style={{ backgroundColor: t.colors.gold }} />
                ))}
              </div>
            </div>
            <p className="text-xs font-medium text-warm-brown">Daily Rotation</p>
            <p className="text-[10px] text-warm-brown-light">New theme each day</p>
          </button>
        </div>
      </SettingsSection>

      {/* Appearance */}
      <SettingsSection title="Appearance">
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-cream-dark"
        >
          <span className="text-sm text-warm-brown">Dark Mode</span>
          <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${darkMode ? "bg-gold" : "bg-cream-dark"}`}>
            <div className={`w-5 h-5 rounded-full shadow transition-transform ${darkMode ? "translate-x-4 bg-[#1a1a1a]" : "bg-white"}`} />
          </div>
        </button>
      </SettingsSection>

      {/* Data Management */}
      <SettingsSection title="Data">
        <DataManagement />
      </SettingsSection>

      {/* Help & Feedback */}
      <SettingsSection title="Help & Feedback">
        <div className="space-y-2">
          <ShowAppTourButton />
          <a
            href="mailto:hello@thewaybible.app?subject=TheWay Bible App Feedback"
            className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-cream-dark hover:border-gold/30 transition-colors"
          >
            <span className="text-sm text-warm-brown">Send Feedback</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-warm-brown-light">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
            </svg>
          </a>
          <Link
            to="/privacy"
            className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-cream-dark hover:border-gold/30 transition-colors"
          >
            <span className="text-sm text-warm-brown">Privacy Policy</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-warm-brown-light">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </Link>
        </div>
      </SettingsSection>

      <p className="text-[10px] text-warm-brown-light/40 text-center mt-4 mb-8">
        TheWay Bible App v1.0
      </p>
    </div>
  );
}

function ConfirmDeleteModal({ isOpen, onCancel, onConfirm }) {
  const cancelRef = useRef(null);
  const modalRef = useRef(null);

  // Focus cancel button when modal opens
  useEffect(() => {
    if (isOpen && cancelRef.current) {
      cancelRef.current.focus();
    }
  }, [isOpen]);

  // Close on Escape and trap focus
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") {
      onCancel();
      return;
    }
    if (e.key === "Tab" && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll("button");
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }, [onCancel]);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
      <div
        ref={modalRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        aria-describedby="delete-modal-desc"
        className="relative bg-white rounded-2xl shadow-2xl border border-cream-dark max-w-sm w-full p-6 animate-slide-up"
      >
        <h2 id="delete-modal-title" className="text-lg font-bold text-warm-brown mb-2">
          Delete All Data?
        </h2>
        <p id="delete-modal-desc" className="text-sm text-warm-brown-light leading-relaxed mb-6">
          This will permanently delete all your reading progress, memory verses, highlights, and settings from this device. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gold text-white hover:bg-gold/90 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Delete Everything
          </button>
        </div>
      </div>
    </div>
  );
}

function DataManagement() {
  const [exporting, setExporting] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const stores = ["highlights", "notes", "memoryVerses", "journal"];
      const data = {};
      for (const store of stores) {
        data[store] = await dbGetAll(store);
      }
      // Include localStorage preferences
      data.readingProgress = JSON.parse(localStorage.getItem("readingProgress") || "{}");
      data.userProfile = JSON.parse(localStorage.getItem("userProfile") || "null");
      data.exportedAt = new Date().toISOString();
      data.appVersion = "1.0";

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `the-way-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Export failed: " + err.message);
    }
    setExporting(false);
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus("importing");

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.exportedAt) {
        setImportStatus("error");
        return;
      }

      const { dbPut } = await import("../hooks/useDB");
      const stores = ["highlights", "notes", "memoryVerses", "journal"];
      let count = 0;
      for (const store of stores) {
        if (data[store]?.length) {
          for (const item of data[store]) {
            await dbPut(store, item);
            count++;
          }
        }
      }

      if (data.readingProgress) {
        localStorage.setItem("readingProgress", JSON.stringify(data.readingProgress));
      }
      if (data.userProfile) {
        localStorage.setItem("userProfile", JSON.stringify(data.userProfile));
      }

      setImportStatus(`success:${count}`);
      setTimeout(() => setImportStatus(null), 3000);
    } catch {
      setImportStatus("error");
      setTimeout(() => setImportStatus(null), 3000);
    }
    e.target.value = "";
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex-1 flex items-center justify-center gap-2 bg-white border border-cream-dark rounded-xl px-4 py-3 text-sm text-warm-brown hover:border-gold/30 transition-colors disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {exporting ? "Exporting..." : "Export Data"}
        </button>
        <label className="flex-1 flex items-center justify-center gap-2 bg-white border border-cream-dark rounded-xl px-4 py-3 text-sm text-warm-brown hover:border-gold/30 transition-colors cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Import Data
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
        </label>
      </div>

      {importStatus?.startsWith("success") && (
        <p className="text-xs text-green-600 text-center">
          Imported {importStatus.split(":")[1]} items successfully!
        </p>
      )}
      {importStatus === "error" && (
        <p className="text-xs text-red-500 text-center">Import failed. Please check the file format.</p>
      )}
      {importStatus === "importing" && (
        <p className="text-xs text-warm-brown-light text-center">Importing...</p>
      )}

      <p className="text-[10px] text-warm-brown-light/60">
        Export saves highlights, notes, memory verses, journal entries, and reading progress to a JSON file.
      </p>

      <button
        onClick={() => setShowDeleteModal(true)}
        className="text-sm text-red-400 hover:text-red-500"
      >
        Clear All Local Data
      </button>

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={() => {
          indexedDB.deleteDatabase("scripture-study");
          localStorage.clear();
          window.location.href = "/";
        }}
      />
    </div>
  );
}

function ShowAppTourButton() {
  const [toast, setToast] = useState(false);

  return (
    <div>
      <button
        onClick={() => {
          localStorage.removeItem("hasSeenTour");
          setToast(true);
          setTimeout(() => setToast(false), 3000);
        }}
        className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-cream-dark hover:border-gold/30 transition-colors"
      >
        <span className="text-sm text-warm-brown">Show App Tour Again</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-warm-brown-light">
          <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>
      {toast && (
        <p className="text-xs text-green-600 text-center mt-2 animate-slide-up">
          Tour will show on next visit
        </p>
      )}
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
