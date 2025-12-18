import { ExecutorContext, logger } from '@nx/devkit';
import { FunctionsServeExecutorSchema } from './schema';
import { resolveSupabasePath, loadEnvFile, isSupabaseRunning } from '../../utils/docker-utils';
import { runSupabaseCommandAsync } from '../../utils/supabase-cli';

export async function functionsServeExecutor(
  options: FunctionsServeExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const workdir = resolveSupabasePath(options.supabaseDirectory, context);
  const env = loadEnvFile(workdir);

  try {
    // Check if Supabase is running
    const running = await isSupabaseRunning(workdir);
    if (!running) {
      logger.error('Supabase is not running. Start it first with:');
      logger.error(`  nx run ${context.projectName}:supabase-start`);
      return { success: false };
    }

    logger.info('Starting Edge Functions development server...');

    const args: string[] = ['functions', 'serve'];

    if (options.noVerifyJwt) {
      args.push('--no-verify-jwt');
    }

    if (options.envFile) {
      args.push(`--env-file=${options.envFile}`);
    }

    if (options.debug) {
      args.push('--debug');
    }

    // Add specific functions if provided
    if (options.functions?.length) {
      args.push(...options.functions);
    }

    const result = await runSupabaseCommandAsync(args.join(' '), {
      cwd: workdir,
      env,
    });

    return { success: result.success };
  } catch (error) {
    logger.error(`Failed to serve functions: ${error instanceof Error ? error.message : error}`);
    return { success: false };
  }
}

export default functionsServeExecutor;
