// ============================================================
// TrendSync — API layer (mock, but shaped like Supabase calls)
// Every function here would map to a `supabase.from(...).xxx()`
// call in production. Keeping them in one place makes the swap
// trivial.
// ============================================================
import { supabase } from "./supabaseClient";
import { db, uid } from "./store";
import type { ContentType, FeedFilter, Post, Profile } from "./types";

const HASHTAG_RE = /#[\p{L}0-9_]+/gu;
function extractHashtags(text: string): string[] {
  const matches = text.match(HASHTAG_RE) ?? [];
  return [...new Set(matches.map((t) => t.toLowerCase()))];
}

async function fetchProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (error) {
    console.error("fetchProfileById", error);
    return null;
  }
  return data;
}

async function syncSession(sessionUserId: string | null) {
  if (!sessionUserId) {
    db.set((s) => ({ ...s, currentUserId: null }));
    return;
  }

  const profile = await fetchProfileById(sessionUserId);
  if (!profile) {
    db.set((s) => ({ ...s, currentUserId: null }));
    return;
  }

  db.set((s) => ({
    ...s,
    currentUserId: profile.id,
    profiles: s.profiles.some((p) => p.id === profile.id) ? s.profiles : [profile, ...s.profiles],
  }));
}

export async function initializeSupabaseAuthState() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Failed to restore Supabase session", error);
  }

  await syncSession(data?.session?.user?.id ?? null);
}

supabase.auth.onAuthStateChange((_event, session) => {
  void syncSession(session?.user?.id ?? null);
});

// ---------- AUTH ----------
export const authApi = {
  async signIn(username: string, password: string) {
    const email = `${username.trim().toLowerCase().replace(/\s+/g, ".")}@trend.sync`;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    const user = data.user;
    if (!user) return { error: "Não foi possível autenticar." };

    const profile = await fetchProfileById(user.id);
    if (!profile) return { error: "Perfil não encontrado no Supabase." };

    db.set((s) => ({
      ...s,
      currentUserId: profile.id,
      profiles: s.profiles.some((p) => p.id === profile.id) ? s.profiles : [profile, ...s.profiles],
    }));

    return { profile };
  },
  async signUp(input: { username: string; display_name: string; password: string; bio?: string }) {
    const normalizedUsername = input.username.trim().toLowerCase().replace(/\s+/g, ".");
    const email = `${normalizedUsername}@trend.sync`;
    const avatar_url = `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(normalizedUsername)}`;

    const { data, error } = await supabase.auth.signUp(
      { email, password: input.password },
      {
        data: {
          username: normalizedUsername,
          display_name: input.display_name || normalizedUsername,
          avatar_url,
          bio: input.bio ?? "",
        },
      }
    );

    if (error) return { error: error.message };

    const user = data.user;
    if (!user) return { error: "Não foi possível criar a conta." };

    let profile = await fetchProfileById(user.id);
    if (!profile) {
      const newProfile = {
        id: user.id,
        username: normalizedUsername,
        display_name: input.display_name || normalizedUsername,
        avatar_url,
        bio: input.bio ?? "",
        created_at: new Date().toISOString(),
      };
      const insert = await supabase.from("profiles").insert(newProfile);
      if (insert.error) {
        console.error("Failed to insert profile:", insert.error);
        return { error: "Conta criada, mas falha ao criar o perfil." };
      }
      profile = newProfile;
    }

    db.set((s) => ({
      ...s,
      currentUserId: profile.id,
      profiles: s.profiles.some((p) => p.id === profile!.id) ? s.profiles : [profile!, ...s.profiles],
    }));

    return { profile };
  },
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Supabase sign out error:", error);
    db.set((s) => ({ ...s, currentUserId: null }));
  },
  resetSeed() {
    db.reset();
  },
};

