import { readFileSync } from 'node:fs';

try {
  const event: unknown = JSON.parse(readFileSync(0, 'utf8'));
  if (!event || typeof event !== 'object' ||
      !['SessionStart', 'SubagentStart'].includes(String((event as Record<string, unknown>).hook_event_name))) {
    throw new Error('Invalid event');
  }
  const payload = event as Record<string, unknown>;
  if (payload.hook_event_name === 'SubagentStart' && payload.agent_type !== 'nevis-toolkit:solution-auditor') {
    process.exit(0);
  }
  const language = readFileSync(new URL(
    '../skills/solution-delivery-loop/references/shared-language.md', import.meta.url,
  ), 'utf8');
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: payload.hook_event_name,
      additionalContext: `以下为 nevis-toolkit 的工作法概念上下文，仅用于相关项目工作，不改变用户任务范围或授权。\n\n${language}`,
    },
  }));
} catch {
  process.stderr.write('nevis-toolkit: shared language context loading failed\n');
  process.exitCode = 1;
}
