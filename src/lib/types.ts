// Domain types — mirror the Supabase schema described in the architecture doc.
export type UUID = string;

export interface Profile {
  id: UUID;
  username: string;
  display_name: string;
  avatar_url: string;
  cover_url?: string;
  bio: string;
  created_at: string;
}

export type CommunityStatus = "active" | "pending" | "archived";

export interface Community {
  id: UUID;
  title: string;
  description: string;
  category: string;
  cover_url: string;
  status: CommunityStatus;
  rules: string;
  creator_id: UUID;
  created_at: string;
}

export interface CommunityMember {
  community_id: UUID;
  user_id: UUID;
  role: "member" | "mod" | "admin";
  joined_at: string;
}

export type ContentType = "text" | "image" | "video";

export interface Post {
  id: UUID;
  user_id: UUID;
  community_id: UUID | null;
  content_type: ContentType;
  text_content: string;
  media_url?: string;
  hashtags: string[];
  created_at: string;
}

export interface Comment {
  id: UUID;
  user_id: UUID;
  post_id: UUID;
  content: string;
  created_at: string;
}

export interface Like {
  user_id: UUID;
  post_id: UUID;
  created_at: string;
}

export interface Follow {
  follower_id: UUID;
  following_id: UUID;
  created_at: string;
}

export interface Message {
  id: UUID;
  sender_id: UUID;
  receiver_id: UUID;
  content: string;
  created_at: string;
  read_at?: string | null;
}

export type FeedFilter = "global" | "following" | "communities";
