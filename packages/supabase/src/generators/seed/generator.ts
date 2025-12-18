import {
  Tree,
  formatFiles,
  joinPathFragments,
  readProjectConfiguration,
  logger,
} from '@nx/devkit';
import { SeedGeneratorSchema } from './schema';

const SEED_TEMPLATE = `-- Supabase Seed File
-- This file is run after migrations when you run \`supabase db reset\`
-- Use this to insert initial data for local development

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Example: Create test users
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES
--   ('00000000-0000-0000-0000-000000000001', 'admin@example.com', '$2a$10$abcdefghijklmnopqrstuv', now(), now(), now()),
--   ('00000000-0000-0000-0000-000000000002', 'user@example.com', '$2a$10$abcdefghijklmnopqrstuv', now(), now(), now());

-- Example: Create profiles linked to users
-- INSERT INTO public.profiles (id, user_id, full_name, avatar_url)
-- VALUES
--   (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Admin User', 'https://example.com/avatar1.png'),
--   (gen_random_uuid(), '00000000-0000-0000-0000-000000000002', 'Test User', 'https://example.com/avatar2.png');

-- Example: Create sample data
-- INSERT INTO public.posts (id, title, content, author_id, created_at)
-- VALUES
--   (gen_random_uuid(), 'Welcome Post', 'This is the first post!', '00000000-0000-0000-0000-000000000001', now()),
--   (gen_random_uuid(), 'Getting Started', 'Learn how to use our app.', '00000000-0000-0000-0000-000000000001', now());

-- ============================================================================
-- ADD YOUR SEED DATA BELOW
-- ============================================================================

`;

export async function seedGenerator(
  tree: Tree,
  options: SeedGeneratorSchema
): Promise<void> {
  const projectConfig = readProjectConfiguration(tree, options.project);
  const projectRoot = projectConfig.root;
  const supabaseDir = options.directory || 'supabase';

  const filename = `${options.name || 'seed'}.sql`;
  const filePath = joinPathFragments(projectRoot, supabaseDir, filename);

  // Check if file already exists
  if (tree.exists(filePath)) {
    logger.warn(`Seed file already exists at ${filePath}`);
    logger.info('If you want to add more seed data, edit the existing file.');
    return;
  }

  tree.write(filePath, SEED_TEMPLATE);

  await formatFiles(tree);

  logger.info('');
  logger.info(`Seed file created: ${filePath}`);
  logger.info('');
  logger.info('The seed file runs automatically when you:');
  logger.info(`  1. Run 'nx run ${options.project}:supabase-db-reset'`);
  logger.info(`  2. Run 'supabase db reset' directly`);
  logger.info('');
  logger.info('Edit the seed file to add your development data.');
  logger.info('');
}

export default seedGenerator;
