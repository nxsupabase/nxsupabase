import {
  Tree,
  formatFiles,
  generateFiles,
  joinPathFragments,
  readProjectConfiguration,
  updateProjectConfiguration,
  names,
  offsetFromRoot,
  logger,
} from '@nx/devkit';
import { ProjectGeneratorSchema } from './schema';
import { getAvailablePorts, PortConfig } from '../../utils/port-manager';
import initGenerator from '../init/generator';

export async function projectGenerator(
  tree: Tree,
  options: ProjectGeneratorSchema
): Promise<void> {
  // Run init generator first if not skipped
  if (!options.skipInit) {
    await initGenerator(tree, { skipInstall: true });
  }

  const projectConfig = readProjectConfiguration(tree, options.project);
  const projectRoot = projectConfig.root;
  const supabaseDir = options.directory || 'supabase';
  const supabasePath = joinPathFragments(projectRoot, supabaseDir);

  // Get unique ports for this project
  const ports = await getAvailablePorts(tree, options.project, {
    dbPort: options.dbPort,
    apiPort: options.apiPort,
    studioPort: options.studioPort,
    inbucketPort: options.inbucketPort,
  });

  const templateOptions = {
    ...options,
    ...names(options.project),
    ...ports,
    projectRoot,
    supabaseDir,
    offsetFromRoot: offsetFromRoot(projectRoot),
    tmpl: '',
  };

  // Generate supabase config files
  generateFiles(
    tree,
    joinPathFragments(__dirname, 'files'),
    supabasePath,
    templateOptions
  );

  // Create migrations directory
  if (!tree.exists(joinPathFragments(supabasePath, 'migrations'))) {
    tree.write(joinPathFragments(supabasePath, 'migrations', '.gitkeep'), '');
  }

  // Create functions directory if enabled
  if (options.enableEdgeFunctions !== false) {
    if (!tree.exists(joinPathFragments(supabasePath, 'functions'))) {
      tree.write(joinPathFragments(supabasePath, 'functions', '.gitkeep'), '');
    }
  }

  // Create types directory
  const typesPath = joinPathFragments(projectRoot, 'src', 'types');
  if (!tree.exists(typesPath)) {
    tree.write(joinPathFragments(typesPath, '.gitkeep'), '');
  }

  // Update project.json with Supabase targets
  updateProjectConfiguration(tree, options.project, {
    ...projectConfig,
    targets: {
      ...projectConfig.targets,
      'supabase-start': {
        executor: '@nxsupabase/supabase:start',
        options: {
          supabaseDirectory: supabasePath,
        },
      },
      'supabase-stop': {
        executor: '@nxsupabase/supabase:stop',
        options: {
          supabaseDirectory: supabasePath,
        },
      },
      'supabase-status': {
        executor: '@nxsupabase/supabase:status',
        options: {
          supabaseDirectory: supabasePath,
        },
      },
      'supabase-db-reset': {
        executor: '@nxsupabase/supabase:db-reset',
        options: {
          supabaseDirectory: supabasePath,
        },
      },
      'supabase-gen-types': {
        executor: '@nxsupabase/supabase:gen-types',
        options: {
          supabaseDirectory: supabasePath,
          outputPath: joinPathFragments(projectRoot, 'src', 'types', 'supabase.ts'),
        },
        cache: true,
        inputs: [
          `{projectRoot}/${supabaseDir}/migrations/**/*`,
          `{projectRoot}/${supabaseDir}/config.toml`,
        ],
        outputs: ['{projectRoot}/src/types/supabase.ts'],
      },
      'supabase-migrate': {
        executor: '@nxsupabase/supabase:migrate',
        options: {
          supabaseDirectory: supabasePath,
        },
      },
      'supabase-db-push': {
        executor: '@nxsupabase/supabase:db-push',
        options: {
          supabaseDirectory: supabasePath,
        },
      },
      'supabase-deploy': {
        executor: '@nxsupabase/supabase:deploy',
        options: {
          supabaseDirectory: supabasePath,
        },
      },
    },
  });

  await formatFiles(tree);

  logSuccess(options.project, ports);
}

function logSuccess(projectName: string, ports: PortConfig): void {
  logger.info('');
  logger.info(`Supabase configured for ${projectName}!`);
  logger.info('');
  logger.info('Local development ports:');
  logger.info(`  Database:  postgresql://postgres:postgres@127.0.0.1:${ports.dbPort}/postgres`);
  logger.info(`  API:       http://127.0.0.1:${ports.apiPort}`);
  logger.info(`  Studio:    http://127.0.0.1:${ports.studioPort}`);
  logger.info(`  Inbucket:  http://127.0.0.1:${ports.inbucketPort}`);
  logger.info('');
  logger.info('Available commands:');
  logger.info(`  nx run ${projectName}:supabase-start     # Start local Supabase`);
  logger.info(`  nx run ${projectName}:supabase-stop      # Stop local Supabase`);
  logger.info(`  nx run ${projectName}:supabase-status    # Show status`);
  logger.info(`  nx run ${projectName}:supabase-db-reset  # Reset database`);
  logger.info(`  nx run ${projectName}:supabase-gen-types # Generate TypeScript types`);
  logger.info('');
}

export default projectGenerator;
