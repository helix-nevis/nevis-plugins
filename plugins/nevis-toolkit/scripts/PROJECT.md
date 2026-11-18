# 项目初始化、路径配置与环境投影

Node.js 22.18+，无第三方依赖。`project-config.ts` 是配置解析的唯一实现；`project.ts` 提供 init、resolve、env 三个入口，`project-env.ts` 用于 SessionStart。项目配置不授予目录访问、写入、费用或实施权限。

## 持久配置契约 v1

治理根目录的 `.proj/project.json` 保存共享身份和位置关系：

```json
{
  "schemaVersion": 1,
  "projectId": "example-project",
  "name": "示例项目",
  "createdAt": "2026-11-18T00:00:00Z",
  "locations": [
    { "id": "governance", "role": "governance", "path": ".." },
    { "id": "web", "role": "implementation", "repository": "https://github.com/example/web.git" },
    { "id": "client-files", "role": "source" }
  ]
}
```

- schemaVersion 固定为 1；ID 使用字母、数字、点、下划线和连字符，项目 ID 最长 128 字符，位置 ID 最长 64 字符且唯一。
- 必须且只能有一个 governance，path 为 `..`，即配置所在 `.proj` 的父目录。所有共享 path 相对于配置所在目录解析，只接受相对路径。
- implementation、source 可多个或没有。未映射位置允许暂存，不证明路径可访问。
- repository 如填写，只接受无用户名、密码、查询参数和片段的 HTTPS URL。v1 不保存任意 shell 命令或环境键值，不存凭据。
- createdAt 是建档时间，不是业务项目启动时间。初始化生成 UUID；现有合法配置保留原样。

`.proj/project.local.json` 可将已声明的非治理位置映射为本机绝对路径：

```json
{
  "projectId": "example-project",
  "locationPaths": {
    "web": "E:/code/web",
    "client-files": "E:/客户资料"
  }
}
```

本机 projectId 必须与主配置一致；只允许 locationPaths 覆盖，不能增加未声明位置或改治理位置。初版不实现任意运行环境覆盖，运行命令仍引用项目脚本和有效规范。

## 入口与使用

收集并确认治理位置后，运行插件安装目录下的初始化工具（这里是本地开发路径）：

```bash
node E:/solution-delivery-loop/plugins/nevis-toolkit/scripts/project.ts init E:/project-governance "示例项目"
```

目标治理目录须已存在。工具只创建身份配置并补充 `.proj/.gitignore`，不预建空产物、不覆盖已有来源数据库或文档；其余产物由智能体根据实际内容维护。已有配置只校验并保留；新增资料入口可编辑 locations，本机路径写 local 配置。

```bash
node E:/solution-delivery-loop/plugins/nevis-toolkit/scripts/project.ts resolve E:/project-governance/.proj/project.json
```

```bash
node E:/solution-delivery-loop/plugins/nevis-toolkit/scripts/project.ts env E:/project-governance/.proj/project.json
```

env 输出三个正确转义的 POSIX export：NEVIS_PROJECT_ID、NEVIS_PROJECT_ROOT、NEVIS_PROJECT_CONFIG。不要直接拼接用户文本或使用 eval。需要在当前 Bash 工具调用中激活时，将受信任生成器输出写到临时脚本，再 source 并在同一调用内执行相关命令；普通 Bash 调用不保证变量延续至下一次调用。PowerShell 直接将 NEVIS_PROJECT_CONFIG 设置为已确认配置路径，或向工具传入配置参数。

## 发现与 Hook

读取优先级：显式 NEVIS_PROJECT_CONFIG → 显式 NEVIS_PROJECT_ROOT/.proj/project.json → cwd 向上最近的 .proj/project.json。显式值为空、无效或配置不合法时失败，不静默回退；不自动注册跨目录归属、不扫描磁盘。

SessionStart 加载已有配置，向 CLAUDE_ENV_FILE 追加 export，并通过 additionalContext 告知模型项目入口。无配置时静默，不猜测项目身份。首次填写发生在 SessionStart 之后：保存不会自动激活当前会话，先使用显式参数或同一次 Bash 的 source；新会话通过启动 Hook 恢复。v1 不注册 FileChanged/CwdChanged 自动重绑定，避免切目录时把会话误切到另一项目。

官方保证的 CLAUDE_ENV_FILE 用途是后续 Bash 命令；其他 Hook 不假定继承。捕获脚本独立使用相同解析器：显式启动变量或 cwd 可发现配置时进入治理目录，否则保留原就近 .proj/Git 根捕获规则。首次在治理目录外建档后，现有捕获 Hook 不会因 Bash source 自动重绑定；需以显式启动变量开启新会话。历史数据库不迁移、合并或重写，只在来源索引引用。

官方限制：PowerShell Hook 不提供 CLAUDE_ENV_FILE；Windows PowerShell 命令不接收该文件中包含 `/` 或 `\` 的变量值，sandboxed PowerShell 也不接收。因此路径必须有配置参数回退。环境文件是会话运行数据，不是项目权威配置，不把其临时文件位置持久化。

## 验证边界

`node scripts/test-project.mjs` 在独立临时目录测试初始化保护、多目录映射、缺失配置失败、shell 转义、环境输出与捕获路由。两个上下文 Hook 将非 ASCII 字符编码为 JSON Unicode 转义，避免 Windows shell 管道重编码破坏中文；解析后的正文保持一致。

2026-11-18，CLI 2.1.327 通过本地插件加载真实复测：启动时仅显式提供 NEVIS_PROJECT_CONFIG，SessionStart 报告已向环境文件追加变量；模型实际调用 Bash 的 printenv，取得 NEVIS_PROJECT_ID、NEVIS_PROJECT_ROOT、NEVIS_PROJECT_CONFIG，前两项由 Hook 配置解析生成。该会话的输入索引写入外部治理目录，数据库完整性正常。此验证覆盖新会话启动投影与治理目录外捕获，不覆盖首次建档后当前会话自动刷新、PowerShell 路径继承、市场安装版或全部事件来源。历史数据库未迁移。

官方依据：https://code.claude.com/docs/en/hooks#sessionstart
