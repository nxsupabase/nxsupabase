import {
  CreateNodesV2,
  CreateNodesContextV2,
  createNodesFromFiles,
  joinPathFragments,
  TargetConfiguration,
  readJsonFile,
} from '@nx/devkit';
import { existsSync } from 'fs';
import { dirname, join } from 'path';

export interface NxSupabasePluginOptions {
  startTargetName?: string;
  stopTargetName?: string;
  statusTargetName?: string;
  dbResetTargetName?: string;
  genTypesTargetName?: string;
  migrateTargetName?: string;
  dbPushTargetName?: string;
  deployTargetName?: string;
}

const defaultOptions: Required<NxSupabasePluginOptions> = {
  startTargetName: 'supabase-start',
  stopTargetName: 'supabase-stop',
  statusTargetName: 'supabase-status',
  dbResetTargetName: 'supabase-db-reset',
  genTypesTargetName: 'supabase-gen-types',
  migrateTargetName: 'supabase-migrate',
  dbPushTargetName: 'supabase-db-push',
  deployTargetName: 'supabase-deploy',
};

/**
 * createNodesV2 implementation for automatic Supabase project detection.
 * Scans for config.toml files and creates targets for projects containing them.
 */
export const createNodesV2: CreateNodesV2<NxSupabasePluginOptions> = [
  '**/supabase/config.toml',
  async (configFiles, opts, context) => {
    const options = { ...defaultOptions, ...opts };

    return createNodesFromFiles(
      (configFile, opts, context) =>
        createNodesForSupabaseConfig(configFile, options, context),
      configFiles,
      options,
      context
    );
  },
];

function createNodesForSupabaseConfig(
  configFile: string,
  options: Required<NxSupabasePluginOptions>,
  context: CreateNodesContextV2
): Record<string, { targets: Record<string, TargetConfiguration> }> {
  const supabaseDir = dirname(configFile);
  const projectRoot = dirname(supabaseDir);

  // Find the nearest project.json to determine project name
  const projectJsonPath = join(context.workspaceRoot, projectRoot, 'project.json');

  // If no project.json exists at this level, skip (might be workspace-level supabase)
  if (!existsSync(projectJsonPath)) {
    return {};
  }

  let projectJson: { name?: string };
  try {
    projectJson = readJsonFile(projectJsonPath);
  } catch {
    return {};
  }

  const projectName = projectJson.name;
  if (!projectName) {
    return {};
  }

  const targets: Record<string, TargetConfiguration> = {};

  // Start target
  targets[options.startTargetName] = {
    executor: '@nxsupabase/supabase:start',
    options: {
      supabaseDirectory: supabaseDir,
    },
  };

  // Stop target
  targets[options.stopTargetName] = {
    executor: '@nxsupabase/supabase:stop',
    options: {
      supabaseDirectory: supabaseDir,
    },
  };

  // Status target
  targets[options.statusTargetName] = {
    executor: '@nxsupabase/supabase:status',
    options: {
      supabaseDirectory: supabaseDir,
    },
  };

  // DB Reset target
  targets[options.dbResetTargetName] = {
    executor: '@nxsupabase/supabase:db-reset',
    options: {
      supabaseDirectory: supabaseDir,
    },
  };

  // Gen Types target (with caching)
  targets[options.genTypesTargetName] = {
    executor: '@nxsupabase/supabase:gen-types',
    cache: true,
    options: {
      supabaseDirectory: supabaseDir,
      outputPath: joinPathFragments(projectRoot, 'src/types/supabase.ts'),
    },
    inputs: [
      joinPathFragments('{projectRoot}', 'supabase/migrations/**/*'),
      joinPathFragments('{projectRoot}', 'supabase/config.toml'),
    ],
    outputs: [joinPathFragments('{projectRoot}', 'src/types/supabase.ts')],
  };

  // Migrate target
  targets[options.migrateTargetName] = {
    executor: '@nxsupabase/supabase:migrate',
    options: {
      supabaseDirectory: supabaseDir,
    },
  };

  // DB Push target
  targets[options.dbPushTargetName] = {
    executor: '@nxsupabase/supabase:db-push',
    options: {
      supabaseDirectory: supabaseDir,
    },
  };

  // Deploy target
  targets[options.deployTargetName] = {
    executor: '@nxsupabase/supabase:deploy',
    options: {
      supabaseDirectory: supabaseDir,
    },
  };

  return {
    [projectRoot]: {
      targets,
    },
  };
}

// Re-export generators for programmatic usage
export { initGenerator } from './generators/init/generator';
export { projectGenerator } from './generators/project/generator';
export { migrationGenerator } from './generators/migration/generator';
export { functionGenerator } from './generators/function/generator';

// Re-export utility types
export type { PortConfig } from './utils/port-manager';
