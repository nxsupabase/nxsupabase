# @nxsupabase/supabase

Nx plugin for Supabase - Automated migrations, type generation, and local dev setup for Nx monorepos.

## Features

- **Generators** for scaffolding Supabase projects, migrations, and Edge Functions
- **Executors** for local development, database operations, and deployment
- **Automatic type generation** with Nx caching support
- **Multi-project support** with automatic port management
- **Project inference** via createNodesV2 (auto-detect Supabase configs)
- **Full Docker orchestration** for local Supabase instances

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed globally:

```bash
npm install -g supabase
# or
brew install supabase/tap/supabase
```

## Installation

```bash
npm install @nxsupabase/supabase
```

## Quick Start

### 1. Initialize the plugin

```bash
nx g @nxsupabase/supabase:init
```

This registers the plugin in your `nx.json` and sets up target defaults.

### 2. Add Supabase to a project

```bash
nx g @nxsupabase/supabase:project --project=my-app
```

This creates:
- `apps/my-app/supabase/config.toml` - Supabase configuration
- `apps/my-app/supabase/migrations/` - Database migrations directory
- `apps/my-app/supabase/functions/` - Edge Functions directory
- `apps/my-app/supabase/seed.sql` - Seed data file

### 3. Start local development

```bash
nx run my-app:supabase-start
```

This starts the local Supabase stack (PostgreSQL, Auth, Storage, etc.) in Docker.

### 4. Create migrations

```bash
nx g @nxsupabase/supabase:migration --project=my-app --name=create_users_table
```

### 5. Generate TypeScript types

```bash
nx run my-app:supabase-gen-types
```

Types are cached by Nx and only regenerated when migrations change.

## Generators

### init

Initialize Supabase plugin in the workspace.

```bash
nx g @nxsupabase/supabase:init [options]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--skipInstall` | boolean | false | Skip CLI installation check |

### project

Add Supabase configuration to a project.

```bash
nx g @nxsupabase/supabase:project --project=<name> [options]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--project` | string | - | Target project name (required) |
| `--directory` | string | supabase | Supabase directory name |
| `--dbPort` | number | auto | Local database port |
| `--apiPort` | number | auto | Local API port |
| `--studioPort` | number | auto | Supabase Studio port |
| `--enableEdgeFunctions` | boolean | true | Create functions directory |

### migration

Create a new database migration.

```bash
nx g @nxsupabase/supabase:migration --project=<name> --name=<migration-name>
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--project` | string | - | Target project (required) |
| `--name` | string | - | Migration name in snake_case (required) |
| `--sql` | string | - | Initial SQL content |

### function

Create a new Supabase Edge Function.

```bash
nx g @nxsupabase/supabase:function --project=<name> --name=<function-name>
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--project` | string | - | Target project (required) |
| `--name` | string | - | Function name in kebab-case (required) |
| `--verifyJwt` | boolean | true | Require JWT verification |
| `--template` | string | basic | Template: basic, crud, webhook |

### seed

Create a database seed file.

```bash
nx g @nxsupabase/supabase:seed --project=<name>
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--project` | string | - | Target project (required) |
| `--name` | string | seed | Seed file name |

## Executors

### supabase-start

Start local Supabase containers.

```bash
nx run my-app:supabase-start
```

| Option | Type | Description |
|--------|------|-------------|
| `supabaseDirectory` | string | Path to supabase directory |
| `excludeServices` | string[] | Services to exclude |
| `debug` | boolean | Enable debug output |

### supabase-stop

Stop local Supabase containers.

```bash
nx run my-app:supabase-stop
```

| Option | Type | Description |
|--------|------|-------------|
| `supabaseDirectory` | string | Path to supabase directory |
| `noBackup` | boolean | Don't backup before stopping |

### supabase-status

Show local Supabase status and URLs.

```bash
nx run my-app:supabase-status
```

### supabase-db-reset

Reset local database and re-apply all migrations.

```bash
nx run my-app:supabase-db-reset
```

### supabase-gen-types

Generate TypeScript types from database schema.

```bash
nx run my-app:supabase-gen-types
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `supabaseDirectory` | string | - | Path to supabase directory |
| `outputPath` | string | src/types/supabase.ts | Output file path |
| `source` | string | local | Source: local, linked, db-url |
| `schemas` | string[] | ["public"] | Schemas to include |

### supabase-migrate

Run database migrations.

```bash
nx run my-app:supabase-migrate
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `target` | string | local | Target: local, remote |
| `dryRun` | boolean | false | Preview without applying |

### supabase-db-push

Push schema changes to remote Supabase project.

```bash
nx run my-app:supabase-db-push
```

| Option | Type | Description |
|--------|------|-------------|
| `dryRun` | boolean | Preview SQL without applying |
| `linkedProject` | string | Project ref override |
| `includeSeed` | boolean | Include seed data |

### supabase-deploy

Deploy Edge Functions and push migrations to Supabase cloud.

```bash
nx run my-app:supabase-deploy
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `projectRef` | string | - | Supabase project ID |
| `functions` | string[] | all | Specific functions to deploy |
| `deployFunctions` | boolean | true | Deploy Edge Functions |
| `pushMigrations` | boolean | true | Push migrations |

### supabase-functions-serve

Serve Edge Functions locally for development.

```bash
nx run my-app:supabase-functions-serve
```

## Multi-Project Support

The plugin supports multiple Supabase instances in a single monorepo. Each project gets unique ports automatically allocated to prevent conflicts.

```bash
# Start all Supabase instances
nx run-many -t supabase-start

# Generate types for all projects
nx run-many -t supabase-gen-types

# Affected projects only
nx affected -t supabase-db-reset
```

Ports are stored in `.nx/supabase-ports.json` for consistency across team members.

## Plugin Configuration

Configure the plugin in `nx.json`:

```json
{
  "plugins": [
    {
      "plugin": "@nxsupabase/supabase",
      "options": {
        "startTargetName": "supabase-start",
        "stopTargetName": "supabase-stop",
        "genTypesTargetName": "supabase-gen-types",
        "dbResetTargetName": "supabase-db-reset",
        "deployTargetName": "supabase-deploy"
      }
    }
  ]
}
```

## Project Inference

The plugin automatically detects projects with `supabase/config.toml` and adds appropriate targets. No manual configuration needed after running the project generator.

## Environment Variables

The plugin loads environment variables from:
1. Workspace root `.env`
2. Workspace root `.env.local`
3. Project `.env`
4. Project `.env.local`

Common variables:
- `SUPABASE_ACCESS_TOKEN` - For deployment
- `SUPABASE_DB_PASSWORD` - Remote database password
- `SUPABASE_PROJECT_REF` - Remote project reference

## TypeScript Types

Generated types are fully typed for the Supabase client:

```typescript
import { createClient } from '@supabase/supabase-js';
import { Database } from './types/supabase';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Fully typed queries
const { data } = await supabase.from('users').select('*');
```

## License

MIT
