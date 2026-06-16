-- ============================================================
-- TrendSync — DELETE ALL DATA (Reset Database)
-- Execute this script ONLY if you want to clear everything
-- ============================================================

-- Disable all triggers temporarily to avoid constraint issues
ALTER TABLE public.profiles DISABLE TRIGGER ALL;
ALTER TABLE public.communities DISABLE TRIGGER ALL;
ALTER TABLE public.community_members DISABLE TRIGGER ALL;
ALTER TABLE public.posts DISABLE TRIGGER ALL;
ALTER TABLE public.likes DISABLE TRIGGER ALL;
ALTER TABLE public.comments DISABLE TRIGGER ALL;
ALTER TABLE public.follows DISABLE TRIGGER ALL;
ALTER TABLE public.messages DISABLE TRIGGER ALL;

-- Delete all data in correct order (from dependent tables to independent)
DELETE FROM public.messages;
DELETE FROM public.likes;
DELETE FROM public.comments;
DELETE FROM public.follows;
DELETE FROM public.posts;
DELETE FROM public.community_members;
DELETE FROM public.communities;
DELETE FROM public.profiles;

-- Delete all users from auth
DELETE FROM auth.users;

-- Re-enable all triggers
ALTER TABLE public.profiles ENABLE TRIGGER ALL;
ALTER TABLE public.communities ENABLE TRIGGER ALL;
ALTER TABLE public.community_members ENABLE TRIGGER ALL;
ALTER TABLE public.posts ENABLE TRIGGER ALL;
ALTER TABLE public.likes ENABLE TRIGGER ALL;
ALTER TABLE public.comments ENABLE TRIGGER ALL;
ALTER TABLE public.follows ENABLE TRIGGER ALL;
ALTER TABLE public.messages ENABLE TRIGGER ALL;

-- Verify all tables are empty
SELECT 'auth.users' as table_name, COUNT(*) as row_count FROM auth.users
UNION ALL
SELECT 'profiles', COUNT(*) FROM public.profiles
UNION ALL
SELECT 'communities', COUNT(*) FROM public.communities
UNION ALL
SELECT 'posts', COUNT(*) FROM public.posts
UNION ALL
SELECT 'messages', COUNT(*) FROM public.messages;

-- ============================================================
-- ✅ All users and data have been deleted!
-- ============================================================
