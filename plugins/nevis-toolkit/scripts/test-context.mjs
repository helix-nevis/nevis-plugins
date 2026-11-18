import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const script = fileURLToPath(new URL('./inject-context.ts', import.meta.url));
const language = readFileSync(new URL('../skills/solution-delivery-loop/references/shared-language.md', import.meta.url), 'utf8');
function run(event) {
  return spawnSync(process.execPath, [script], { input: typeof event === 'string' ? event : JSON.stringify(event), encoding: 'utf8' });
}
for (const source of ['startup', 'resume', 'clear', 'compact', 'fork']) {
  const result = run({ hook_event_name: 'SessionStart', source });
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout).hookSpecificOutput;
  assert.equal(output.hookEventName, 'SessionStart');
  assert.ok(output.additionalContext.includes(language));
  assert.ok(output.additionalContext.length < 10000);
}
const target = run({ hook_event_name: 'SubagentStart', agent_type: 'nevis-toolkit:solution-auditor' });
assert.equal(target.status, 0, target.stderr);
assert.equal(JSON.parse(target.stdout).hookSpecificOutput.hookEventName, 'SubagentStart');
for (const agent_type of ['Explore', 'solution-auditor', 'other:solution-auditor']) {
  const result = run({ hook_event_name: 'SubagentStart', agent_type });
  assert.equal(result.status, 0);
  assert.equal(result.stdout, '');
}
for (const input of ['invalid', JSON.stringify({ hook_event_name: 'Other', prompt: 'DO_NOT_LEAK' })]) {
  const result = run(input);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.ok(!result.stderr.includes('DO_NOT_LEAK'));
}
console.log('Context tests passed: session sources, exact text, target isolation and safe errors.');
