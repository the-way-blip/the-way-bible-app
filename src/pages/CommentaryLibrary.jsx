import ComingSoon from "../components/ComingSoon";

export function saveCommentary(commentary, book, chapter) {
  try {
    const saved = JSON.parse(localStorage.getItem("savedCommentaries") || "[]");
    const entry = { ...commentary, book, chapter, savedAt: Date.now() };
    if (!saved.some((s) => s.author === entry.author && s.book === book && s.chapter === chapter)) {
      saved.unshift(entry);
      localStorage.setItem("savedCommentaries", JSON.stringify(saved.slice(0, 100)));
    }
  } catch {}
}

export default function CommentaryLibrary() {
  return (
    <ComingSoon
      title="Commentary Library"
      description="Read alongside the Church Fathers and classic commentators. Commentary features are coming soon."
    />
  );
}
