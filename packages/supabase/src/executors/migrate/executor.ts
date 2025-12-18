import { ExecutorContext, logger } from '@nx/devkit';
import { MigrateExecutorSchema } from './schema';
import { resolveSupabasePath, loadEnvFile, isSupabaseRunning } from '../../utils/docker-utils';
import { runSupabaseCommandAsync } from '../../utils/supabase-cli';

export async function migrateExecutor(
  options: MigrateExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const workdir = resolveSupabasePath(options.supabaseDirectory, context);
  const env = loadEnvFile(workdir);

  try {
    const isRemote = options.target === 'remote';

    if (!isRemote) {
      // Check if Supabase is running for local migrations
      const running = await isSupabaseRunning(workdir);
      if (!running) {
        logger.error('Supabase is not running. Start it first with:');
        logger.error(`  nx run ${context.projectName}:supabase-start`);
        return { success: false };
      }
    }

    logger.info(`Running migrations on ${isRemote ? 'remote' : 'local'} database...`);

    const args: string[] = ['migration', 'up'];

    if (isRemote) {
      args.push('--linked');
    }

    const result = await runSupabaseCommandAsync(args.join(' '), {
      cwd: workdir,
      env,
    });

    if (result.success) {
      logger.info('');
      logger.info('Migrations applied successfully!');
    }

    return { success: result.success };
  } catch (error) {
    logger.error(`Failed to run migrations: ${error instanceof Error ? error.message : error}`);
    return { success: false };
  }
}

export default migrateExecutor;
