// Scroll ↔ TheWay: both apps sign in to the same account (TheWay's Supabase
// project) and share one `saved_verses` table. A verse bookmarked here shows
// up in Scroll's saved scrolls, and verses saved in Scroll are listed in
// TheWay's Bookmarks. Ids match Scroll's verseRefSlug(): "John 3:16" → "john-3-16".
import { getSupabase } from "./supabase";

const slug = (ref) => String(ref || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** Share a verse bookmark with Scroll (no-op when signed out or for chapter bookmarks). */
export async function shareSavedVerse(userId, { book, chapter, verse, text = null }) {
  if (!userId || !verse) return;
  const sb = await getSupabase().catch(() => null);
  if (!sb) return;
  const ref = `${book} ${chapter}:${verse}`;
  await sb.from("saved_verses").upsert(
    { id: slug(ref), user_id: userId, ref, book, chapter: Number(chapter), verse_number: Number(verse), text, source_app: "theway" },
    { onConflict: "id,user_id", ignoreDuplicates: true }, // keep Scroll's row if it saved the verse first
  ).then(() => {}, () => {});
}

/** Remove a verse this app shared (leaves verses that Scroll saved alone). */
export async function unshareSavedVerse(userId, { book, chapter, verse }) {
  if (!userId || !verse) return;
  const sb = await getSupabase().catch(() => null);
  if (!sb) return;
  await sb.from("saved_verses").delete()
    .eq("user_id", userId).eq("id", slug(`${book} ${chapter}:${verse}`)).eq("source_app", "theway")
    .then(() => {}, () => {});
}

/** Verses the user saved in Scroll: [{ ref, book, chapter, verse, text, createdAt }] newest first. */
export async function savedInScroll(userId) {
  if (!userId) return [];
  const sb = await getSupabase().catch(() => null);
  if (!sb) return [];
  const { data, error } = await sb.from("saved_verses")
    .select("ref, book, chapter, verse_number, text, created_at")
    .eq("user_id", userId).eq("source_app", "scroll")
    .order("created_at", { ascending: false }).limit(200);
  if (error || !data) return [];
  return data.filter((r) => r.book && r.chapter).map((r) => ({
    ref: r.ref, book: r.book, chapter: r.chapter, verse: r.verse_number, text: r.text || "", createdAt: r.created_at,
  }));
}
