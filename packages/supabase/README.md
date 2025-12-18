<div align="center">

# @nxsupabase/supabase

**Nx plugin for Supabase** - Automated migrations, type generation, and local dev setup for Nx monorepos.

[![npm version](https://img.shields.io/npm/v/@nxsupabase/supabase?style=flat-square&logo=npm)](https://www.npmjs.com/package/@nxsupabase/supabase)
[![License](https://img.shields.io/npm/l/@nxsupabase/supabase?style=flat-square)](https://opensource.org/licenses/MIT)

</div>

---

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Generators](#generators)
  - [init](#init)
  - [project](#project)
  - [migration](#migration)
  - [function](#function)
  - [seed](#seed)
- [Executors](#executors)
  - [supabase-start](#supabase-start)
  - [supabase-stop](#supabase-stop)
  - [supabase-status](#supabase-status)
  - [supabase-db-reset](#supabase-db-reset)
  - [supabase-gen-types](#supabase-gen-types)
  - [supabase-migrate](#supabase-migrate)
  - [supabase-db-push](#supabase-db-push)
  - [supabase-deploy](#supabase-deploy)
  - [supabase-functions-serve](#supabase-functions-serve)
- [Multi-Project Support](#multi-project-support)
- [Plugin Configuration](#plugin-configuration)
- [Project Inference](#project-inference)
- [Environment Variables](#environment-variables)
- [TypeScript Types](#typescript-types)
- [License](#license)

---

## Features

| Feature | Description |
|---------|-------------|
| **Generators** | Scaffold Supabase projects, migrations, and Edge Functions |
| **Executors** | Local development, database operations, and deployment |
| **Type Generation** | Automatic TypeScript types with Nx caching support |
| **Multi-Project** | Support multiple Supabase instances with automatic port management |
| **Project Inference** | Auto-detect Supabase configs via `createNodesV2` |
| **Docker Orchestration** | Full local Supabase stack management |

---

## Prerequisites

Before using this plugin, ensure you have:

- **Node.js** 18+ installed
- **Docker Desktop** installed and running - [Download](https://www.docker.com/products/docker-desktop/)
- **Supabase CLI** installed globally:

```bash
# Via npm
npm install -g supabase

# Via Homebrew (macOS)
brew install supabase/tap/supabase
```

---

## Installation

```bash
npm install @nxsupabase/supabase --save-dev
```

---

## Quick Start

### 1. Initialize the plugin

```bash
nx g @nxsupabase/supabase:init
```

This registers the plugin in your `nx.json` and sets up target defaults.

### 2. Add Supabase to a project

Simply run the generator and follow the interactive prompts:

```bash
nx g @nxsupabase/supabase:project
```

You'll be guided through:
- Selecting which project to add Supabase to
- Configuring the directory name
- Optionally linking to a remote Supabase project
- Enabling Edge Functions

This creates:

```
apps/my-app/
└── supabase/
    ├── config.toml       # Supabase configuration
    ├── migrations/       # Database migrations directory
    ├── functions/        # Edge Functions directory
    └── seed.sql          # Seed data file
```

### 3. Start local development

```bash
nx run my-app:supabase-start
```

This starts the local Supabase stack (PostgreSQL, Auth, Storage, Realtime, etc.) in Docker.

### 4. Create migrations

```bash
nx g @nxsupabase/supabase:migration --project=my-app --name=create_users_table
```

### 5. Generate TypeScript types

```bash
nx run my-app:supabase-gen-types
```

Types are cached by Nx and only regenerated when migrations change.

---

## Generators

### init

Initialize Supabase plugin in the workspace.

```bash
nx g @nxsupabase/supabase:init [options]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--skipInstall` | `boolean` | `false` | Skip CLI installation check |

---

### project

Add Supabase configuration to a project.

```bash
nx g @nxsupabase/supabase:project --project=<name> [options]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--project` | `string` | - | Target project name **(required)** |
| `--directory` | `string` | `supabase` | Supabase directory name |
| `--dbPort` | `number` | auto | Local database port |
| `--apiPort` | `number` | auto | Local API port |
| `--studioPort` | `number` | auto | Supabase Studio port |
| `--enableEdgeFunctions` | `boolean` | `true` | Create functions directory |

---

### migration

Create a new database migration.

```bash
nx g @nxsupabase/supabase:migration --project=<name> --name=<migration-name>
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--project` | `string` | - | Target project **(required)** |
| `--name` | `string` | - | Migration name in snake_case **(required)** |
| `--sql` | `string` | - | Initial SQL content |

**Example:**

```bash
nx g @nxsupabase/supabase:migration --project=my-app --name=create_posts_table --sql="CREATE TABLE posts (id uuid PRIMARY KEY DEFAULT gen_random_uuid());"
```

---

### function

Create a new Supabase Edge Function with interactive prompts:

```bash
nx g @nxsupabase/supabase:function
```

You'll be guided through selecting:
- Function name (kebab-case)
- Target project
- Template type (basic, crud, webhook, or x402)
- JWT authentication settings
- Payment settings (if x402 template selected)

**Available Templates:**

| Template | Description |
|----------|-------------|
| `basic` | Simple hello world function |
| `crud` | Database operations with Supabase client |
| `webhook` | Handle incoming webhook events |
| `x402` | Payment-required endpoint via [x402.org](https://x402.org) |

**Options (can also be passed as flags):**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--name` | `string` | - | Function name in kebab-case |
| `--project` | `string` | - | Target project |
| `--template` | `string` | `basic` | Template type |
| `--verifyJwt` | `boolean` | `true` | Require JWT verification |
| `--paymentAmount` | `string` | `0.01` | Payment amount in USD (x402 only) |
| `--paymentNetwork` | `string` | `base` | Blockchain network (x402 only) |

**Quick examples with flags:**

```bash
# Webhook function
nx g @nxsupabase/supabase:function --name=webhook-handler --template=webhook

# x402 paid endpoint
nx g @nxsupabase/supabase:function --name=premium-api --template=x402 --paymentAmount=0.05
```

#### x402 Payment Template

The `x402` template creates a payment-required Edge Function using the [x402 protocol](https://x402.org). This enables internet-native micropayments for your API endpoints.

```bash
nx g @nxsupabase/supabase:function --project=my-app --name=paid-endpoint --template=x402
```

**Setup:**
1. Set `X402_WALLET_ADDRESS` in your `.env` file
2. Configure payment amount with `--paymentAmount` (default: 0.01 USDC)
3. Choose network with `--paymentNetwork` (default: Base)

**How it works:**
- Requests without payment receive HTTP 402 with payment instructions
- Clients pay via x402-compatible wallets
- Payment is verified before executing your business logic

---

### seed

Create a database seed file.

```bash
nx g @nxsupabase/supabase:seed --project=<name>
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--project` | `string` | - | Target project **(required)** |
| `--name` | `string` | `seed` | Seed file name |

---

## Executors

### supabase-start

Start local Supabase containers.

```bash
nx run my-app:supabase-start
```

| Option | Type | Description |
|--------|------|-------------|
| `supabaseDirectory` | `string` | Path to supabase directory |
| `excludeServices` | `string[]` | Services to exclude (e.g., `["studio", "imgproxy"]`) |
| `debug` | `boolean` | Enable debug output |

---

### supabase-stop

Stop local Supabase containers.

```bash
nx run my-app:supabase-stop
```

| Option | Type | Description |
|--------|------|-------------|
| `supabaseDirectory` | `string` | Path to supabase directory |
| `noBackup` | `boolean` | Don't backup before stopping |

---

### supabase-status

Show local Supabase status and URLs.

```bash
nx run my-app:supabase-status
```

**Output includes:**
- API URL
- GraphQL URL
- Studio URL
- Inbucket URL
- JWT secret
- anon key
- service_role key

---

### supabase-db-reset

Reset local database and re-apply all migrations.

```bash
nx run my-app:supabase-db-reset
```

> **Warning:** This will delete all data in your local database!

---

### supabase-gen-types

Generate TypeScript types from database schema.

```bash
nx run my-app:supabase-gen-types
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `supabaseDirectory` | `string` | - | Path to supabase directory |
| `outputPath` | `string` | `src/types/supabase.ts` | Output file path |
| `source` | `string` | `local` | Source: `local`, `linked`, `db-url` |
| `schemas` | `string[]` | `["public"]` | Schemas to include |

---

### supabase-migrate

Run database migrations.

```bash
nx run my-app:supabase-migrate
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `target` | `string` | `local` | Target: `local`, `remote` |
| `dryRun` | `boolean` | `false` | Preview without applying |

---

### supabase-db-push

Push schema changes to remote Supabase project.

```bash
nx run my-app:supabase-db-push
```

| Option | Type | Description |
|--------|------|-------------|
| `dryRun` | `boolean` | Preview SQL without applying |
| `linkedProject` | `string` | Project ref override |
| `includeSeed` | `boolean` | Include seed data |

---

### supabase-deploy

Deploy Edge Functions and push migrations to Supabase cloud.

```bash
nx run my-app:supabase-deploy
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `projectRef` | `string` | - | Supabase project ID |
| `functions` | `string[]` | all | Specific functions to deploy |
| `deployFunctions` | `boolean` | `true` | Deploy Edge Functions |
| `pushMigrations` | `boolean` | `true` | Push migrations |

---

### supabase-functions-serve

Serve Edge Functions locally for development.

```bash
nx run my-app:supabase-functions-serve
```

This starts a local server for testing Edge Functions with hot reload.

---

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

---

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
        "statusTargetName": "supabase-status",
        "genTypesTargetName": "supabase-gen-types",
        "dbResetTargetName": "supabase-db-reset",
        "migrateTargetName": "supabase-migrate",
        "dbPushTargetName": "supabase-db-push",
        "deployTargetName": "supabase-deploy",
        "functionsServeTargetName": "supabase-functions-serve"
      }
    }
  ]
}
```

---

## Project Inference

The plugin automatically detects projects with `supabase/config.toml` and adds appropriate targets. No manual configuration needed after running the project generator.

**How it works:**

1. Plugin scans for `**/supabase/config.toml` files
2. Matches each config to its parent Nx project
3. Automatically registers all executor targets
4. Sets up proper caching and dependencies

---

## Environment Variables

The plugin loads environment variables from (in order of priority):

1. Workspace root `.env`
2. Workspace root `.env.local`
3. Project `.env`
4. Project `.env.local`

### Common Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_ACCESS_TOKEN` | For deployment authentication |
| `SUPABASE_DB_PASSWORD` | Remote database password |
| `SUPABASE_PROJECT_REF` | Remote project reference |

---

## TypeScript Types

Generated types are fully typed for the Supabase client:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/supabase';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Fully typed queries
const { data } = await supabase.from('users').select('*');
// TypeScript knows `data` is Array<Database['public']['Tables']['users']['Row']>

// Type-safe inserts
await supabase.from('posts').insert({
  title: 'Hello World',
  content: 'This is type-checked!'
});
```

### Generated Type Structure

```typescript
export type Database = {
  public: {
    Tables: {
      users: {
        Row: { id: string; email: string; created_at: string };
        Insert: { id?: string; email: string; created_at?: string };
        Update: { id?: string; email?: string; created_at?: string };
      };
      // ... other tables
    };
    Views: { /* ... */ };
    Functions: { /* ... */ };
    Enums: { /* ... */ };
  };
};
```

---

## License

MIT - see [LICENSE](../../LICENSE) for details.
