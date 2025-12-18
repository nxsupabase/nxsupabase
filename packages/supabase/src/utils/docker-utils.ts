import { exec } from 'child_process';
import { promisify } from 'util';
import { ExecutorContext, workspaceRoot } from '@nx/devkit';
import { isAbsolute, join } from 'path';
import { existsSync } from 'fs';
import { config as dotenvConfig } from 'dotenv';

const execAsync = promisify(exec);

/**
 * Check if Docker daemon is running
 */
export async function isDockerRunning(): Promise<boolean> {
  try {
    await execAsync('docker info', { timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get Docker version info
 */
export async function getDockerVersion(): Promise<string | null> {
  try {
    const { stdout } = await execAsync('docker --version');
    return stdout.trim();
  } catch {
    return null;
  }
}

/**
 * Check if Supabase containers are running for a specific directory
 */
export async function isSupabaseRunning(cwd: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync('npx supabase status', {
      cwd,
      timeout: 10000,
    });
    // If status returns successfully and contains API URL, it's running
    return stdout.includes('API URL:');
  } catch {
    return false;
  }
}

/**
 * Get Supabase container status
 */
export async function getSupabaseStatus(
  cwd: string
): Promise<Record<string, string> | null> {
  try {
    const { stdout } = await execAsync('npx supabase status', {
      cwd,
      timeout: 10000,
    });

    const status: Record<string, string> = {};
    const lines = stdout.split('\n');

    for (const line of lines) {
      const match = line.match(/^\s*(.+?):\s+(.+)$/);
      if (match) {
        const key = match[1].trim().toLowerCase().replace(/\s+/g, '_');
        status[key] = match[2].trim();
      }
    }

    return Object.keys(status).length > 0 ? status : null;
  } catch {
    return null;
  }
}

/**
 * Resolve the absolute path to supabase directory
 */
export function resolveSupabasePath(
  supabaseDirectory: string,
  _context?: ExecutorContext
): string {
  if (isAbsolute(supabaseDirectory)) {
    return supabaseDirectory;
  }
  return join(workspaceRoot, supabaseDirectory);
}

/**
 * Load environment variables from project and workspace .env files
 */
export function loadEnvFile(supabaseDir: string): Record<string, string> {
  const env: Record<string, string> = {};

  // Load workspace root .env
  const rootEnv = join(workspaceRoot, '.env');
  if (existsSync(rootEnv)) {
    const result = dotenvConfig({ path: rootEnv });
    Object.assign(env, result.parsed || {});
  }

  // Load workspace root .env.local (higher priority)
  const rootEnvLocal = join(workspaceRoot, '.env.local');
  if (existsSync(rootEnvLocal)) {
    const result = dotenvConfig({ path: rootEnvLocal });
    Object.assign(env, result.parsed || {});
  }

  // Load project-level .env (in parent of supabase folder)
  const projectEnv = join(supabaseDir, '..', '.env');
  if (existsSync(projectEnv)) {
    const result = dotenvConfig({ path: projectEnv });
    Object.assign(env, result.parsed || {});
  }

  // Load project-level .env.local (highest priority)
  const projectEnvLocal = join(supabaseDir, '..', '.env.local');
  if (existsSync(projectEnvLocal)) {
    const result = dotenvConfig({ path: projectEnvLocal });
    Object.assign(env, result.parsed || {});
  }

  return env;
}
