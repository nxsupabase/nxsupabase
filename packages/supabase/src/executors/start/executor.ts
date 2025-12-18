import { ExecutorContext, logger } from '@nx/devkit';
import { StartExecutorSchema } from './schema';
import { resolveSupabasePath, isDockerRunning, getSupabaseStatus } from '../../utils/docker-utils';
import { runSupabaseCommandAsync } from '../../utils/supabase-cli';

export async function startExecutor(
  options: StartExecutorSchema,
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

    // Check if already running
    const status = await getSupabaseStatus(workdir);
    if (status) {
      logger.info('Supabase is already running!');
      logger.info('');
      Object.entries(status).forEach(([key, value]) => {
        logger.info(`  ${key}: ${value}`);
      });
      return { success: true };
    }

    logger.info(`Starting Supabase in ${workdir}...`);

    // Build command arguments
    const args: string[] = ['start'];

    if (options.ignorePaths?.length) {
      options.ignorePaths.forEach((path) => {
        args.push('--ignore-health-check');
      });
    }

    if (options.excludeServices?.length) {
      options.excludeServices.forEach((service) => {
        args.push(`--exclude=${service}`);
      });
    }

    if (options.debug) {
      args.push('--debug');
    }

    const result = await runSupabaseCommandAsync(args.join(' '), { cwd: workdir });

    if (result.success) {
      logger.info('');
      logger.info('Supabase started successfully!');

      // Show status after starting
      const newStatus = await getSupabaseStatus(workdir);
      if (newStatus) {
        logger.info('');
        Object.entries(newStatus).forEach(([key, value]) => {
          logger.info(`  ${key}: ${value}`);
        });
      }
    }

    return { success: result.success };
  } catch (error) {
    logger.error(`Failed to start Supabase: ${error instanceof Error ? error.message : error}`);
    return { success: false };
  }
}

export default startExecutor;
