import { useState, useEffect } from "react";
import { dbGetAll, dbPut, dbDelete } from "../hooks/useDB";
import { syncPush, syncDelete } from "../services/supabaseSync";
import { submitPrayerRequest } from "../services/ghlService";
import { useAuth } from "../stores/AuthContext";
import { useToast } from "../components/Toast";
import SkeletonList from "../components/SkeletonList";
import useDocumentTitle from "../hooks/useDocumentTitle";

export default function PrayerList() {
  useDocumentTitle("Prayer List");
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [filter, setFilter] = useState("active");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const showToast = useToast();
  const { user, profile } = useAuth();

  useEffect(() => { loadPrayers(); }, []);

  async function loadPrayers() {
    const all = await dbGetAll("journal");
    const prayerItems = all
      .filter((e) => e.id.startsWith("prayer-"))
      .sort((a, b) => b.createdAt - a.createdAt);
    setPrayers(prayerItems);
    setLoading(false);
  }

  async function addPrayer() {
    if (!title.trim()) return;
    const record = {
      id: `prayer-${Date.now()}`,
      title: title.trim(),
      content: details.trim(),
      tags: ["prayer"],
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await dbPut("journal", record);
    syncPush("journal", record, user?.id);
    if (user?.email) {
      submitPrayerRequest({
        email: user.email,
        name: profile?.name || user?.user_metadata?.name || "",
        title: record.title,
        details: record.content,
      });
    }
    setTitle("");
    setDetails("");
    setShowForm(false);
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
    showToast(prayer.status === "answered" ? "Marked as active" : "Marked as answered");
    loadPrayers();
  }

  async function removePrayer(id) {
    await dbDelete("journal", id);
    syncDelete("journal", id, user?.id);
    setConfirmDelete(null);
    showToast("Prayer removed");
    loadPrayers();
  }

  const filtered = prayers.filter((p) => {
    if (filter === "active") return p.status !== "answered";
    if (filter === "answered") return p.status === "answered";
    return true;
  });

  const activeCount = prayers.filter((p) => p.status !== "answered").length;
  const answeredCount = prayers.filter((p) => p.status === "answered").length;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-warm-brown">Prayer List</h1>
          <p className="text-sm text-warm-brown-light">{activeCount} active {activeCount === 1 ? "request" : "requests"}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gold text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gold/90 transition-colors flex items-center gap-1.5"
        >
          {showForm ? (
            "Cancel"
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Prayer
            </>
          )}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-cream-dark p-4 mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What would you like to pray for?"
            className="w-full bg-cream rounded-lg px-3 py-2.5 text-sm text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/30 mb-2"
            autoFocus
          />
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Details, scripture, or notes (optional)"
            className="w-full bg-cream rounded-lg px-3 py-2.5 text-xs text-warm-brown placeholder-warm-brown-light/40 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-gold/30 mb-3"
          />
          <button
            onClick={addPrayer}
            disabled={!title.trim()}
            className="w-full bg-gold text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gold/90 disabled:opacity-40 transition-colors"
          >
            Save Prayer
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {[
          { id: "active", label: "Active", count: activeCount },
          { id: "answered", label: "Answered", count: answeredCount },
          { id: "all", label: "All", count: prayers.length },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              filter === f.id ? "bg-gold text-white" : "bg-cream-dark text-warm-brown-light hover:bg-gold/10"
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Prayer items */}
      {loading ? (
        <SkeletonList count={4} />
      ) : prayers.length === 0 && !showForm ? (
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gold/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-gold">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <h2 className="font-serif text-xl font-bold text-warm-brown mb-2">Pray. Track. Remember.</h2>
          <p className="text-warm-brown-light text-sm mb-1 max-w-xs mx-auto leading-relaxed">
            Write down what you're praying for. Mark it answered when God moves. Watch His faithfulness grow over time.
          </p>
          <p className="text-xs text-warm-brown-light/70 mb-6 max-w-xs mx-auto">
            "Be careful for nothing; but in every thing by prayer..." — Philippians 4:6
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-block bg-gold text-white rounded-full px-6 py-3 text-sm font-semibold hover:bg-gold/90 transition-colors shadow-lg shadow-gold/20"
          >
            Add your first prayer
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-warm-brown-light">
            {filter === "answered"
              ? "No answered prayers yet. Keep praying!"
              : filter === "active"
              ? "All prayers answered! Add a new one."
              : "No prayers found."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div key={p.id} className={`bg-white rounded-xl border p-4 transition-colors ${p.status === "answered" ? "border-green-200 bg-green-50/30" : "border-cream-dark"}`}>
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleAnswered(p)}
                  className={`w-6 h-6 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors min-w-[24px] ${
                    p.status === "answered" ? "border-green-500 bg-green-500" : "border-cream-dark hover:border-gold"
                  }`}
                  aria-label={p.status === "answered" ? "Mark as active" : "Mark as answered"}
                >
                  {p.status === "answered" && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3.5 h-3.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${p.status === "answered" ? "text-green-700 line-through" : "text-warm-brown"}`}>
                    {p.title}
                  </p>
                  {p.content && (
                    <p className="text-xs text-warm-brown-light mt-1 line-clamp-2">{p.content}</p>
                  )}
                  <p className="text-[10px] text-warm-brown-light/50 mt-1.5">
                    {new Date(p.createdAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    {p.status === "answered" && p.updatedAt && (
                      <span className="text-green-600 ml-2">
                        Answered {new Date(p.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setConfirmDelete(p.id)}
                  className="text-warm-brown-light/30 hover:text-red-400 transition-colors p-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
                  aria-label="Delete prayer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setConfirmDelete(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 shadow-xl max-w-xs w-full">
              <h3 className="text-warm-brown font-semibold mb-2">Remove Prayer?</h3>
              <p className="text-sm text-warm-brown-light mb-4">This will permanently remove this prayer request.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 rounded-lg text-sm border border-cream-dark text-warm-brown-light hover:bg-cream transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => removePrayer(confirmDelete)}
                  className="flex-1 py-2.5 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
