import { useState, useEffect } from "react";
import { dbGetAll, dbPut, dbDelete } from "../hooks/useDB";

export default function PrayerList() {
  const [prayers, setPrayers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [filter, setFilter] = useState("active");

  useEffect(() => { loadPrayers(); }, []);

  async function loadPrayers() {
    // Store prayers in the journal store with a prayer prefix
    const all = await dbGetAll("journal");
    const prayerItems = all
      .filter((e) => e.id.startsWith("prayer-"))
      .sort((a, b) => b.createdAt - a.createdAt);
    setPrayers(prayerItems);
  }

  async function addPrayer() {
    if (!title.trim()) return;
    await dbPut("journal", {
      id: `prayer-${Date.now()}`,
      title: title.trim(),
      content: details.trim(),
      tags: ["prayer"],
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setTitle("");
    setDetails("");
    setShowForm(false);
    loadPrayers();
  }

  async function toggleAnswered(prayer) {
    await dbPut("journal", {
      ...prayer,
      status: prayer.status === "answered" ? "active" : "answered",
      updatedAt: Date.now(),
    });
    loadPrayers();
  }

  async function removePrayer(id) {
    await dbDelete("journal", id);
    loadPrayers();
  }

  const filtered = prayers.filter((p) => {
    if (filter === "active") return p.status !== "answered";
    if (filter === "answered") return p.status === "answered";
    return true;
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-warm-brown">Prayer List</h1>
          <p className="text-sm text-warm-brown-light">{prayers.filter((p) => p.status !== "answered").length} active requests</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gold text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gold/90 transition-colors"
        >
          {showForm ? "Cancel" : "Add Prayer"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-cream-dark p-4 mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Prayer request..."
            className="w-full bg-cream rounded-lg px-3 py-2 text-sm text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:ring-2 focus:ring-gold/30 mb-2"
            autoFocus
          />
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Details or scripture reference (optional)"
            className="w-full bg-cream rounded-lg px-3 py-2 text-xs text-warm-brown placeholder-warm-brown-light/40 resize-none h-16 focus:outline-none focus:ring-2 focus:ring-gold/30 mb-2"
          />
          <button
            onClick={addPrayer}
            disabled={!title.trim()}
            className="w-full bg-gold text-white rounded-lg py-2 text-sm font-medium hover:bg-gold/90 disabled:opacity-40 transition-colors"
          >
            Save Prayer
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {[
          { id: "active", label: "Active" },
          { id: "answered", label: "Answered" },
          { id: "all", label: "All" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${filter === f.id ? "bg-gold text-white" : "bg-cream-dark text-warm-brown-light hover:bg-gold/10"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Prayer items */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-warm-brown-light">
            {filter === "answered" ? "No answered prayers yet." : "No prayer requests. Add one above."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div key={p.id} className={`bg-white rounded-xl border p-4 transition-colors ${p.status === "answered" ? "border-green-200 bg-green-50/30" : "border-cream-dark"}`}>
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleAnswered(p)}
                  className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors ${p.status === "answered" ? "border-green-500 bg-green-500" : "border-cream-dark hover:border-gold"}`}
                >
                  {p.status === "answered" && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3 h-3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${p.status === "answered" ? "text-green-700 line-through" : "text-warm-brown"}`}>
                    {p.title}
                  </p>
                  {p.content && (
                    <p className="text-xs text-warm-brown-light mt-1">{p.content}</p>
                  )}
                  <p className="text-[10px] text-warm-brown-light/50 mt-1">
                    {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <button
                  onClick={() => removePrayer(p.id)}
                  className="text-warm-brown-light/30 hover:text-red-400 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
