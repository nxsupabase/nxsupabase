import { ExecutorContext, logger } from '@nx/devkit';
import { DeployExecutorSchema } from './schema';
import { resolveSupabasePath, loadEnvFile } from '../../utils/docker-utils';
import { runSupabaseCommandAsync } from '../../utils/supabase-cli';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

function getFunctionNames(functionsDir: string): string[] {
  try {
    return readdirSync(functionsDir)
      .filter((name) => {
        if (name.startsWith('_')) return false; // Skip _shared etc.
        const fullPath = join(functionsDir, name);
        return statSync(fullPath).isDirectory();
      });
  } catch {
    return [];
  }
}

export async function deployExecutor(
  options: DeployExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const workdir = resolveSupabasePath(options.supabaseDirectory, context);
  const env = loadEnvFile(workdir);

  try {
    const projectFlag = options.projectRef ? `--project-ref=${options.projectRef}` : '';

    // Push migrations first
    if (options.pushMigrations !== false) {
      logger.info('Pushing migrations to remote...');

      const dbPushResult = await runSupabaseCommandAsync(
        `db push ${projectFlag}`,
        { cwd: workdir, env }
      );

      if (!dbPushResult.success) {
        logger.error('Failed to push migrations');
        return { success: false };
      }

      logger.info('Migrations pushed successfully!');
    }

    // Deploy Edge Functions
    if (options.deployFunctions !== false) {
      logger.info('Deploying Edge Functions...');

      const functionsDir = join(workdir, 'functions');
      const functionsToDeply = options.functions?.length
        ? options.functions
        : getFunctionNames(functionsDir);

      if (functionsToDeply.length === 0) {
        logger.info('No functions to deploy.');
      } else {
        for (const fn of functionsToDeply) {
          logger.info(`Deploying function: ${fn}...`);

          const noVerifyFlag = options.noVerifyJwt ? '--no-verify-jwt' : '';

          const result = await runSupabaseCommandAsync(
            `functions deploy ${fn} ${projectFlag} ${noVerifyFlag}`.trim(),
            { cwd: workdir, env }
          );

          if (!result.success) {
            logger.error(`Failed to deploy function: ${fn}`);
            return { success: false };
          }

          logger.info(`Function '${fn}' deployed!`);
        }
      }
    }

    logger.info('');
    logger.info('Deployment completed successfully!');

    return { success: true };
  } catch (error) {
    logger.error(`Deployment failed: ${error instanceof Error ? error.message : error}`);
    return { success: false };
  }
}

export default deployExecutor;
