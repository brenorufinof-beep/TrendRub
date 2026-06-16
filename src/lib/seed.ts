import type { Community, CommunityMember, Comment, Follow, Like, Message, Post, Profile } from "./types";

const now = Date.now();
const minsAgo = (m: number) => new Date(now - m * 60_000).toISOString();
const hoursAgo = (h: number) => new Date(now - h * 3_600_000).toISOString();
const daysAgo = (d: number) => new Date(now - d * 86_400_000).toISOString();

// Demo accounts — the "current user" is `me`
export const ME_ID = "u-me";

export const seedProfiles: Profile[] = [];

export const seedCommunities: Community[] = [];

export const seedMembers: CommunityMember[] = [];

export const seedPosts: Post[] = [];

export const seedLikes: Like[] = [];

export const seedComments: Comment[] = [];

export const seedFollows: Follow[] = [];

export const seedMessages: Message[] = [];

export const trendingHashtags = [];
