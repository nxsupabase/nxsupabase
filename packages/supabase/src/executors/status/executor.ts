import { ExecutorContext, logger } from '@nx/devkit';
import { StatusExecutorSchema } from './schema';
import { resolveSupabasePath, getSupabaseStatus, isDockerRunning } from '../../utils/docker-utils';

export async function statusExecutor(
  options: StatusExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const workdir = resolveSupabasePath(options.supabaseDirectory, context);

  try {
    // Check if Docker is running
    const dockerRunning = await isDockerRunning();
    if (!dockerRunning) {
      logger.warn('Docker is not running.');
      return { success: true };
    }

    const status = await getSupabaseStatus(workdir);

    if (status) {
      logger.info('Supabase Status:');
      logger.info('');
      Object.entries(status).forEach(([key, value]) => {
        // Format key nicely
        const formattedKey = key
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        logger.info(`  ${formattedKey}: ${value}`);
      });
    } else {
      logger.info('Supabase is not running.');
      logger.info('');
      logger.info(`Run 'nx run ${context.projectName}:supabase-start' to start.`);
    }

    return { success: true };
  } catch (error) {
    logger.error(`Failed to get status: ${error instanceof Error ? error.message : error}`);
    return { success: false };
  }
}

export default statusExecutor;
