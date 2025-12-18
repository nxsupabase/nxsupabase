import { Tree, readJson, writeJson } from '@nx/devkit';
import { createHash } from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const detectPort = require('detect-port') as (port: number) => Promise<number>;

export interface PortConfig {
  dbPort: number;
  apiPort: number;
  studioPort: number;
  inbucketPort: number;
  shadowPort: number;
  poolerPort: number;
}

interface PortRegistry {
  projects: Record<string, PortConfig>;
}

const BASE_PORTS = {
  dbPort: 54322,
  apiPort: 54321,
  studioPort: 54323,
  inbucketPort: 54324,
};

// Smaller range to stay within valid port numbers (max 65535)
const PORT_RANGE_SIZE = 10;
const REGISTRY_PATH = '.nx/supabase-ports.json';

/**
 * Generate a deterministic port offset based on project name
 * This ensures consistent port allocation across team members
 */
function getProjectPortOffset(projectName: string): number {
  const hash = createHash('md5').update(projectName).digest('hex');
  // Use modulo to keep offset reasonable (max 100 projects * 10 = 1000 offset)
  const offset = parseInt(hash.substring(0, 4), 16) % 100;
  return offset * PORT_RANGE_SIZE;
}

/**
 * Calculate ports for a project
 */
function calculatePorts(projectName: string): PortConfig {
  const offset = getProjectPortOffset(projectName);

  return {
    dbPort: BASE_PORTS.dbPort + offset,
    apiPort: BASE_PORTS.apiPort + offset,
    studioPort: BASE_PORTS.studioPort + offset,
    inbucketPort: BASE_PORTS.inbucketPort + offset,
    shadowPort: BASE_PORTS.dbPort + offset + 50,
    poolerPort: BASE_PORTS.dbPort + offset + 10,
  };
}

/**
 * Find next available port starting from a given port
 */
async function findAvailablePort(startPort: number): Promise<number> {
  return detectPort(startPort);
}

/**
 * Load the port registry from the tree
 */
function loadRegistry(tree: Tree): PortRegistry {
  if (tree.exists(REGISTRY_PATH)) {
    return readJson<PortRegistry>(tree, REGISTRY_PATH);
  }
  return { projects: {} };
}

/**
 * Save the port registry to the tree
 */
function saveRegistry(tree: Tree, registry: PortRegistry): void {
  // Ensure .nx directory exists
  if (!tree.exists('.nx')) {
    tree.write('.nx/.gitkeep', '');
  }
  writeJson(tree, REGISTRY_PATH, registry);
}

/**
 * Get or allocate ports for a project
 */
export async function getAvailablePorts(
  tree: Tree,
  projectName: string,
  explicitPorts?: Partial<PortConfig>
): Promise<PortConfig> {
  // If explicit ports are provided, use them
  if (explicitPorts?.dbPort && explicitPorts?.apiPort && explicitPorts?.studioPort) {
    const ports: PortConfig = {
      dbPort: explicitPorts.dbPort,
      apiPort: explicitPorts.apiPort,
      studioPort: explicitPorts.studioPort,
      inbucketPort: explicitPorts.inbucketPort ?? explicitPorts.studioPort + 1,
      shadowPort: explicitPorts.dbPort + 50,
      poolerPort: explicitPorts.dbPort + 10,
    };
    return ports;
  }

  const registry = loadRegistry(tree);

  // If project already has allocated ports, return them
  if (registry.projects[projectName]) {
    return registry.projects[projectName];
  }

  // Calculate new ports based on project name hash
  const calculatedPorts = calculatePorts(projectName);

  // Verify ports are actually available, adjust if needed
  const ports: PortConfig = {
    dbPort: await findAvailablePort(calculatedPorts.dbPort),
    apiPort: await findAvailablePort(calculatedPorts.apiPort),
    studioPort: await findAvailablePort(calculatedPorts.studioPort),
    inbucketPort: await findAvailablePort(calculatedPorts.inbucketPort),
    shadowPort: await findAvailablePort(calculatedPorts.shadowPort),
    poolerPort: await findAvailablePort(calculatedPorts.poolerPort),
  };

  // Save to registry
  registry.projects[projectName] = ports;
  saveRegistry(tree, registry);

  return ports;
}

/**
 * Release ports when a project is removed
 */
export function releasePorts(tree: Tree, projectName: string): void {
  const registry = loadRegistry(tree);
  delete registry.projects[projectName];
  saveRegistry(tree, registry);
}

/**
 * Get all allocated ports
 */
export function getAllocatedPorts(tree: Tree): Record<string, PortConfig> {
  const registry = loadRegistry(tree);
  return registry.projects;
}
