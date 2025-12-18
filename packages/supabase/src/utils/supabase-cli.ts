import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import { logger } from '@nx/devkit';

const execAsync = promisify(exec);

export interface SupabaseCliOptions {
  cwd: string;
  env?: Record<string, string>;
}

/**
 * Check if Supabase CLI is installed
 */
export async function isSupabaseCliInstalled(): Promise<boolean> {
  try {
    await execAsync('npx supabase --version');
    return true;
  } catch {
    return false;
  }
}

/**
 * Get Supabase CLI version
 */
export async function getSupabaseCliVersion(): Promise<string | null> {
  try {
    const { stdout } = await execAsync('npx supabase --version');
    return stdout.trim();
  } catch {
    return null;
  }
}

/**
 * Run a Supabase CLI command and return the output
 */
export async function runSupabaseCommand(
  command: string,
  options: SupabaseCliOptions
): Promise<{ stdout: string; stderr: string }> {
  const fullCommand = `npx supabase ${command}`;

  logger.info(`Running: ${fullCommand}`);

  return execAsync(fullCommand, {
    cwd: options.cwd,
    env: {
      ...process.env,
      ...options.env,
    },
    maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
  });
}

/**
 * Run a Supabase CLI command with streaming output
 */
export function runSupabaseCommandStream(
  command: string,
  options: SupabaseCliOptions
): ChildProcess {
  const args = command.split(' ');

  const child = spawn('npx', ['supabase', ...args], {
    cwd: options.cwd,
    env: {
      ...process.env,
      ...options.env,
    },
    stdio: 'inherit',
  });

  return child;
}

/**
 * Run Supabase CLI command and wait for completion
 */
export function runSupabaseCommandAsync(
  command: string,
  options: SupabaseCliOptions
): Promise<{ success: boolean; code: number | null }> {
  return new Promise((resolve) => {
    const child = runSupabaseCommandStream(command, options);

    child.on('close', (code) => {
      resolve({ success: code === 0, code });
    });

    child.on('error', () => {
      resolve({ success: false, code: null });
    });
  });
}
