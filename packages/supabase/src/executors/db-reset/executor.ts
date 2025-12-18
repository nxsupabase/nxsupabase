import { ExecutorContext, logger } from '@nx/devkit';
import { DbResetExecutorSchema } from './schema';
import { resolveSupabasePath, isDockerRunning, isSupabaseRunning } from '../../utils/docker-utils';
import { runSupabaseCommandAsync } from '../../utils/supabase-cli';

export async function dbResetExecutor(
  options: DbResetExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const workdir = resolveSupabasePath(options.supabaseDirectory, context);

  try {
    // Check if Docker is running
    const dockerRunning = await isDockerRunning();
    if (!dockerRunning) {
      logger.error('Docker is not running. Please start Docker Desktop.');
      return { success: false };
    }

    // Check if Supabase is running
    const running = await isSupabaseRunning(workdir);
    if (!running) {
      logger.error('Supabase is not running. Start it first with:');
      logger.error(`  nx run ${context.projectName}:supabase-start`);
      return { success: false };
    }

    logger.warn('This will delete all data in your local database!');
    logger.info('Resetting database...');

    const args: string[] = ['db', 'reset'];

    if (options.debug) {
      args.push('--debug');
    }

    const result = await runSupabaseCommandAsync(args.join(' '), { cwd: workdir });

    if (result.success) {
      logger.info('');
      logger.info('Database reset completed!');
      logger.info('All migrations have been re-applied and seed data loaded.');
    }

    return { success: result.success };
  } catch (error) {
    logger.error(`Failed to reset database: ${error instanceof Error ? error.message : error}`);
    return { success: false };
  }
}

export default dbResetExecutor;
