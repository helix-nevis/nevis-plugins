# 项目配置与独立使用

本文件属于技能自包含内容。插件提供初始化、路径解析、环境投影和来源捕获脚本；仅复制技能目录时这些脚本、Hook 和审计角色不可用，但仍可按本文件人工建档和执行工作法，不要求安装插件才能讨论需求与方案。

## 人工建档回退

1. 确认治理位置、资料入口及实施位置，实施位置允许未定，不将当前会话目录自动认定为实施目录。
2. 先复用已有档案和权威位置；否则按实际内容建立项目档案、来源索引与导航，统一事项、证据及阶段产物按产物生命周期细则保存。不预建空文档，不创建或移动捕获数据库。
3. 无插件时可以在档案中记录项目身份和位置关系，明确绝对路径是本机映射。若需要与插件互通，可人工按以下契约保存配置，但不得声称已经经过脚本校验或激活环境。
4. 无 Hook 时，来源引用已有消息定位信息、文档章节或界面位置；不能编造 capture_id。独立审计可以由其他只读审查者执行，不要求存在插件专用 agent。

## 持久配置契约 v1

治理根目录下 `.proj/project.json`：

```json
{
  "schemaVersion": 1,
  "projectId": "example-project",
  "name": "示例项目",
  "createdAt": "2026-11-18T00:00:00Z",
  "locations": [
    { "id": "governance", "role": "governance", "path": ".." },
    { "id": "web", "role": "implementation" },
    { "id": "materials", "role": "source" }
  ]
}
```

字段仅有 schemaVersion、projectId、name、createdAt、locations。projectId 使用字母、数字、点、下划线和连字符，首字符为字母或数字，最长 128 字符；name 非空，时间为 ISO 建档时间。位置 ID 同样命名、最长 64 字符且唯一；角色为 governance、implementation 或 source。只能有一个 governance，path 为 `..`。共享 path 均相对于配置文件目录解析、不得为绝对路径。非治理位置可无 path，等待本机映射。repository 为可选的无用户名、密码、查询或片段的 HTTPS 引用。文本不能包含控制字符。

本机 `.proj/project.local.json` 只包含对应 projectId 和 locationPaths，映射已声明的非治理位置 ID 到本机绝对路径，不增加位置、不修改治理身份。不存凭据或任意环境命令；将该文件及来源 SQLite/WAL/SHM 加入项目忽略规则，不能假定本技能仓库的忽略规则会自动作用于使用项目。

```json
{
  "projectId": "example-project",
  "locationPaths": { "web": "E:/code/web" }
}
```

## 插件可选增强

插件内工具为 `scripts/project.ts`，相对于插件安装根目录；脚本路径不要硬编码为维护者的本机目录。可执行 `init <已存在的绝对治理目录> <项目名>`、`resolve <配置路径>`、`env <配置路径>`。操作前读取已有目标并保护原内容，初始化只补身份配置与忽略规则，后续档案由执行者维护。

发现顺序为显式 NEVIS_PROJECT_CONFIG、显式 NEVIS_PROJECT_ROOT、cwd 向上发现的 `.proj/project.json`。显式或已发现的配置无效时失败，不换项目。环境变量 NEVIS_PROJECT_ID、NEVIS_PROJECT_ROOT、NEVIS_PROJECT_CONFIG 是配置的会话投影，不是持久事实源。

SessionStart 的项目环境 Hook 向 CLAUDE_ENV_FILE 追加正确转义的 export，并提供项目上下文。首次会话完成配置不自动刷新；使用显式配置参数或同一次 Bash 的环境激活，新会话再由 Hook 恢复。捕获 Hook 不假定继承 Bash 设置；治理目录外启动需显式配置。PowerShell 路径继承有官方限制，使用显式参数回退。不自动迁移历史数据库或授予访问、修改权限。
