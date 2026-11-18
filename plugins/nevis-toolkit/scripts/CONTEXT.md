# 工作法概念上下文加载

插件启用后，通过 `hooks/hooks.json` 的 `SessionStart` command Hook 调用 `inject-context.ts`。运行要求与捕获脚本相同：Node.js 22.18+，直接执行 TypeScript，无额外依赖或模型调用。

Hook 不设 matcher，覆盖官方 SessionStart 的 startup、resume、clear、compact、fork 来源。脚本从自身位置解析技能目录中的 `references/shared-language.md`，通过 `hookSpecificOutput.additionalContext` 注入全文；不依赖 cwd，不写数据库或项目文件。该文件是唯一概念正文，Skill 提供入口与缺少上下文时的读取回退。

注意：插件一启用即注册 Hook，不等工作法调用；因此相关会话会加载这些概念，但不自动执行工作法、不改变用户任务范围或授权。不是每条用户输入重复注入。项目业务术语仍由项目独立产物维护，按任务读取，不在此 Hook 中自动扫描或加载。

失败仅输出通用诊断并退出 1，不输出事件、消息或原始异常。用户输入捕获仍由原 UserPromptSubmit Hook 独立处理。

普通子智能体不能假定继承主线程上下文；委派时提供统一语言文件路径并明确读取要求。SessionStart 不等同于 SubagentStart，现已新增限定 `nevis-toolkit:solution-auditor` 的 SubagentStart 注入；脚本再次检查 agent_type，无关角色静默退出。2026-11-18 已通过本地 --plugin-dir 加载，在 CLI 2.1.327 实际观察到 SubagentStart:nevis-toolkit:solution-auditor 命中并成功返回 additionalContext。

本地验证：脚本对五种来源均输出有效 JSON，全文与来源文件一致，当前上下文低于官方 additionalContext 的 10,000 字符上限；无效输入不输出上下文且诊断不泄露消息。本地 CLI 新会话的 startup 与目标角色 SubagentStart 已真实触发；其他来源和非目标角色目前仅脚本测试覆盖。尚未验证市场安装版，也未做 TypeScript 静态类型检查。插件热重载是否触发 SessionStart 未作保证，验证安装效果应使用新会话。

官方依据：

- [插件不加载根目录 CLAUDE.md](https://code.claude.com/docs/en/plugins/components#skills)
- [SessionStart 与 additionalContext](https://code.claude.com/docs/en/hooks#sessionstart)
- [子智能体上下文](https://code.claude.com/docs/en/sub-agents)
