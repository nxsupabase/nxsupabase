import {
  Tree,
  formatFiles,
  updateJson,
  logger,
  NxJsonConfiguration,
} from '@nx/devkit';
import { InitGeneratorSchema } from './schema';

export async function initGenerator(
  tree: Tree,
  options: InitGeneratorSchema
): Promise<() => void> {
  // 1. Update nx.json to register the plugin
  if (tree.exists('nx.json')) {
    updateJson<NxJsonConfiguration>(tree, 'nx.json', (json) => {
      json.plugins = json.plugins || [];

      const hasPlugin = json.plugins.some(
        (p) =>
          p === '@nxsupabase/supabase' ||
          (typeof p === 'object' && p.plugin === '@nxsupabase/supabase')
      );

      if (!hasPlugin) {
        json.plugins.push({
          plugin: '@nxsupabase/supabase',
          options: {
            startTargetName: 'supabase-start',
            stopTargetName: 'supabase-stop',
            genTypesTargetName: 'supabase-gen-types',
            dbResetTargetName: 'supabase-db-reset',
            deployTargetName: 'supabase-deploy',
          },
        });
      }

      return json;
    });
  }

  // 2. Add targetDefaults for caching gen-types
  if (tree.exists('nx.json')) {
    updateJson<NxJsonConfiguration>(tree, 'nx.json', (json) => {
      json.targetDefaults = json.targetDefaults || {};

      if (!json.targetDefaults['supabase-gen-types']) {
        json.targetDefaults['supabase-gen-types'] = {
          cache: true,
          inputs: [
            '{projectRoot}/supabase/migrations/**/*',
            '{projectRoot}/supabase/config.toml',
          ],
          outputs: ['{projectRoot}/src/types/supabase.ts'],
        };
      }

      return json;
    });
  }

  // 3. Update .gitignore
  const gitignorePath = '.gitignore';
  if (tree.exists(gitignorePath)) {
    let content = tree.read(gitignorePath, 'utf-8') || '';

    const supabaseIgnores = `
# Supabase
.supabase/
supabase/.temp/
*.local.toml
`;

    if (!content.includes('.supabase/')) {
      content += supabaseIgnores;
      tree.write(gitignorePath, content);
    }
  }

  // 4. Ensure .nx directory exists for port registry
  if (!tree.exists('.nx')) {
    tree.write('.nx/.gitkeep', '');
  }

  await formatFiles(tree);

  // 5. Return callback for post-install actions
  return () => {
    if (!options.skipInstall) {
      logger.info('');
      logger.info('Supabase plugin initialized successfully!');
      logger.info('');
      logger.info('Ensure Supabase CLI is installed:');
      logger.info('  npm install -g supabase');
      logger.info('  # or');
      logger.info('  brew install supabase/tap/supabase');
      logger.info('');
      logger.info('Next steps:');
      logger.info(
        '  1. Run `nx g @nxsupabase/supabase:project --project=<your-app>` to add Supabase to a project'
      );
      logger.info(
        '  2. Run `nx run <your-app>:supabase-start` to start local Supabase'
      );
      logger.info('');
    }
  };
}

export default initGenerator;
