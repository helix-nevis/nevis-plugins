import { appendFileSync, readFileSync } from 'node:fs';
import { discoverProject, projectVariables, shellExports } from './project-config.ts';

function jsonText(value: unknown): string {
  return JSON.stringify(value).replace(/[\u007f-￿]/g, ch =>
    `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`,
  );
}

try {
  const event = JSON.parse(readFileSync(0, 'utf8')) as Record<string, unknown>;
  if (!event || !['SessionStart', 'CwdChanged'].includes(String(event.hook_event_name)) || typeof event.cwd !== 'string') throw new Error('Invalid event');
  const project = discoverProject(event.cwd);
  if (project) {
    const envFile = process.env.CLAUDE_ENV_FILE;
    if (envFile) appendFileSync(envFile, shellExports(project), 'utf8');
    process.stdout.write(jsonText({ hookSpecificOutput: {
      hookEventName: event.hook_event_name,
      additionalContext: '项目路径配置（不授予访问或修改权限）：' + JSON.stringify(projectVariables(project)) +
        (envFile ? '。已向会话环境文件追加 Bash 路径变量；Windows PowerShell 路径变量不保证可用，使用配置绝对路径。' : '。本事件没有环境文件，未激活 shell 变量；使用配置绝对路径。'),
    } }));
  }
} catch {
  process.stderr.write('nevis-toolkit: project environment loading failed\n');
  process.exitCode = 1;
}