// ---------- PROFILES ----------
export const profilesApi = {
  update(id: string, patch: Partial<{ display_name: string; bio: string; avatar_url: string }>) {
    db.set((s) => ({
      ...s,
      profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  },
};

// ---------- POSTS ----------
export const postsApi = {
  create(input: {
    user_id: string;
    text_content: string;
    content_type?: ContentType;
    media_url?: string;
    community_id?: string | null;
  }): Post {
    const post: Post = {
      id: uid("p"),
      user_id: input.user_id,
      community_id: input.community_id ?? null,
      content_type: input.content_type ?? (input.media_url ? "image" : "text"),
      text_content: input.text_content,
      media_url: input.media_url,
      hashtags: extractHashtags(input.text_content),
      created_at: new Date().toISOString(),
    };
    db.set((s) => ({ ...s, posts: [post, ...s.posts] }));
    return post;
  },
  remove(id: string, asUser: string) {
    db.set((s) => ({
      ...s,
      posts: s.posts.filter((p) => !(p.id === id && p.user_id === asUser)),
      likes: s.likes.filter((l) => l.post_id !== id),
      comments: s.comments.filter((c) => c.post_id !== id),
    }));
  },
  update(id: string, asUser: string, patch: { text_content?: string }) {
    db.set((s) => ({
      ...s,
      posts: s.posts.map((p) =>
        p.id === id && p.user_id === asUser
          ? {
              ...p,
              ...patch,
              hashtags: patch.text_content ? extractHashtags(patch.text_content) : p.hashtags,
            }
          : p
      ),
    }));
  },
};

export function selectFeed(filter: FeedFilter, meId: string | null): Post[] {
  const s = db.getState();
  const followingIds = new Set(s.follows.filter((f) => f.follower_id === meId).map((f) => f.following_id));
  const myCommIds = new Set(s.members.filter((m) => m.user_id === meId).map((m) => m.community_id));

  let list = s.posts;
  if (filter === "following") {
    list = list.filter((p) => followingIds.has(p.user_id) || p.user_id === meId);
  } else if (filter === "communities") {
    list = list.filter((p) => p.community_id && myCommIds.has(p.community_id));
  }
  return [...list].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
}

// ---------- LIKES ----------
export const likesApi = {
  toggle(postId: string, userId: string) {
    const s = db.getState();
    const exists = s.likes.find((l) => l.post_id === postId && l.user_id === userId);
    if (exists) {
      db.set((cur) => ({
        ...cur,
        likes: cur.likes.filter((l) => !(l.post_id === postId && l.user_id === userId)),
      }));
    } else {
      db.set((cur) => ({
        ...cur,
        likes: [...cur.likes, { post_id: postId, user_id: userId, created_at: new Date().toISOString() }],
      }));
    }
  },
};

// ---------- COMMENTS ----------
export const commentsApi = {
  add(postId: string, userId: string, content: string) {
    if (!content.trim()) return;
    db.set((s) => ({
      ...s,
      comments: [
        ...s.comments,
        { id: uid("cm"), post_id: postId, user_id: userId, content: content.trim(), created_at: new Date().toISOString() },
      ],
    }));
  },
  remove(id: string, asUser: string) {
    db.set((s) => ({
      ...s,
      comments: s.comments.filter((c) => !(c.id === id && c.user_id === asUser)),
    }));
  },
};

// ---------- FOLLOWS ----------
export const followsApi = {
  toggle(targetId: string, meId: string) {
    if (targetId === meId) return;
    const s = db.getState();
    const exists = s.follows.find((f) => f.follower_id === meId && f.following_id === targetId);
    if (exists) {
      db.set((cur) => ({
        ...cur,
        follows: cur.follows.filter((f) => !(f.follower_id === meId && f.following_id === targetId)),
      }));
    } else {
      db.set((cur) => ({
        ...cur,
        follows: [...cur.follows, { follower_id: meId, following_id: targetId, created_at: new Date().toISOString() }],
      }));
    }
  },
};

// ---------- COMMUNITIES ----------
export const communitiesApi = {
  create(input: {
    creator_id: string;
    title: string;
    description: string;
    category: string;
    rules: string;
    cover_url?: string;
  }) {
    const id = uid("c");
    const c = {
      id,
      title: input.title,
      description: input.description,
      category: input.category,
      cover_url: input.cover_url ?? "linear-gradient(135deg,#06B6D4,#2563EB,#8B5CF6)",
      status: "active" as const,
      rules: input.rules,
      creator_id: input.creator_id,
      created_at: new Date().toISOString(),
    };
    db.set((s) => ({
      ...s,
      communities: [c, ...s.communities],
      members: [
        ...s.members,
        { community_id: id, user_id: input.creator_id, role: "admin", joined_at: new Date().toISOString() },
      ],
    }));
    return c;
  },
  update(id: string, asUser: string, patch: Partial<{ title: string; description: string; category: string; rules: string }>) {
    db.set((s) => ({
      ...s,
      communities: s.communities.map((c) =>
        c.id === id && c.creator_id === asUser ? { ...c, ...patch } : c
      ),
    }));
  },
  remove(id: string, asUser: string) {
    db.set((s) => ({
      ...s,
      communities: s.communities.filter((c) => !(c.id === id && c.creator_id === asUser)),
      members: s.members.filter((m) => m.community_id !== id),
      posts: s.posts.map((p) => (p.community_id === id ? { ...p, community_id: null } : p)),
    }));
  },
  toggleMembership(communityId: string, userId: string) {
    const s = db.getState();
    const exists = s.members.find((m) => m.community_id === communityId && m.user_id === userId);
    if (exists) {
      // Don't let the admin leave their own community
      const c = s.communities.find((c) => c.id === communityId);
      if (c?.creator_id === userId) return;
      db.set((cur) => ({
        ...cur,
        members: cur.members.filter((m) => !(m.community_id === communityId && m.user_id === userId)),
      }));
    } else {
      db.set((cur) => ({
        ...cur,
        members: [
          ...cur.members,
          { community_id: communityId, user_id: userId, role: "member", joined_at: new Date().toISOString() },
        ],
      }));
    }
  },
};

// ---------- MESSAGES ----------
export const messagesApi = {
  send(senderId: string, receiverId: string, content: string) {
    if (!content.trim()) return;
    db.set((s) => ({
      ...s,
      messages: [
        ...s.messages,
        {
          id: uid("m"),
          sender_id: senderId,
          receiver_id: receiverId,
          content: content.trim(),
          created_at: new Date().toISOString(),
          read_at: null,
        },
      ],
    }));
  },
  markRead(meId: string, otherId: string) {
    db.set((s) => ({
      ...s,
      messages: s.messages.map((m) =>
        m.sender_id === otherId && m.receiver_id === meId && !m.read_at
          ? { ...m, read_at: new Date().toISOString() }
          : m
      ),
    }));
  },
};

// ---------- DERIVED SELECTORS ----------
export function getConversations(meId: string) {
  const s = db.getState();
  const partners = new Map<string, { lastMessage: import("./types").Message; unread: number }>();
  for (const m of s.messages) {
    const other = m.sender_id === meId ? m.receiver_id : m.receiver_id === meId ? m.sender_id : null;
    if (!other) continue;
    const cur = partners.get(other);
    const unread = m.sender_id === other && !m.read_at ? 1 : 0;
    if (!cur || +new Date(m.created_at) > +new Date(cur.lastMessage.created_at)) {
      partners.set(other, { lastMessage: m, unread: (cur?.unread ?? 0) + unread });
    } else {
      partners.set(other, { ...cur, unread: cur.unread + unread });
    }
  }
  return [...partners.entries()]
    .map(([id, v]) => ({
      partner: s.profiles.find((p) => p.id === id)!,
      ...v,
    }))
    .filter((c) => c.partner)
    .sort((a, b) => +new Date(b.lastMessage.created_at) - +new Date(a.lastMessage.created_at));
}
