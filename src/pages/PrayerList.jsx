import { useState, useEffect } from "react";
import { dbGetAll, dbPut, dbDelete } from "../hooks/useDB";
import { syncPush, syncDelete } from "../services/supabaseSync";
import { submitPrayerRequest } from "../services/ghlService";
import { useAuth } from "../stores/AuthContext";
import { useToast } from "../components/Toast";
import SkeletonList from "../components/SkeletonList";
import useDocumentTitle from "../hooks/useDocumentTitle";
import useT from "../hooks/useT";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function CheckIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function PrayerList() {
  useDocumentTitle("Prayer List");
  const t = useT();
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [addType, setAddType] = useState("daily"); // "daily" | "request"
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [showAnswered, setShowAnswered] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const showToast = useToast();
  const { user, profile } = useAuth();

  useEffect(() => {
    loadPrayers();
    if (Capacitor.isNativePlatform()) requestNotificationPermission();
  }, []);

  // Reload when a background sync brings in prayers from another device
  useEffect(() => {
    const reload = () => loadPrayers();
    window.addEventListener("theway:synced", reload);
    return () => window.removeEventListener("theway:synced", reload);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function requestNotificationPermission() {
    const { display } = await LocalNotifications.checkPermissions();
    if (display === "prompt") await LocalNotifications.requestPermissions();
  }

  async function schedulePrayerReminder(activePrayerCount) {
    if (!Capacitor.isNativePlatform()) return;
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== "granted") return;
    await LocalNotifications.cancel({ notifications: [{ id: 77 }] }).catch(() => {});
    const now = new Date();
    const tomorrow8am = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 8, 0, 0);
    await LocalNotifications.schedule({
      notifications: [{
        id: 77,
        title: "Time to pray",
        body: activePrayerCount > 0
          ? `You have ${activePrayerCount} prayer request${activePrayerCount === 1 ? "" : "s"} waiting`
          : "Take a moment to bring your requests to God",
        schedule: { at: tomorrow8am, repeats: true, every: "day" },
        sound: undefined,
        smallIcon: "ic_stat_icon_config_sample",
        iconColor: "#C4973E",
      }],
    });
  }

  async function loadPrayers() {
    try {
      const all = await dbGetAll("journal");
      const prayerItems = all
        .filter((e) => e.id.startsWith("prayer-"))
        .sort((a, b) => b.createdAt - a.createdAt);
      setPrayers(prayerItems);
      const activeCount = prayerItems.filter((p) => p.status !== "answered").length;
      schedulePrayerReminder(activeCount);
    } finally {
      setLoading(false);
    }
  }

  function openForm(type) {
    setAddType(type);
    setTitle("");
    setDetails("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setTitle("");
    setDetails("");
  }

  async function addPrayer() {
    if (!title.trim()) return;
    const record = {
      id: `prayer-${Date.now()}`,
      title: title.trim(),
      content: details.trim(),
      tags: ["prayer"],
      prayerType: addType,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await dbPut("journal", record);
    syncPush("journal", record, user?.id);
    if (addType === "request" && user?.email) {
      submitPrayerRequest({
        email: user.email,
        name: profile?.name || user?.user_metadata?.name || "",
        title: record.title,
        details: record.content,
      }).catch(() => {});
    }
    closeForm();
    showToast("Prayer added");
    loadPrayers();
  }

  async function toggleAnswered(prayer) {
    const record = {
      ...prayer,
      status: prayer.status === "answered" ? "active" : "answered",
      updatedAt: Date.now(),
    };
    await dbPut("journal", record);
    syncPush("journal", record, user?.id);
    showToast(prayer.status === "answered" ? "Marked as active" : "Answered! Praise God");
    loadPrayers();
  }

  function isPrayedToday(prayer) {
    if (!prayer.lastPrayedAt) return false;
    const d = new Date(prayer.lastPrayedAt);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }

  async function togglePrayedToday(prayer) {
    const already = isPrayedToday(prayer);
    const record = { ...prayer, lastPrayedAt: already ? null : Date.now(), updatedAt: Date.now() };
    await dbPut("journal", record);
    syncPush("journal", record, user?.id);
    if (!already) showToast("Prayed 🙏");
    loadPrayers();
  }

  async function removePrayer(id) {
    await dbDelete("journal", id);
    syncDelete("journal", id, user?.id);
    setConfirmDelete(null);
    showToast("Prayer removed");
    loadPrayers();
  }

  // backward-compat: old entries without prayerType treated as requests
  const daily = prayers.filter((p) => p.prayerType === "daily");
  const requests = prayers.filter((p) => p.prayerType !== "daily");
  const activeRequests = requests.filter((p) => p.status !== "answered");
  const answeredRequests = requests.filter((p) => p.status === "answered");

  const isEmpty = prayers.length === 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <h1 className="text-xl font-bold text-warm-brown mb-6">Prayer</h1>

      {loading ? (
        <SkeletonList count={5} />
      ) : isEmpty && !showForm ? (
        /* Empty state */
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gold/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-gold">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <h2 className="font-serif text-xl font-bold text-warm-brown mb-2">{t("prayer.prayTrackRemember")}</h2>
          <p className="text-warm-brown-light text-sm mb-1 max-w-xs mx-auto leading-relaxed">{t("prayer.prayDescription")}</p>
          <p className="text-xs text-warm-brown-light/70 mb-6 max-w-xs mx-auto">{t("prayer.philippians46")}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => openForm("daily")} className="bg-gold text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-gold/90 transition-colors shadow-lg shadow-gold/20">
              Daily Prayer
            </button>
            <button onClick={() => openForm("request")} className="bg-white border border-cream-dark text-warm-brown rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-cream transition-colors">
              Add Request
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ── DAILY PRAYER ── */}
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-semibold text-warm-brown">Daily Prayer</h2>
                <p className="text-xs text-warm-brown-light">
                  {daily.filter(isPrayedToday).length}/{daily.length} prayed today
                </p>
              </div>
              <button
                onClick={() => showForm && addType === "daily" ? closeForm() : openForm("daily")}
                className="flex items-center gap-1 text-xs text-gold font-medium hover:text-gold/70 transition-colors"
              >
                <PlusIcon /> Add
              </button>
            </div>

            {showForm && addType === "daily" && <AddForm title={title} setTitle={setTitle} details={details} setDetails={setDetails} onSave={addPrayer} onCancel={closeForm} placeholder="Who or what to pray for" detailsPlaceholder="Notes (optional)" />}

            {daily.length === 0 && !(showForm && addType === "daily") ? (
              <p className="text-xs text-warm-brown-light/60 py-3 text-center">Your standing prayer list — people and things you pray for daily</p>
            ) : (
              <div className="space-y-2">
                {daily.map((p) => (
                  <PrayerCard key={p.id} prayer={p} showAnswered={false} onPrayedToday={() => togglePrayedToday(p)} onDelete={() => setConfirmDelete(p.id)} isPrayedToday={isPrayedToday(p)} />
                ))}
              </div>
            )}
          </section>

          <div className="border-t border-cream-dark mb-6" />

          {/* ── PRAYER REQUESTS ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-semibold text-warm-brown">Prayer Requests</h2>
                <p className="text-xs text-warm-brown-light">{activeRequests.length} active · {answeredRequests.length} answered</p>
              </div>
              <button
                onClick={() => showForm && addType === "request" ? closeForm() : openForm("request")}
                className="flex items-center gap-1 text-xs text-gold font-medium hover:text-gold/70 transition-colors"
              >
                <PlusIcon /> Add
              </button>
            </div>

            {showForm && addType === "request" && <AddForm title={title} setTitle={setTitle} details={details} setDetails={setDetails} onSave={addPrayer} onCancel={closeForm} placeholder="What to pray for" detailsPlaceholder="Details (optional)" />}

            {activeRequests.length === 0 && !(showForm && addType === "request") ? (
              <p className="text-xs text-warm-brown-light/60 py-3 text-center">Specific requests — tap the circle when God answers</p>
            ) : (
              <div className="space-y-2">
                {activeRequests.map((p) => (
                  <PrayerCard key={p.id} prayer={p} showAnsweredToggle onToggleAnswered={() => toggleAnswered(p)} onPrayedToday={() => togglePrayedToday(p)} onDelete={() => setConfirmDelete(p.id)} isPrayedToday={isPrayedToday(p)} />
                ))}
              </div>
            )}

            {/* Answered */}
            {answeredRequests.length > 0 && (
              <div className="mt-4">
                <button onClick={() => setShowAnswered(!showAnswered)} className="flex items-center gap-1.5 text-xs text-warm-brown-light hover:text-warm-brown transition-colors mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-3 h-3 transition-transform ${showAnswered ? "rotate-90" : ""}`}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  {answeredRequests.length} answered prayer{answeredRequests.length !== 1 ? "s" : ""}
                </button>
                {showAnswered && (
                  <div className="space-y-2">
                    {answeredRequests.map((p) => (
                      <PrayerCard key={p.id} prayer={p} showAnsweredToggle onToggleAnswered={() => toggleAnswered(p)} onDelete={() => setConfirmDelete(p.id)} isPrayedToday={false} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setConfirmDelete(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 shadow-xl max-w-xs w-full">
              <h3 className="text-warm-brown font-semibold mb-2">{t("prayer.removePrayer")}</h3>
              <p className="text-sm text-warm-brown-light mb-4">{t("prayer.removePrayerMsg")}</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-lg text-sm border border-cream-dark text-warm-brown-light hover:bg-cream transition-colors">
                  {t("general.cancel")}
                </button>
                <button onClick={() => removePrayer(confirmDelete)} className="flex-1 py-2.5 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 transition-colors">
                  {t("prayer.remove")}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AddForm({ title, setTitle, details, setDetails, onSave, onCancel, placeholder, detailsPlaceholder }) {
  return (
    <div className="bg-white rounded-xl border border-gold/30 p-4 mb-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-cream rounded-lg px-3 py-2.5 text-[16px] text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/30 mb-2"
        autoFocus
      />
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        placeholder={detailsPlaceholder}
        className="w-full bg-cream rounded-lg px-3 py-2.5 text-[16px] text-warm-brown placeholder-warm-brown-light/40 resize-none h-16 focus:outline-none focus:ring-2 focus:ring-gold/30 mb-3"
      />
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2 rounded-lg text-sm border border-cream-dark text-warm-brown-light hover:bg-cream transition-colors">
          Cancel
        </button>
        <button onClick={onSave} disabled={!title.trim()} className="flex-1 py-2 rounded-lg text-sm bg-gold text-white font-medium hover:bg-gold/90 disabled:opacity-40 transition-colors">
          Save
        </button>
      </div>
    </div>
  );
}

function PrayerCard({ prayer, showAnsweredToggle, onToggleAnswered, onPrayedToday, onDelete, isPrayedToday }) {
  const answered = prayer.status === "answered";
  return (
    <div className={`bg-white rounded-xl border p-4 transition-colors ${answered ? "border-green-200 bg-green-50/30" : "border-cream-dark"}`}>
      <div className="flex items-start gap-3">
        {showAnsweredToggle ? (
          <button
            onClick={onToggleAnswered}
            className={`w-6 h-6 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors min-w-[24px] ${answered ? "border-green-500 bg-green-500" : "border-cream-dark hover:border-gold"}`}
            aria-label={answered ? "Mark active" : "Mark answered"}
          >
            {answered && <CheckIcon className="w-3.5 h-3.5 stroke-white" />}
          </button>
        ) : (
          <div className="w-6 shrink-0 mt-0.5" />
        )}

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${answered ? "text-green-700 line-through" : "text-warm-brown"}`}>
            {prayer.title}
          </p>
          {prayer.content && (
            <p className="text-xs text-warm-brown-light mt-0.5 line-clamp-2">{prayer.content}</p>
          )}
          <p className="text-[10px] text-warm-brown-light/50 mt-1">
            {new Date(prayer.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            {answered && prayer.updatedAt && (
              <span className="text-green-600 ml-2">
                Answered {new Date(prayer.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            )}
          </p>
          {!answered && onPrayedToday && (
            <button
              onClick={onPrayedToday}
              className={`mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                isPrayedToday
                  ? "bg-gold/15 text-gold border border-gold/30"
                  : "bg-cream border border-cream-dark text-warm-brown-light hover:border-gold/40 hover:text-gold"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isPrayedToday ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {isPrayedToday ? "Prayed today" : "Pray"}
            </button>
          )}
        </div>

        <button
          onClick={onDelete}
          className="text-warm-brown-light/30 hover:text-red-400 transition-colors p-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
          aria-label="Delete"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}
