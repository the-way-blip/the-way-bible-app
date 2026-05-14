import { getSupabase, isSupabaseConfigured } from "./supabase";

async function sb() {
  if (!isSupabaseConfigured()) return null;
  return getSupabase();
}

// ─── Groups CRUD ───

export async function fetchMyGroups(userId) {
  const s = await sb();
  if (!s) return [];
  const { data } = await s
    .from("group_members")
    .select("group_id, role, groups(*)")
    .eq("user_id", userId);
  return (data || []).map((m) => ({ ...m.groups, myRole: m.role }));
}

export async function fetchPublicGroups() {
  const s = await sb();
  if (!s) return [];
  const { data } = await s
    .from("groups")
    .select("*")
    .eq("is_private", false)
    .order("member_count", { ascending: false })
    .limit(20);
  return data || [];
}

export async function fetchGroup(groupId) {
  const s = await sb();
  if (!s) return null;
  const { data } = await s
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();
  return data;
}

export async function createGroup(userId, { name, description, coverVerse, isPrivate }) {
  const s = await sb();
  if (!s) return null;
  const { data, error } = await s
    .from("groups")
    .insert({
      name,
      description: description || null,
      cover_verse: coverVerse || null,
      created_by: userId,
      is_private: isPrivate || false,
    })
    .select()
    .single();
  if (error) throw error;
  await s.from("group_members").insert({
    group_id: data.id,
    user_id: userId,
    role: "admin",
  });
  return data;
}

export async function deleteGroup(groupId) {
  const s = await sb();
  if (!s) return;
  await s.from("groups").delete().eq("id", groupId);
}

// ─── Membership ───

export async function joinGroup(groupId, userId) {
  const s = await sb();
  if (!s) return;
  const { error } = await s
    .from("group_members")
    .insert({ group_id: groupId, user_id: userId });
  if (error) throw error;
}

export async function joinByInviteCode(code, userId) {
  const s = await sb();
  if (!s) return null;
  const { data: group } = await s
    .from("groups")
    .select("id, name")
    .eq("invite_code", code)
    .single();
  if (!group) throw new Error("Invalid invite code");
  await joinGroup(group.id, userId);
  return group;
}

export async function leaveGroup(groupId, userId) {
  const s = await sb();
  if (!s) return;
  await s
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);
}

export async function fetchGroupMembers(groupId) {
  const s = await sb();
  if (!s) return [];
  const { data } = await s
    .from("group_members")
    .select("user_id, role, joined_at, profiles(name, email)")
    .eq("group_id", groupId)
    .order("joined_at");
  return (data || []).map((m) => ({
    userId: m.user_id,
    role: m.role,
    joinedAt: m.joined_at,
    name: m.profiles?.name || m.profiles?.email?.split("@")[0] || "Member",
  }));
}

// ─── Posts ───

export async function fetchGroupPosts(groupId, limit = 30) {
  const s = await sb();
  if (!s) return [];
  const { data } = await s
    .from("group_posts")
    .select("*, profiles(name, email)")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data || []).map((p) => ({
    ...p,
    authorName: p.profiles?.name || p.profiles?.email?.split("@")[0] || "Member",
  }));
}

export async function createPost(groupId, userId, { content, postType, verseRef, verseText }) {
  const s = await sb();
  if (!s) return null;
  const { data, error } = await s
    .from("group_posts")
    .insert({
      group_id: groupId,
      user_id: userId,
      content,
      post_type: postType || "insight",
      verse_ref: verseRef || null,
      verse_text: verseText || null,
    })
    .select("*, profiles(name, email)")
    .single();
  if (error) throw error;
  return {
    ...data,
    authorName: data.profiles?.name || data.profiles?.email?.split("@")[0] || "Member",
  };
}

export async function deletePost(postId) {
  const s = await sb();
  if (!s) return;
  await s.from("group_posts").delete().eq("id", postId);
}

// ─── Comments ───

export async function fetchComments(postId) {
  const s = await sb();
  if (!s) return [];
  const { data } = await s
    .from("post_comments")
    .select("*, profiles(name, email)")
    .eq("post_id", postId)
    .order("created_at");
  return (data || []).map((c) => ({
    ...c,
    authorName: c.profiles?.name || c.profiles?.email?.split("@")[0] || "Member",
  }));
}

export async function createComment(postId, userId, content) {
  const s = await sb();
  if (!s) return null;
  const { data, error } = await s
    .from("post_comments")
    .insert({ post_id: postId, user_id: userId, content })
    .select("*, profiles(name, email)")
    .single();
  if (error) throw error;
  return {
    ...data,
    authorName: data.profiles?.name || data.profiles?.email?.split("@")[0] || "Member",
  };
}

// ─── Likes ───

export async function toggleLike(postId, userId) {
  const s = await sb();
  if (!s) return false;
  const { data: existing } = await s
    .from("post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .single();

  if (existing) {
    await s.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
    return false;
  } else {
    await s.from("post_likes").insert({ post_id: postId, user_id: userId });
    return true;
  }
}

export async function fetchUserLikes(groupId, userId) {
  const s = await sb();
  if (!s) return new Set();
  const { data } = await s
    .from("post_likes")
    .select("post_id, group_posts!inner(group_id)")
    .eq("user_id", userId)
    .eq("group_posts.group_id", groupId);
  return new Set((data || []).map((l) => l.post_id));
}
