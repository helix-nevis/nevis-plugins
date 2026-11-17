import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { performance } from 'node:perf_hooks';

type PromptEvent = {
  hook_event_name: string;
  cwd: string;
  session_id: string;
  transcript_path: string;
  prompt: string;
  prompt_id?: string;
};

function parseEvent(value: unknown): PromptEvent | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid event');
  }
  const event = value as Record<string, unknown>;
  if (event.hook_event_name !== 'UserPromptSubmit') return null;
  for (const key of ['cwd', 'session_id', 'transcript_path', 'prompt']) {
    if (typeof event[key] !== 'string') throw new Error('Invalid event field');
  }
  if (event.prompt_id !== undefined && typeof event.prompt_id !== 'string') {
    throw new Error('Invalid prompt ID');
  }
  return event as PromptEvent;
}

function projectRoot(cwd: string): string {
  let directory = cwd;
  while (true) {
    const marker = join(directory, '.proj');
    if ((existsSync(marker) && statSync(marker).isDirectory()) ||
        existsSync(join(directory, '.git'))) return directory;
    const parent = dirname(directory);
    if (parent === directory) return cwd;
    directory = parent;
  }
}

async function capture(event: PromptEvent): Promise<void> {
  const cwd = realpathSync(event.cwd);
  if (!statSync(cwd).isDirectory()) throw new Error('Invalid working directory');
  const directory = join(projectRoot(cwd), '.proj', 'sources');
  mkdirSync(directory, { recursive: true });
  const database = join(directory, 'messages.sqlite3');
  const record = [
    randomUUID(), new Date().toISOString(), event.session_id,
    event.prompt_id || null, event.transcript_path, cwd,
    createHash('sha256').update(event.prompt, 'utf8').digest('hex'),
  ];
  const deadline = performance.now() + 10_000;
  while (true) {
    const connection = new DatabaseSync(database);
    try {
      connection.exec(`
        PRAGMA busy_timeout=500;
        PRAGMA foreign_keys=ON;
        PRAGMA journal_mode=WAL;
        PRAGMA synchronous=FULL;
        BEGIN IMMEDIATE;
        CREATE TABLE IF NOT EXISTS source_instances (
          instance_id TEXT PRIMARY KEY,
          singleton INTEGER UNIQUE CHECK(singleton=1)
        );
        CREATE TABLE IF NOT EXISTS messages (
          capture_id TEXT PRIMARY KEY, captured_at TEXT NOT NULL,
          session_id TEXT NOT NULL, prompt_id TEXT,
          transcript_path TEXT NOT NULL, cwd TEXT NOT NULL,
          prompt_sha256 TEXT NOT NULL,
          source_instance_id TEXT NOT NULL REFERENCES source_instances(instance_id)
        );
        CREATE INDEX IF NOT EXISTS messages_session_time
          ON messages(session_id, captured_at);
        CREATE INDEX IF NOT EXISTS messages_prompt ON messages(prompt_id);
      `);
      connection.prepare('INSERT OR IGNORE INTO source_instances VALUES (?, 1)')
        .run(randomUUID());
      connection.prepare(`INSERT INTO messages (
        capture_id, captured_at, session_id, prompt_id, transcript_path,
        cwd, prompt_sha256, source_instance_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?,
        (SELECT instance_id FROM source_instances WHERE singleton=1))`).run(...record);
      connection.exec('COMMIT');
      return;
    } catch (error) {
      const code = (error as { errcode?: number }).errcode;
      if (code === undefined || ![5, 6].includes(code & 255) ||
          performance.now() >= deadline) throw error;
    } finally {
      // Closing rolls back an unfinished transaction before retrying.
      connection.close();
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

async function main(): Promise<void> {
  try {
    const event = parseEvent(JSON.parse(readFileSync(0, 'utf8')));
    if (event) await capture(event);
  } catch {
    // Never include the event or prompt in diagnostic output.
    process.stderr.write('nevis-toolkit: message index capture failed\n');
    process.exitCode = 1;
  }
}

void main();
