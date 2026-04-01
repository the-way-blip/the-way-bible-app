import { useState, useRef, useEffect } from "react";

const API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;

export default function AIChat({ book, chapter, verses }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  // Reset chat when chapter changes
  useEffect(() => {
    setMessages([]);
  }, [book, chapter]);

  const versesText = verses?.map((v) => `${v.verse}. ${v.text}`).join("\n") || "";

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    if (!API_KEY) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "To use the AI study assistant, add your Claude API key to the .env file:\n\nVITE_CLAUDE_API_KEY=sk-ant-...\n\nThen restart the dev server."
      }]);
      setLoading(false);
      return;
    }

    try {
      const systemPrompt = `You are a knowledgeable Bible study assistant. The user is currently reading ${book} chapter ${chapter} (KJV). Here is the chapter text:\n\n${versesText}\n\nHelp them understand the text. Answer questions about context, meaning, theology, history, Greek/Hebrew words, cross-references, and application. Be scholarly but accessible. Cite specific verses when relevant. Keep answers concise (2-4 paragraphs max).`;

      const chatHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: systemPrompt,
          messages: [...chatHistory, { role: "user", content: userMsg }],
        }),
      });

      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.content[0].text }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-30 w-12 h-12 bg-gold text-white rounded-full shadow-lg hover:bg-gold/90 transition-colors flex items-center justify-center"
        title="AI Study Assistant"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={() => setOpen(false)} />
      <div className="fixed bottom-20 right-2 left-2 md:bottom-8 md:right-8 md:left-auto md:w-96 z-50 bg-white rounded-2xl shadow-2xl border border-cream-dark flex flex-col" style={{ maxHeight: "60vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-cream-dark shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gold rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-3.5 h-3.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-warm-brown">AI Study Assistant</p>
              <p className="text-[10px] text-warm-brown-light">{book} {chapter}</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-warm-brown-light hover:text-warm-brown p-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-6">
              <p className="text-xs text-warm-brown-light mb-3">Ask me anything about {book} {chapter}</p>
              <div className="space-y-1.5">
                {[
                  `What is the main theme of ${book} ${chapter}?`,
                  "Explain the historical context",
                  "What are the key Greek/Hebrew words?",
                  "How does this connect to the rest of Scripture?",
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(q); }}
                    className="block w-full text-left text-[11px] text-warm-brown bg-cream rounded-lg px-3 py-2 hover:bg-cream-dark transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-gold text-white rounded-br-sm"
                  : "bg-cream text-warm-brown rounded-bl-sm"
              }`}>
                {msg.content.split("\n").map((line, j) => (
                  <p key={j} className={j > 0 ? "mt-1.5" : ""}>{line}</p>
                ))}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-cream rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-warm-brown-light rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-warm-brown-light rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-1.5 h-1.5 bg-warm-brown-light rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-cream-dark shrink-0">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this chapter..."
              className="flex-1 bg-cream rounded-xl px-3 py-2 text-xs text-warm-brown placeholder-warm-brown-light/40 focus:outline-none focus:ring-1 focus:ring-gold/30"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-gold text-white rounded-xl px-3 py-2 disabled:opacity-40 transition-colors hover:bg-gold/90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
