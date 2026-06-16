// ============================================================
// TrendSync — In-memory reactive store
// Mirrors the Supabase tables shape so swapping to a real
// backend is a matter of replacing the resolvers in `api.ts`.
// ============================================================
import { useSyncExternalStore, useRef } from "react";
import type {
  Comment,
  Community,
  CommunityMember,
  Follow,
  Like,
  Message,
  Post,
  Profile,
} from "./types";
import {
  ME_ID,
  seedComments,
  seedCommunities,
  seedFollows,
  seedLikes,
  seedMembers,
  seedMessages,
  seedPosts,
  seedProfiles,
} from "./seed";

export interface DBState {
  profiles: Profile[];
  communities: Community[];
  members: CommunityMember[];
  posts: Post[];
  likes: Like[];
  comments: Comment[];
  follows: Follow[];
  messages: Message[];
  currentUserId: string | null;
}

const STORAGE_KEY = "trendsync:v1";
const RESET_FLAG_KEY = "trendsync:reset-v1";
const LEGACY_PROFILE_IDS = new Set(["u-lia", "u-rafa", "u-bia", "u-theo", "u-nina"]);
const LEGACY_COMMUNITY_IDS = new Set(["c-ui", "c-30days", "c-lofi", "c-indie", "c-100art"]);
const LEGACY_POST_IDS = new Set(["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"]);
const LEGACY_COMMENT_IDS = new Set(["cm1", "cm2", "cm3", "cm4"]);
const LEGACY_MESSAGE_IDS = new Set(["m1", "m2", "m3", "m4", "m5", "m6"]);

function isLegacySeed(parsed: DBState) {
  if (parsed.profiles.some((p) => LEGACY_PROFILE_IDS.has(p.id))) return true;
  if (parsed.communities.some((c) => LEGACY_COMMUNITY_IDS.has(c.id))) return true;
  if (parsed.posts.some((p) => LEGACY_POST_IDS.has(p.id))) return true;
  if (parsed.comments.some((c) => LEGACY_COMMENT_IDS.has(c.id))) return true;
  if (parsed.messages.some((m) => LEGACY_MESSAGE_IDS.has(m.id))) return true;
  return false;
}

function load(): DBState {
  if (typeof window === "undefined") return initial();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initial();
    const parsed = JSON.parse(raw) as DBState;
    // sanity check
    if (!parsed.profiles || !parsed.posts) return initial();
    if (!localStorage.getItem(RESET_FLAG_KEY) || isLegacySeed(parsed)) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(RESET_FLAG_KEY, "1");
      return initial();
    }
    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(RESET_FLAG_KEY, "1");
    return initial();
  }
}

function initial(): DBState {
  return {
    profiles: [...seedProfiles],
    communities: [...seedCommunities],
    members: [...seedMembers],
    posts: [...seedPosts],
    likes: [...seedLikes],
    comments: [...seedComments],
    follows: [...seedFollows],
    messages: [...seedMessages],
    currentUserId: null, // user must "login" to access app
  };
}

let state: DBState = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota — ignore */
  }
}

function emit() {
  persist();
  listeners.forEach((fn) => fn());
}

export const db = {
  getState: () => state,
  subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  set: (updater: (s: DBState) => DBState) => {
    state = updater(state);
    emit();
  },
  reset: () => {
    state = initial();
    emit();
  },
  ME_ID,
};

export function useDB<T>(selector: (s: DBState) => T): T {
  return useSyncExternalStore(
    db.subscribe,
    () => selector(db.getState()),
    () => selector(db.getState())
  );
}

// Shallow equality check for arrays and objects
function shallowEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => val === b[idx]);
  }
  return false;
}

// Hook that memoizes the result to avoid infinite loops with array/object returns
export function useDBMemo<T>(
  selector: (s: DBState) => T,
  isEqual: (a: T, b: T) => boolean = shallowEqual
): T {
  const prevRef = useRef<T | undefined>(undefined);
  
  return useSyncExternalStore(
    db.subscribe,
    () => {
      const curr = selector(db.getState());
      if (prevRef.current === undefined || !isEqual(prevRef.current, curr)) {
        prevRef.current = curr;
      }
      return prevRef.current;
    },
    () => {
      const curr = selector(db.getState());
      if (prevRef.current === undefined || !isEqual(prevRef.current, curr)) {
        prevRef.current = curr;
      }
      return prevRef.current;
    }
  );
}

// id generator
export const uid = (prefix = "id") =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
