# @nxsupabase/supabase

[![npm version](https://badge.fury.io/js/%40nxsupabase%2Fsupabase.svg)](https://www.npmjs.com/package/@nxsupabase/supabase)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Nx plugin for Supabase - Automated migrations, type generation, and local dev setup for Nx monorepos.

## Features

- **Generators** for scaffolding Supabase projects, migrations, and Edge Functions
- **Executors** for local development, database operations, and deployment
- **Automatic type generation** with Nx caching support
- **Multi-project support** with automatic port management
- **Project inference** via createNodesV2 (auto-detect Supabase configs)
- **Full Docker orchestration** for local Supabase instances

## Installation

```bash
npm install @nxsupabase/supabase
```

## Quick Start

```bash
# Initialize the plugin
nx g @nxsupabase/supabase:init

# Add Supabase to a project
nx g @nxsupabase/supabase:project --project=my-app

# Start local development
nx run my-app:supabase-start

# Create migrations
nx g @nxsupabase/supabase:migration --project=my-app --name=create_users_table

# Generate TypeScript types
nx run my-app:supabase-gen-types
```

## Documentation

See the full documentation in [packages/supabase/README.md](./packages/supabase/README.md).

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed globally

## License

MIT
