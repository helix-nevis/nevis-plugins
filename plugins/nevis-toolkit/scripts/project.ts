import { randomUUID } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { discoverProject, loadProject, shellExports } from './project-config.ts';

try {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'init') {
    const [rootArg, name] = args;
    if (!rootArg || !isAbsolute(rootArg) || !name?.trim()) throw new Error('Usage: init absolute-root name');
    const root = realpathSync(rootArg);
    const dir = join(root, '.proj');
    mkdirSync(dir, { recursive: true });
    const file = join(dir, 'project.json');
    if (existsSync(file)) {
      loadProject(file);
      process.stdout.write('Project already initialized; existing configuration preserved.\n');
    } else {
      const project = { schemaVersion: 1, projectId: randomUUID(), name, createdAt: new Date().toISOString(), locations: [{ id: 'governance', role: 'governance', path: '..' }] };
      if (/[\x00-\x1f\x7f]/.test(name)) throw new Error('Invalid name');
      writeFileSync(file, JSON.stringify(project, null, 2) + '\n', { flag: 'wx' });
      process.stdout.write('Project configuration created; collect locations before scanning.\n');
    }
    // Also repair missing exclusions on repeated initialization, preserving user content.
    const ignore = join(dir, '.gitignore');
    const previous = existsSync(ignore) ? readFileSync(ignore, 'utf8') : '';
    const patterns = ['project.local.json', 'sources/*.sqlite3', 'sources/*.sqlite3-wal', 'sources/*.sqlite3-shm'];
    const missing = patterns.filter(pattern => !previous.split(/\r?\n/).includes(pattern));
    if (missing.length) appendFileSync(ignore, (previous && !previous.endsWith('\n') ? '\n' : '') + missing.join('\n') + '\n');
  } else if (command === 'env') {
    const project = args[0] ? loadProject(resolve(args[0])) : discoverProject(process.cwd());
    if (!project) throw new Error('No project configuration');
    process.stdout.write(shellExports(project));
  } else if (command === 'resolve') {
    const project = args[0] ? loadProject(resolve(args[0])) : discoverProject(process.cwd());
    process.stdout.write(JSON.stringify(project, null, 2) + '\n');
  } else throw new Error('Unsupported command');
} catch {
  process.stderr.write('nevis-toolkit: project configuration operation failed\n');
  process.exitCode = 1;
}
