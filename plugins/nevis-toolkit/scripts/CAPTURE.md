# 用户输入来源索引

插件通过 `UserPromptSubmit` command hook 执行 `capture-input.ts`。只有一份 TypeScript 源码，Node 直接运行，无需编译步骤、不使用 npx、不安装第三方 SQLite 包。

## 环境要求

- Node.js **22.18.0 或更高**（该版本起默认启用 TypeScript 类型剥离），并使用内置 `node:sqlite`。
- 原生 Claude Code 不保证自带可供 Hook 使用的 Node.js，须自行安装。
- `scripts/package.json` 声明 `type: module`，避免模块格式随上层目录变化。
- 类型剥离只删除类型标注，不做类型检查；这里仅使用可剥离的语法。

## 加载验证

从终端加载本地开发版插件：

```bash
claude --plugin-dir E:/solution-delivery-loop/plugins/nevis-toolkit
```

在测试项目发送消息。脚本从事件 cwd 向上查找最近的 `.proj/` 或 Git 根目录；都不存在时使用 cwd，自动创建 `.proj/sources/messages.sqlite3`。

## 记录内容

每次捕获新增一行 `messages`：

| 字段 | 说明 |
| --- | --- |
| `capture_id` | UUID，项目侧稳定来源编号 |
| `captured_at` | UTC 捕获时间 |
| `session_id` | 会话标识 |
| `prompt_id` | 一轮输入的相关标识，**定位主键** |
| `transcript_path` | 本机会话记录路径，迁移时允许重新映射 |
| `cwd` | 捕获时的工作目录 |
| `prompt_sha256` | Hook 收到的 prompt 文本哈希，**仅作辅助校验** |
| `source_instance_id` | 该索引数据库的稳定身份 |

不存正文、摘要、业务关联或处理进度，不调用模型。`source_instance_id` 不代表机器或客户端身份；复制数据库保留它，不同项目数据库各自生成。

## 如何取回原文

实测结论（2026-11-17，Claude Code 2.1.317，desktop_app）：

1. **用 `prompt_id` 定位**。它在会话记录中命中该轮的 `user` 记录；其中 `origin.kind == "human"` 的那条带真实消息 `uuid`、完整时间与原始内容。对 `prompt_id` 建了索引。
2. **不要用 `prompt_sha256` 去匹配 `user` 记录的文本**。Hook 收到的 prompt 与 `user` 记录中的内容格式不同：斜杠命令会被包装成 `<command-message>` 等标签，导致哈希不一致。
3. **哈希匹配的是 `queue-operation` 的 `enqueue` 记录**。实测该记录内容与 Hook 的 prompt 逐字节一致，哈希可对上。它适合做完整性校验，但不像 `prompt_id` 那样能直接指向带 `uuid` 的正式消息。
4. 会话记录是异步写入的，捕获瞬间可能还查不到对应记录；取回时应有等待或重试。

因此：**`prompt_id` 负责定位，`prompt_sha256` 负责校验。**两者都缺时，只能按 `session_id` 与时间窗口做近似定位，并明确标注不确定性。

## 并发和失败

WAL、FULL synchronous、短事务、500 毫秒 `busy_timeout`，锁冲突最多重试约 10 秒。Hook 超时 15 秒。成功静默；失败打印不含事件内容的通用错误并退出 1，不主动阻断输入。

实测 8 个进程同时写入同一空数据库：8 条全部写入，`capture_id` 全唯一，来源实例仅 1 个，`integrity_check` 为 ok。

每次触发都新增记录，不按文本哈希去重——重复文字可能是真实的不同消息。重试事件去重尚未实现。

多 worktree 不自动共享数据库。这里只按上述规则定位本机数据库，不实现跨机器同步。

## 已验证范围

2026-11-17 实测通过：

- 真实会话中 Hook 触发并写入 1 条记录，字段与结构符合设计；
- `journal_mode=wal`、`integrity_check=ok`；
- 8 进程并发写入完整；
- Node 24 直接运行 `.ts` 成功；
- 数据库无正文列，失败信息不含消息内容。

仍未完成：用 `prompt_id` 自动化取回原文的实现、附件处理、导出与迁移合并。TypeScript 未做静态类型检查（类型剥离不检查类型）。

## 边界

这里只登记来源索引。会话记录可能异步写入，`transcript_path` 在迁移后失效，须按迁移规则重新映射。导出应通过 SQLite 备份接口生成一致快照，不要在写入期间只复制主数据库。

数据库及 WAL/SHM 文件不是供 Git 合并的普通文本；仓库 `.gitignore` 已忽略 `**/.proj/sources/*.sqlite3*`。
