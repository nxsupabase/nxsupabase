import {
  Tree,
  formatFiles,
  joinPathFragments,
  readProjectConfiguration,
  names,
  logger,
} from '@nx/devkit';
import { MigrationGeneratorSchema } from './schema';

function getTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

export async function migrationGenerator(
  tree: Tree,
  options: MigrationGeneratorSchema
): Promise<void> {
  const projectConfig = readProjectConfiguration(tree, options.project);
  const projectRoot = projectConfig.root;
  const supabaseDir = options.directory || 'supabase';

  const timestamp = getTimestamp();
  const migrationName = names(options.name).fileName.replace(/-/g, '_');

  const migrationsDir = joinPathFragments(projectRoot, supabaseDir, 'migrations');

  // Ensure migrations directory exists
  if (!tree.exists(migrationsDir)) {
    tree.write(joinPathFragments(migrationsDir, '.gitkeep'), '');
  }

  const filename = `${timestamp}_${migrationName}.sql`;
  const filePath = joinPathFragments(migrationsDir, filename);

  const sqlContent = options.sql || `-- Migration: ${migrationName}
-- Created at: ${new Date().toISOString()}

-- Write your migration SQL here

-- Example: Create a table
-- CREATE TABLE public.example (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   name text NOT NULL,
--   created_at timestamptz DEFAULT now()
-- );

-- Example: Add RLS policies
-- ALTER TABLE public.example ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable read access for all users" ON public.example FOR SELECT USING (true);
`;

  tree.write(filePath, sqlContent);

  await formatFiles(tree);

  logger.info('');
  logger.info(`Migration created: ${filePath}`);
  logger.info('');
  logger.info('Next steps:');
  logger.info(`  1. Edit the migration file to add your SQL`);
  logger.info(`  2. Run 'nx run ${options.project}:supabase-db-reset' to apply locally`);
  logger.info(`  3. Run 'nx run ${options.project}:supabase-gen-types' to update types`);
  logger.info('');
}

export default migrationGenerator;
