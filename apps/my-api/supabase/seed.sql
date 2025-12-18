-- Supabase Seed File for my-api
-- This file is run after migrations when you run `supabase db reset`
-- Use this to insert initial data for local development

-- Note: In a real app, users would be created via auth.users
-- For local dev, we can insert test profiles directly since we're not
-- enforcing the foreign key in this seed (profiles reference auth.users)

-- Insert test profiles (these would normally reference auth.users)
-- For local testing, you can create users via the Supabase Studio UI
-- and then these profiles would be linked

-- Example seed data for posts (once you have profiles set up)
-- INSERT INTO public.posts (title, content, author_id, published)
-- VALUES
--   ('Welcome to our Blog', 'This is the first post on our new platform!', '<profile-uuid>', true),
--   ('Getting Started Guide', 'Learn how to use all the features...', '<profile-uuid>', true),
--   ('Draft Post', 'This is a work in progress...', '<profile-uuid>', false);

-- For now, we'll just add a comment to indicate the seed ran successfully
DO $$
BEGIN
  RAISE NOTICE 'Seed file executed successfully!';
END $$;
