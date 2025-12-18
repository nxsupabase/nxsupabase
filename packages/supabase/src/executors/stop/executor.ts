import { ExecutorContext, logger } from '@nx/devkit';
import { StopExecutorSchema } from './schema';
import { resolveSupabasePath } from '../../utils/docker-utils';
import { runSupabaseCommandAsync } from '../../utils/supabase-cli';

export async function stopExecutor(
  options: StopExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const workdir = resolveSupabasePath(options.supabaseDirectory, context);

  try {
    logger.info(`Stopping Supabase in ${workdir}...`);

    const args: string[] = ['stop'];

    if (options.noBackup) {
      args.push('--no-backup');
    }

    const result = await runSupabaseCommandAsync(args.join(' '), { cwd: workdir });

    if (result.success) {
      logger.info('Supabase stopped successfully!');
    }

    return { success: result.success };
  } catch (error) {
    logger.error(`Failed to stop Supabase: ${error instanceof Error ? error.message : error}`);
    return { success: false };
  }
}

export default stopExecutor;
