import { ExecutorContext, logger } from '@nx/devkit';
import { DbPushExecutorSchema } from './schema';
import { resolveSupabasePath, loadEnvFile } from '../../utils/docker-utils';
import { runSupabaseCommandAsync } from '../../utils/supabase-cli';

export async function dbPushExecutor(
  options: DbPushExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const workdir = resolveSupabasePath(options.supabaseDirectory, context);
  const env = loadEnvFile(workdir);

  try {
    logger.info('Pushing database changes to remote...');

    const args: string[] = ['db', 'push'];

    if (options.dryRun) {
      args.push('--dry-run');
    }

    if (options.linkedProject) {
      args.push(`--project-ref=${options.linkedProject}`);
    }

    if (options.includeSeed) {
      args.push('--include-seed');
    }

    const result = await runSupabaseCommandAsync(args.join(' '), {
      cwd: workdir,
      env: {
        ...env,
        ...(options.password ? { SUPABASE_DB_PASSWORD: options.password } : {}),
      },
    });

    if (result.success) {
      logger.info('');
      logger.info('Database push completed successfully!');
    }

    return { success: result.success };
  } catch (error) {
    logger.error(`Failed to push database: ${error instanceof Error ? error.message : error}`);
    return { success: false };
  }
}

export default dbPushExecutor;
