import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';

export type Location = { id: string; role: 'governance' | 'implementation' | 'source'; path?: string; repository?: string };
export type Project = { schemaVersion: 1; projectId: string; name: string; createdAt: string; locations: Location[] };
export type ResolvedProject = { configPath: string; root: string; project: Project; locationPaths: Record<string, string> };

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid object');
  return value as Record<string, unknown>;
}
function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || /[\x00-\x1f\x7f]/.test(value)) throw new Error('Invalid text');
  return value;
}
function keys(value: Record<string, unknown>, allowed: string[]): void {
  if (Object.keys(value).some(key => !allowed.includes(key))) throw new Error('Unknown field');
}
export function validateProject(value: unknown): Project {
  const p = object(value);
  keys(p, ['schemaVersion', 'projectId', 'name', 'createdAt', 'locations']);
  if (p.schemaVersion !== 1 || !Array.isArray(p.locations)) throw new Error('Invalid schema');
  const projectId = text(p.projectId);
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(projectId)) throw new Error('Invalid ID');
  text(p.name);
  if (!/^\d{4}-\d{2}-\d{2}T/.test(text(p.createdAt)) || !Number.isFinite(Date.parse(String(p.createdAt)))) throw new Error('Invalid date');
  const ids = new Set<string>();
  for (const entry of p.locations) {
    const loc = object(entry);
    keys(loc, ['id', 'role', 'path', 'repository']);
    const id = text(loc.id);
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(id) || ids.has(id)) throw new Error('Invalid location ID');
    ids.add(id);
    if (!['governance', 'implementation', 'source'].includes(String(loc.role))) throw new Error('Invalid role');
    if (loc.path !== undefined && isAbsolute(text(loc.path))) throw new Error('Shared paths must be relative');
    if (loc.repository !== undefined) {
      const repo = text(loc.repository);
      // Only portable credential-free HTTPS repository references in v1.
      const url = new URL(repo);
      if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('Invalid repository');
    }
  }
  const governance = p.locations.filter(entry => object(entry).role === 'governance');
  if (governance.length !== 1 || object(governance[0]).path !== '..') throw new Error('Governance must be config parent');
  return p as unknown as Project;
}

export function loadProject(configPath: string): ResolvedProject {
  if (!isAbsolute(configPath)) throw new Error('Config entry must be absolute');
  const actual = realpathSync(configPath);
  if (dirname(actual).split(/[\\/]/).at(-1) !== '.proj' || !actual.endsWith('project.json')) throw new Error('Invalid config position');
  const project = validateProject(JSON.parse(readFileSync(actual, 'utf8')));
  const root = realpathSync(resolve(dirname(actual), '..'));
  const locationPaths: Record<string, string> = Object.create(null);
  for (const loc of project.locations) if (loc.path !== undefined) locationPaths[loc.id] = resolve(dirname(actual), loc.path);
  const localPath = join(dirname(actual), 'project.local.json');
  if (existsSync(localPath)) {
    const local = object(JSON.parse(readFileSync(localPath, 'utf8')));
    keys(local, ['projectId', 'locationPaths']);
    if (local.projectId !== project.projectId) throw new Error('Project identity mismatch');
    const paths = object(local.locationPaths);
    for (const [id, path] of Object.entries(paths)) {
      const loc = project.locations.find(loc => loc.id === id);
      if (!loc || loc.role === 'governance' || !isAbsolute(text(path))) throw new Error('Invalid local mapping');
      locationPaths[id] = resolve(String(path));
    }
  }
  return { configPath: actual, root, project, locationPaths };
}

export function discoverProject(cwd: string, env: NodeJS.ProcessEnv = process.env): ResolvedProject | null {
  if (env.NEVIS_PROJECT_CONFIG !== undefined) return loadProject(text(env.NEVIS_PROJECT_CONFIG));
  if (env.NEVIS_PROJECT_ROOT !== undefined) {
    if (!isAbsolute(text(env.NEVIS_PROJECT_ROOT))) throw new Error('Project root must be absolute');
    return loadProject(join(env.NEVIS_PROJECT_ROOT, '.proj', 'project.json'));
  }
  let dir = realpathSync(cwd);
  if (!statSync(dir).isDirectory()) throw new Error('Invalid cwd');
  while (true) {
    const path = join(dir, '.proj', 'project.json');
    if (existsSync(path)) return loadProject(path);
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function projectVariables(p: ResolvedProject): Record<string, string> {
  return { NEVIS_PROJECT_ID: p.project.projectId, NEVIS_PROJECT_ROOT: p.root, NEVIS_PROJECT_CONFIG: p.configPath };
}
export function shellExports(p: ResolvedProject): string {
  // Data stays inside POSIX single quotes; embedded apostrophes are escaped without evaluation.
  return Object.entries(projectVariables(p)).map(([key, value]) => `export ${key}='${value.replaceAll("'", "'\\''")}'`).join('\n') + '\n';
}
